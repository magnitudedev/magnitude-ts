import { TestRunResult, Problem } from './dataWrappers';
import { TestCase } from './testCase';
import logUpdate from 'log-update';

export class TestRenderer {
    private spinnerFrameIndex: number = 0;
    private spinnerFrames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    private renderInterval: NodeJS.Timeout | null = null;
    private lastRun: TestRunResult | null = null;
    private testCase: TestCase | null = null;
    private isActive: boolean = false;
    
    constructor() {}
    
    /**
     * Start continuous rendering with animation, even before test data is available
     */
    public startRendering(testCase: TestCase): void {
        // Store the test data (might be null initially)
        this.testCase = testCase;
        this.isActive = true;
        
        // Start the render loop if not already running
        if (!this.renderInterval) {
            this.renderInterval = setInterval(() => {
                if (this.isActive && this.testCase) {
                    this.renderFrame();
                    
                    // If test is done, stop the render loop
                    if (this.lastRun?.isDone()) {
                        this.stopRendering();
                    }
                }
            }, 100); // Update every 100ms for smooth animation
        }
    }
    
    /**
     * Stop the continuous rendering
     */
    public stopRendering(): void {
        this.isActive = false;
        if (this.renderInterval) {
            clearInterval(this.renderInterval);
            this.renderInterval = null;
        }
        
        // Render one final frame to show the completed state
        if (this.lastRun && this.testCase) {
            this.renderFrame();
        }
        
        // Just call logUpdate.done() to preserve the last frame
        // without printing any additional output
        logUpdate.done();
    }
    
    /**
     * Update the test data without restarting the render loop
     */
    public updateData(run: TestRunResult): void {
        this.lastRun = run;
    }
    
    /**
     * Render a single frame of the display
     */
    private renderFrame(): void {
        if (!this.testCase) return;
        
        // Increment spinner frame
        this.spinnerFrameIndex = (this.spinnerFrameIndex + 1) % this.spinnerFrames.length;
        
        // Get current spinner frame
        const spinner = this.spinnerFrames[this.spinnerFrameIndex];
        
        // Build output lines
        const lines: string[] = [];
        
        if (!this.lastRun) {
            // Simple starting message
            lines.push(`${spinner} Test: ${this.testCase.toData().name}`);
            lines.push(`Test run starting...`);
        } else {
            const data = this.lastRun.getRawData();
            const steps = data.steps;
            const actions = data.actions || [];
            const totalSteps = steps.length;
            const currentStepIndex = steps.findIndex(s => s.status === "pending");
            const activeStepIndex = currentStepIndex >= 0 ? currentStepIndex : totalSteps - 1;
            const actionCount = actions.length;
            
            // Get current spinner frame (only show if test is still running)
            const displaySpinner = !this.lastRun.isDone() ? spinner : '';
            
            // 1. Display test name and status with spinner
            const status = this.lastRun.isDone() 
                ? (this.lastRun.hasPassed() ? "PASSED" : "FAILED") 
                : "RUNNING";
            lines.push(`${displaySpinner} Test: ${this.testCase.toData().name} [${status}]`);
            
            // 2. Progress bar for steps
            const progressBar = this.createProgressBar(activeStepIndex + 1, totalSteps);
            lines.push(`${progressBar} Step ${activeStepIndex + 1}/${totalSteps} | Actions: ${actionCount}`);
            
            // 3. Recent actions list
            lines.push(`\nRecent Actions:`);
            const recentActions = actions.slice(-5); // Show last 5 actions
            if (recentActions.length === 0) {
                lines.push(`  No actions yet`);
            } else {
                for (const action of recentActions) {
                    lines.push(`  - ${action.variant}: ${action.description}`);
                }
            }
            
            // 4. Steps and checks progress
            lines.push(`\nProgress:`);
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepStatus = this.getStatusSymbol(step.status);
                const isCurrentStep = i === activeStepIndex;
                
                lines.push(`${isCurrentStep ? "→" : " "} ${stepStatus} Step ${i + 1}: ${step.description}`);
                
                // Show checks for this step
                for (const check of step.checks) {
                    const checkStatus = this.getStatusSymbol(check.status);
                    lines.push(`    ${checkStatus} Check: ${check.description}`);
                }
            }
            
            // 5. Problems section at the bottom
            const problems = this.lastRun.getProblems();
            if (problems.length > 0) {
                lines.push(`\nProblems:`);
                for (const problem of problems) {
                    const severity = problem.getSeverity();
                    const severitySymbol = this.getSeveritySymbol(severity);
                    lines.push(`  ${severitySymbol} ${problem.getTitle()} (${severity})`);
                    lines.push(`    Expected: ${problem.getExpectedResult()}`);
                    lines.push(`    Actual: ${problem.getActualResult()}`);
                }
            }
        }
        
        // Get terminal width (default to 80 if not available)
        const terminalWidth = process.stdout.columns || 80;
        
        // Format lines to respect terminal width without splitting words
        const formattedLines = lines.map(line => {
            // If line is shorter than terminal width, return as is
            if (line.length <= terminalWidth) {
                return line;
            }
            
            // For longer lines, we need to wrap them
            // This is a simple implementation that doesn't split words
            let result = '';
            let currentLine = '';
            
            // Split by words
            const words = line.split(' ');
            
            for (const word of words) {
                // If adding this word would exceed terminal width
                if ((currentLine + word).length + 1 > terminalWidth) {
                    // Add current line to result and start a new line
                    result += (result ? '\n' : '') + currentLine;
                    currentLine = word;
                } else {
                    // Add word to current line
                    currentLine += (currentLine ? ' ' : '') + word;
                }
            }
            
            // Add the last line
            if (currentLine) {
                result += (result ? '\n' : '') + currentLine;
            }
            
            return result;
        });
        
        // Update the display with all formatted lines joined
        logUpdate(formattedLines.join('\n'));
    }
    
    private createProgressBar(current: number, total: number): string {
        const width = 30;
        const filled = Math.floor((current / total) * width);
        const empty = width - filled;
        
        return `[${"=".repeat(filled)}>${" ".repeat(Math.max(0, empty))}]`;
    }
    
    private getStatusSymbol(status: "pending" | "passed" | "failed"): string {
        switch (status) {
            case "passed": return "✓";
            case "failed": return "✗";
            case "pending": return "⋯";
            default: return "?";
        }
    }
    
    private getSeveritySymbol(severity: "critical" | "high" | "medium" | "low" | "cosmetic"): string {
        switch (severity) {
            case "critical": return "🔴";
            case "high": return "🟠";
            case "medium": return "🟡";
            case "low": return "🟢";
            case "cosmetic": return "🔵";
            default: return "⚪";
        }
    }
}
