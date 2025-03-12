import { TestCase } from '../testCase';
import { TestRegistry } from './testRegistry';
import { TestRenderer } from '../testRenderer';
import { TestRuntime } from '../testRuntime';
import logUpdate from 'log-update';
import chalk from 'chalk';

// Define test status types
type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

// Interface to track test execution state
interface TestExecutionState {
    testCase: TestCase;
    status: TestStatus;
    displayName: string; // The original ID to display to the user
    renderer?: TestRenderer;
    startTime?: number;
    endTime?: number;
    error?: Error;
    url?: string; // URL of the test, available when running or completed
}

const magnitudeBlue = chalk.hex('#0369a1');
const brightMagnitudeBlue = chalk.hex('#42bafb');

export class TestViewer {
    private registry: TestRegistry;
    private testStates: Map<string, TestExecutionState> = new Map();
    private spinnerFrameIndex: number = 0;
    private spinnerFrames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    private renderInterval: NodeJS.Timeout | null = null;
    private filesLoaded: Set<string> = new Set();
    private activeRuntimes: Map<string, TestRuntime> = new Map();
    private testRenderers: Map<string, TestRenderer> = new Map();
    
    constructor() {
        this.registry = TestRegistry.getInstance();
    }

    /**
     * Add a file to the list of loaded files
     */
    public addLoadedFile(filePath: string): void {
        this.filesLoaded.add(filePath);
    }

    /**
     * Initialize test states for all registered tests using the provided render IDs
     */
    public initializeTestStatesWithRenderIds(testStateData: Array<{
        renderId: string;
        testCase: TestCase;
        originalId: string;
    }>): void {
        // Clear any existing test states first
        this.testStates.clear();
        this.activeRuntimes.clear();
        this.testRenderers.clear();
        
        // Initialize states with the provided render IDs and test cases
        for (const { renderId, testCase, originalId } of testStateData) {
            this.testStates.set(renderId, {
                testCase,
                displayName: originalId, // Store the original ID for display
                status: 'pending'
            });
        }
    }

    /**
     * Initialize test states for all registered tests
     * This method is maintained for backwards compatibility
     */
    public initializeTestStates(): void {
        // Clear any existing test states first
        this.testStates.clear();
        this.activeRuntimes.clear();
        this.testRenderers.clear();
        
        const testCases = this.registry.getRegisteredTestCases();

        // Initialize all tests from registry
        for (const filePath in testCases) {
            // Initialize ungrouped tests
            for (const test of testCases[filePath].ungrouped) {
                const testId = test.getId();
                
                this.testStates.set(testId, {
                    testCase: test,
                    displayName: testId,
                    status: 'pending'
                });
            }
            
            // Initialize grouped tests
            for (const groupName in testCases[filePath].groups) {
                for (const test of testCases[filePath].groups[groupName]) {
                    const testId = test.getId();
                    
                    this.testStates.set(testId, {
                        testCase: test,
                        displayName: testId,
                        status: 'pending'
                    });
                }
            }
        }
    }

    /**
     * Update the status of a test
     */
    public updateTestStatus(testId: string, status: TestStatus, error?: Error): void {
        const state = this.testStates.get(testId);
        
        if (!state) {
            // If state doesn't exist for some reason, try to find the test case
            const testCase = this.findTestCaseById(testId);
            
            if (testCase) {
                // Create a new state for this test
                this.testStates.set(testId, {
                    testCase,
                    displayName: testCase.getId(), // Use the original ID for display
                    status,
                    ...(status === 'running' ? { 
                        startTime: Date.now(),
                        url: testCase.getUrl() // Store the basic URL when starting
                    } : {}),
                    ...(status === 'failed' && error ? { error } : {})
                });
            } else {
                console.warn(`Warning: Test not found for ID ${testId}, cannot update status`);
            }
        } else {
            // Normal update flow
            state.status = status;
            
            if (status === 'running') {
                state.startTime = Date.now();
                
                // Store the URL when starting the test
                if (!state.url) {
                    state.url = state.testCase.getUrl();
                }
            } else if (status === 'passed' || status === 'failed') {
                state.endTime = Date.now();
                if (status === 'failed' && error) {
                    state.error = error;
                }
                
                // We don't need to manually set the URL here.
                // The URL is already updated by the onProgress callback in registerRuntime
            }
        }
    }

