import { TestRunResult, Problem } from './dataWrappers';
import { TestCase } from './testCase';
import logUpdate from 'log-update';
import chalk from 'chalk';
import { magnitudeBlue, brightMagnitudeBlue } from './colors';

//const magnitudeBlue = chalk.hex('#0369a1');
// const magnitudeBlue = chalk.hex('#0369a1');
// const brightMagnitudeBlue = chalk.hex('#42bafb');

export class TestRenderer {
    private spinnerFrameIndex: number = 0;
    private spinnerFrames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    private renderInterval: NodeJS.Timeout | null = null;
    private lastRun: TestRunResult | null = null;
    private testCase: TestCase | null = null;
    private isActive: boolean = false;
    private startTime: number = 0;

    constructor() { }

    /**
     * Update the test case without starting the render loop
     */
    public updateTestCase(testCase: TestCase): void {
        this.testCase = testCase;
        this.startTime = Date.now();
    }

    /**
     * Start continuous rendering with animation, even before test data is available
     */
    public startRendering(testCase: TestCase): void {
        // Store the test data (might be null initially)
        this.testCase = testCase;
        this.isActive = true;
        this.startTime = Date.now();

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
        //const isFirstUpdate = !this.lastRun && run;
        this.lastRun = run;
        // if (isFirstUpdate) {
        //     console.log("clearing")
        //     logUpdate.clear();
        // }
    }

