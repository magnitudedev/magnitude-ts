import { TestRunResult, Problem } from './dataWrappers';
import { TestCase } from './testCase';

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
        //this.lastRun = run;
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
        
        // Clear previous output
        console.clear();
        
        // Get current spinner frame
        const spinner = this.spinnerFrames[this.spinnerFrameIndex] + ' ';
        
        // If we don't have test data yet, show a simple loading message
        if (!this.lastRun) {
            console.log(`${spinner}Test: ${this.testCase.toData().name}`);
            console.log("\nTest run starting...");
            return;
        }
        
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
        console.log(`${displaySpinner}Test: ${this.testCase.toData().name} [${this.lastRun.isDone() ? (this.lastRun.hasPassed() ? "PASSED" : "FAILED") : "RUNNING"}]`);
        
        // 2. Progress bar for steps
        const progressBar = this.createProgressBar(activeStepIndex + 1, totalSteps);
        console.log(`${progressBar} Step ${activeStepIndex + 1}/${totalSteps} | Actions: ${actionCount}`);
        
        // 3. Recent actions list
        console.log("\nRecent Actions:");
        const recentActions = actions.slice(-5); // Show last 5 actions
        if (recentActions.length === 0) {
            console.log("  No actions yet");
        } else {
            for (const action of recentActions) {
                console.log(`  - ${action.variant}: ${action.description}`);
            }
        }
        
        // 4. Steps and checks progress
        console.log("\nProgress:");
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepStatus = this.getStatusSymbol(step.status);
            const isCurrentStep = i === activeStepIndex;
            
            console.log(`${isCurrentStep ? "→" : " "} ${stepStatus} Step ${i + 1}: ${step.description}`);
            
            // Show checks for this step
            for (const check of step.checks) {
                const checkStatus = this.getStatusSymbol(check.status);
                console.log(`    ${checkStatus} Check: ${check.description}`);
            }
        }
        
        // 5. Problems section at the bottom
        const problems = this.lastRun.getProblems();
        if (problems.length > 0) {
            console.log("\nProblems:");
            for (const problem of problems) {
                const severity = problem.getSeverity();
                const severitySymbol = this.getSeveritySymbol(severity);
                console.log(`  ${severitySymbol} ${problem.getTitle()} (${severity})`);
                console.log(`    Expected: ${problem.getExpectedResult()}`);
                console.log(`    Actual: ${problem.getActualResult()}`);
            }
        }
        
        console.log("\n");
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