    /**
     * Find a test case by its ID
     */
    private findTestCaseById(testId: string): TestCase | null {
        const testCases = this.registry.getRegisteredTestCases();
        
        // Search all test cases for one with a matching ID
        for (const filePath in testCases) {
            // Search ungrouped tests
            for (const test of testCases[filePath].ungrouped) {
                if (test.getId() === testId) {
                    return test;
                }
            }
            
            // Search grouped tests
            for (const groupName in testCases[filePath].groups) {
                for (const test of testCases[filePath].groups[groupName]) {
                    if (test.getId() === testId) {
                        return test;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Get a test renderer for the given test
     */
    public getTestRenderer(testId: string): TestRenderer | undefined {
        const state = this.testStates.get(testId);
        
        if (state) {
            if (!state.renderer) {
                state.renderer = new TestRenderer();
            }
            return state.renderer;
        }
        return undefined;
    }

    /**
     * Start continuous rendering of the test tree
     */
    public startRendering(): void {
        // Clear previous render interval if it exists
        if (this.renderInterval) {
            clearInterval(this.renderInterval);
        }

        this.renderInterval = setInterval(() => {
            this.renderTestTree();
        }, 100); // Update every 100ms for smooth animation
    }

    /**
     * Register a runtime for a test case
     */
    public registerRuntime(testId: string, runtime: TestRuntime): void {
        this.activeRuntimes.set(testId, runtime);
        
        // Mark the runtime as managed by TestViewer so it doesn't start its own rendering
        runtime.setManagedByViewer(true);
        
        // Create a dedicated TestRenderer for this test if it doesn't already exist
        if (!this.testRenderers.has(testId)) {
            const state = this.testStates.get(testId);
            if (state) {
                const renderer = new TestRenderer();
                // Initialize it with the test case
                renderer.updateTestCase(state.testCase);
                this.testRenderers.set(testId, renderer);
                
                // Set up onProgress callback to update the renderer data only, not trigger rendering
                runtime.onProgress((run) => {
                    const renderer = this.testRenderers.get(testId);
                    if (renderer) {
                        renderer.updateData(run);
                    }
                    
                    // Update the URL in the test state when it becomes available
                    const state = this.testStates.get(testId);
                    if (state) {
                        try {
                            // Get the URL from the TestRunResult
                            state.url = run.getUrl();
                        } catch (err) {
                            // URL might not be available yet, that's ok
                        }
                    }
                });
            }
        }
    }

    /**
     * Unregister a runtime for a test case
     */
    public unregisterRuntime(testId: string): void {
        // Unmark the runtime as managed by TestViewer (if it still exists)
        const runtime = this.activeRuntimes.get(testId);
        if (runtime) {
            runtime.setManagedByViewer(false);
        }
        
        this.activeRuntimes.delete(testId);
        
        // Keep the renderer for displaying final results
        // this.testRenderers.delete(testId);
    }

    /**
     * Stop the continuous rendering
     */
    public stopRendering(): void {
        if (this.renderInterval) {
            clearInterval(this.renderInterval);
            this.renderInterval = null;
        }

        // Render one final frame to show the completed state
        this.renderTestTree();
        
        // Show a summary of failed tests if any
        const failedTests = Array.from(this.testStates.entries())
            .filter(([_, state]) => state.status === 'failed')
            .map(([id, state]) => ({id, error: state.error}));
            
        if (failedTests.length > 0) {
            console.log(chalk.redBright(`\n${failedTests.length} tests failed:`));
            failedTests.forEach(({id, error}) => {
                console.log(`  ${chalk.redBright('✗')} ${id}`);
                if (error) {
                    console.log(`    ${chalk.gray(error.message)}`);
                }
            });
        } else {
            const passedTests = Array.from(this.testStates.entries())
                .filter(([_, state]) => state.status === 'passed');
                
            if (passedTests.length > 0) {
                console.log(chalk.greenBright(`\nAll ${passedTests.length} tests passed!`));
            }
        }
        
        logUpdate.done();
    }

    /**
     * Get the appropriate status symbol
     */
    private getStatusSymbol(status: TestStatus): string {
        switch (status) {
            case 'pending':
                return chalk.gray('◯');
            case 'running':
                const frame = this.spinnerFrames[this.spinnerFrameIndex];
                return brightMagnitudeBlue(frame);
            case 'passed':
                return chalk.greenBright('✓');
            case 'failed':
                return chalk.redBright('✗');
            default:
                return '?';
        }
    }

    /**
     * Format elapsed time in a human-readable way
     */
    private formatElapsedTime(ms: number): string {
        if (!ms) return '00:00';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        return `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    /**
     * Render the test tree and active tests
     */
    private renderTestTree(): void {
        // Increment spinner frame for animations
        this.spinnerFrameIndex = (this.spinnerFrameIndex + 1) % this.spinnerFrames.length;
        
        const testCases = this.registry.getRegisteredTestCases();
        const lines: string[] = [];

        // Count tests and their statuses
        let runningCount = 0;
        let passedCount = 0;
        let failedCount = 0;
        let pendingCount = 0;
        
        // Collect all running tests for later display
        const runningTests: string[] = [];
        
        // Count by iterating through the test states
        for (const [renderId, state] of this.testStates) {
            if (state.status === 'running') {
                runningCount++;
                runningTests.push(renderId);
            }
            else if (state.status === 'passed') passedCount++;
            else if (state.status === 'failed') failedCount++;
            else if (state.status === 'pending') pendingCount++;
        }
        
        const totalCount = this.testStates.size;
        const statusLine = `${chalk.greenBright(`✓ ${passedCount} passed`)} ${chalk.redBright(`✗ ${failedCount} failed`)} ${brightMagnitudeBlue(`◌ ${runningCount} running`)} ${chalk.gray(`◯ ${pendingCount} pending`)}`;
        
        lines.push(brightMagnitudeBlue(`=== Running ${totalCount} Tests with Magnitude ===`));
        lines.push(statusLine);

        lines.push('');
        
        // First, create a map of test cases to test states for reverse lookup
        // We need this to find the states for tests in the registry structure
        const statesByTest = new Map<TestCase, {renderId: string, state: TestExecutionState}>();
        
        for (const [renderId, state] of this.testStates.entries()) {
            statesByTest.set(state.testCase, {renderId, state});
        }
        
        // Render using the registry's structure
        for (const filePath in testCases) {
            lines.push(`${magnitudeBlue('▣')} ${chalk.bold(filePath)}`);
            
            // Render ungrouped tests
            for (const test of testCases[filePath].ungrouped) {
                const testInfo = statesByTest.get(test);
                if (!testInfo) continue; // Skip if we don't have state for this test
                
                const { renderId, state } = testInfo;
                const statusSymbol = this.getStatusSymbol(state.status);
                
                let timingInfo = '';
                if (state.status === 'running' && state.startTime) {
                    const elapsed = Date.now() - state.startTime;
                    timingInfo = chalk.blackBright(` [${this.formatElapsedTime(elapsed)}]`);
                } else if ((state.status === 'passed' || state.status === 'failed') && state.startTime && state.endTime) {
                    const duration = state.endTime - state.startTime;
                    timingInfo = chalk.blackBright(` [${this.formatElapsedTime(duration)}]`);
                }
                
                // Highlight all running tests
                const isRunning = state.status === 'running';
                const displayName = state.displayName;
                let testLine = `  ${statusSymbol} ${isRunning ? brightMagnitudeBlue(displayName) : displayName}${timingInfo}`;

                // Add URL if available
                if (state.url && (state.status === 'running' || state.status === 'passed' || state.status === 'failed')) {
                    testLine += chalk.gray(` → ${state.url}`);
                }

                lines.push(testLine);
            }
            
            // Render grouped tests by group name
            for (const groupName in testCases[filePath].groups) {
                lines.push(`  ${magnitudeBlue('◉')} ${chalk.bold(groupName)}`);
                
                for (const test of testCases[filePath].groups[groupName]) {
                    const testInfo = statesByTest.get(test);
                    if (!testInfo) continue; // Skip if we don't have state for this test
                    
                    const { renderId, state } = testInfo;
                    const statusSymbol = this.getStatusSymbol(state.status);
                    
                    let timingInfo = '';
                    if (state.status === 'running' && state.startTime) {
                        const elapsed = Date.now() - state.startTime;
                        timingInfo = chalk.blackBright(` [${this.formatElapsedTime(elapsed)}]`);
                    } else if ((state.status === 'passed' || state.status === 'failed') && state.startTime && state.endTime) {
                        const duration = state.endTime - state.startTime;
                        timingInfo = chalk.blackBright(` [${this.formatElapsedTime(duration)}]`);
                    }
                    
                    // Highlight all running tests
                    const isRunning = state.status === 'running';
                    const displayName = state.displayName;
                    let testLine = `    ${statusSymbol} ${isRunning ? brightMagnitudeBlue(displayName) : displayName}${timingInfo}`;

                    // Add URL if available
                    if (state.url && (state.status === 'running' || state.status === 'passed' || state.status === 'failed')) {
                        testLine += chalk.gray(` → ${state.url}`);
                    }

                    lines.push(testLine);
                }
            }
        }
        
        // Add a separator before test details
        lines.push('');

        // Show all running tests
        if (runningTests.length > 0) {
            lines.push(brightMagnitudeBlue('=== Currently Running Tests ==='));
            lines.push('');
            
            // Show details for each running test
            for (const testId of runningTests) {
                if (this.testRenderers.has(testId)) {
                    const state = this.testStates.get(testId);
                    if (state) {
                        // Add the test name as a header
                        lines.push(brightMagnitudeBlue(`[Test: ${state.displayName}]`));
                        
                        // Get the output from the test renderer
                        const renderer = this.testRenderers.get(testId)!;
                        const renderedOutput = renderer.getRenderedOutput();
                        
                        // Add the rendered output, indenting each line
                        renderedOutput.split('\n').forEach(line => {
                            lines.push(`  ${line}`);
                        });
                        
                        // Add a separator between tests
                        lines.push('');
                    }
                }
            }
        }
        
        // We are the ONLY component that should call logUpdate
        // This ensures there's no flashing or overlap in rendering
        logUpdate(lines.join('\n'));
    }
} 