    private formatElapsedTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        return `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    /**
     * Get the rendered output as a string without updating the display
     */
    public getRenderedOutput(): string {
        if (!this.testCase) return '';

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
            // Use the existing rendering logic but store in lines array
            const data = this.lastRun.getRawData();
            const steps = data.steps;
            const actions = data.actions || [];
            const totalSteps = steps.length;

            // Find the first pending item (step or check)
            let firstPendingItemFound = false;
            let activeStepIndex = -1;
            let activeCheckIndex = -1;
            let activeStepWithCheck = -1;

            // First, find the active step and check indexes
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                // Check if this step is pending
                if (step.status === "pending" && !firstPendingItemFound) {
                    activeStepIndex = i;
                    firstPendingItemFound = true;
                    break;
                }

                // Check if any checks in this step are pending
                for (let j = 0; j < step.checks.length; j++) {
                    if (step.checks[j].status === "pending" && !firstPendingItemFound) {
                        activeStepWithCheck = i;
                        activeCheckIndex = j;
                        firstPendingItemFound = true;
                        break;
                    }
                }

                if (firstPendingItemFound) {
                    break;
                }
            }

            // If no pending items were found, use the last step
            if (activeStepIndex === -1 && activeCheckIndex === -1) {
                activeStepIndex = totalSteps - 1;
            }

            const actionCount = actions.length;

            // Get current spinner frame (only show if test is still running)
            const displaySpinner = !this.lastRun.isDone() ? spinner + ' ' : '';

            // 1. Display test name and status with spinner
            const status = this.lastRun.isDone()
                ? (this.lastRun.hasPassed() ? chalk.greenBright("[PASSED]") : chalk.redBright("[FAILED]"))
                : brightMagnitudeBlue("[RUNNING]");

            const elapsedTime = this.formatElapsedTime(Date.now() - this.startTime);
            const currentStep = activeCheckIndex !== -1 ? activeStepWithCheck : activeStepIndex;

            lines.push(`${displaySpinner}${status} ${this.testCase.toData().name} ` + chalk.blackBright(`⏱ ${elapsedTime} | Step ${currentStep + 1}/${totalSteps} | Actions: ${actionCount}`));

            if (this.testCase.getTunnelUrl()) {
                const localUrl = this.testCase.getUrl();
                const tunnelUrl = this.testCase.getTunnelUrl();
                lines.push(chalk.blackBright(`⛏ Tunnel: ${tunnelUrl} -> ${localUrl}`));
            }

            lines.push(magnitudeBlue(`⚭ Link: ${this.lastRun.getUrl()}`));

            // 3. Steps and checks progress
            lines.push(brightMagnitudeBlue(`\nProgress:`));
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepStatus = this.getStatusSymbol(step.status);
                const isCurrentStep = i === activeStepIndex;

                lines.push(`${isCurrentStep ? magnitudeBlue(">") : " "} ${stepStatus} Step ${i + 1}: ${step.description}`);

                // Show checks for this step
                for (let j = 0; j < step.checks.length; j++) {
                    const check = step.checks[j];
                    const checkStatus = this.getStatusSymbol(check.status);
                    const isCurrentCheck = i === activeStepWithCheck && j === activeCheckIndex;

                    lines.push(`    ${isCurrentCheck ? magnitudeBlue(">") : " "} ${checkStatus} Check: ${check.description}`);
                }
            }

            // Actions
            lines.push(brightMagnitudeBlue(`\nActions:`));
            if (actions.length === 0) {
                lines.push(`  No actions yet`);
            } else {
                for (const action of actions) {
                    lines.push("  " + magnitudeBlue(`${this.getActionSymbol(action.variant)} ${action.variant.toUpperCase()}`) + `: ${action.description}`);
                }
            }

            // Handle problems
            const problem = this.lastRun.getProblem();
            const warnings = this.lastRun.getWarnings();

            // Handle critical problem if it exists
            if (problem) {
                lines.push(chalk.redBright(`\nProblem:`));
                const severity = problem.getSeverity();
                lines.push(` ${this.getSeverityDescriptor(severity)}: ${problem.getTitle()} `);
                lines.push(` ${magnitudeBlue('Expected')}: ${problem.getExpectedResult()}`);
                lines.push(` ${magnitudeBlue('Actual')}: ${problem.getActualResult()}`);
            }

            // Handle warnings
            if (warnings.length > 0) {
                lines.push(chalk.yellowBright(`\nWarnings:`));

                for (const warning of warnings) {
                    const severity = warning.getSeverity();
                    lines.push(` ${this.getSeverityDescriptor(severity)}: ${warning.getTitle()} `);
                    lines.push(` ${magnitudeBlue('Expected')}: ${warning.getExpectedResult()}`);
                    lines.push(` ${magnitudeBlue('Actual')}: ${warning.getActualResult()}`);
                }
            }
        }

        // Return the joined string instead of updating the display
        return lines.join('\n');
    }

    /**
     * Render a single frame of the display
     * 
     * Note: This method is only used when this renderer is running standalone,
     * not when integrated with TestViewer
     */
    private renderFrame(): void {
        if (!this.testCase) return;

        // Get the rendered output as a string
        const output = this.getRenderedOutput();
        
        // Update the display - only called in standalone mode
        logUpdate(output);
    }

    private getActionSymbol(variant: "load" | "click" | "hover" | "type" | "scroll" | "wait" | "back") {
        switch (variant) {
            case "load":
                return "↻"; // Recycling symbol for loading
            case "click":
                return "⊙"; // Circled dot for clicking
            case "hover":
                return "◉"; // Circled bullet for hovering
            case "type":
                return "⌨"; // Keyboard symbol
            case "scroll":
                return "↕"; // Up/down arrows for scrolling
            case "wait":
                return "◴"; // Clock face for waiting
            case "back":
                return "←"; // Left arrow for going back
            default:
                return "?"; // Question mark for unknown action
        }
    }

    private getStatusSymbol(status: "pending" | "passed" | "failed"): string {
        switch (status) {
            case "passed": return chalk.greenBright("✓");
            case "failed": return chalk.redBright("✗");
            case "pending": return chalk.blackBright("⋯");
            default: return "?";
        }
    }

    private getSeverityDescriptor(severity: "critical" | "high" | "medium" | "low" | "cosmetic"): string {
        switch (severity) {
            case "critical": return chalk.hex('#FF0000')("[!!!] Critical");
            case "high": return chalk.hex('#FF4500')("[!!] High");
            case "medium": return chalk.hex('#FFA500')("[!] Medium");
            case "low": return chalk.hex('#FFFF00')("[*] Low");
            case "cosmetic": return chalk.hex('#FFFF00')("Cosmetic");
            default: return chalk.hex('#FFFFFF')("Unknown");
        }
    }

    /**
     * Check if the renderer is currently running
     */
    public isRunning(): boolean {
        return this.isActive && this.renderInterval !== null;
    }
}