import { TestCase } from './testCase';
import { z } from 'zod';
import { TestRun as TestRunData, Problem as ProblemData } from './types'; // move this?
import crypto from 'crypto';
import { Magnitude } from './client';
import { TestRenderer } from './testRenderer';
import { TestRunResult, Problem, Warning } from './dataWrappers';
import { isLocalUrl } from './util';
import { TunnelClient } from 'bunnel';
import { ProblemError, WarningError } from './errors';


export class TestRunner {
    private testCase: TestCase;
    private runningPromise: Promise<TestRunResult>;
    private pollTimeout: NodeJS.Timeout | null = null;
    private resolveRunningPromise!: (result: TestRunResult) => void;
    private rejectRunningPromise!: (error: any) => void;
    private runId: string | null = null;
    private startCallback: ((run: TestRunResult) => void) | null = null;
    private progressCallback: ((progress: TestRunResult) => void) | null = null;
    private problemCallback: ((problem: Problem) => void) | null = null;
    private warningCallback: ((warning: Warning) => void) | null = null;
    private lastResultHash: string | null = null;
    private lastWarningCount: number = 0;
    private showDisplay: boolean = false;
    private renderer: TestRenderer | null = null;
    private tunnelClient: TunnelClient | null = null;

    constructor(testCase: TestCase) {
        console.log("Test Runner Intialized");
        // Start test case
        this.testCase = testCase;
        //this.runningPromise = this.execute();
        this.runningPromise = new Promise<TestRunResult>((resolve, reject) => {
            this.resolveRunningPromise = resolve;
            this.rejectRunningPromise = reject;
        });

        // Add cleanup handler for the renderer
        this.runningPromise.finally(() => {
            if (this.renderer) {
                this.renderer.stopRendering();
            }
            if (this.tunnelClient) {
                this.tunnelClient.disconnect();
            }
        });

        this.start();
    }

    private updateRun(run: TestRunResult) {
        // Call any appropriate handlers
        const runHash = run.getHash();

        if (runHash != this.lastResultHash) {
            // Different from the last result that we polled
            //if (this.progressCallback) this.progressCallback(run);
            this.callProgressCallback(run);
        }

        const warnings = run.getWarnings();

        const numNewWarnings = warnings.length - this.lastWarningCount;

        if (numNewWarnings > 0) {
            // Do callback for new warnings
            for (const warning of warnings.slice(-numNewWarnings)) {
                this.callWarningCallback(warning);

                if (Magnitude.shouldThrowOnWarning()) {
                    //throw new WarningError(warning);
                    this.rejectRunningPromise(new WarningError(warning));
                }
            }
        }

        const problem = run.getProblem();

        if (problem) {
            this.callProblemCallback(problem);

            if (Magnitude.shouldThrowOnProblem()) {
                if (Magnitude.shouldThrowOnProblem()) {
                    this.rejectRunningPromise(new ProblemError(problem));
                }
            }
        }
        
        this.lastResultHash = runHash;
        this.lastWarningCount = warnings.length;
    }

    private async start() {
        // Make API call to start test execution
        //console.log("Test Case:", this.testCase.toData());

        // Establish tunnel if necessary
        const url = this.testCase.getUrl();

        if (Magnitude.isAutoTunnelEnabled() && isLocalUrl(url)) {
            // Establish tunnel
            //console.log(`Detected local URL, establishing tunnel to ${Magnitude.getTunnelUrl()}...`)

            // .host includes port, .hostname does not
            const host = new URL(url).host;

            this.tunnelClient = new TunnelClient({
                // ADD PROTOCOL BACK, assume HTTP since local
                localServerUrl: `http://${host}`,
                tunnelServerUrl: Magnitude.getTunnelUrl()
            });

            //console.log("Connecting...")
            const { tunnelUrl } = await this.tunnelClient.connect();
            //console.log("Connected to tunnel!")

            this.testCase.setTunnelUrl(tunnelUrl);

            // TODO: handle what to do if tunnel disconnects
        }


        const runData = await Magnitude.startTestRun(this.testCase.toData());
        // INTERNAL run CUID2
        this.runId = runData.id;
        this.testCase.setInternalId(runData.test_case_id);

        const run = new TestRunResult(runData, this.testCase);
        this.updateRun(run);
        
        this.callStartCallback(run);
        
        
        // Poll immediately (and schedule additional)
        await this.poll();
        //this.schedulePoll();

        // this.pollInterval = setInterval(() => {
        //     this.poll();
        // }, 1000);

        // Cleanup interval when promise resolves or rejects
        // this.runningPromise.finally(() => {
        //     if (this.pollTimeout) {
        //         clearInterval(this.pollTimeout);
        //         this.pollTimeout = null;
        //     }
        // });
    }

    private schedulePoll() {
        // Schedule a single poll after the delay
        this.pollTimeout = setTimeout(() => {
            this.poll();
        }, 1000);
    }

    private async poll() {
        if (!this.runId) {
            throw Error("Polling before run started");
        }
        // Get the test case results and call any appropriate handlers

        // Call API to get results and make new TestRunResult() around the returned data
        const run = new TestRunResult(
            await Magnitude.getTestRunStatus(this.runId),
            this.testCase
        );

        //console.log("Run:", run);

        this.updateRun(run);

        if (run.isDone()) {
            // when test case is totally done we should do this
            // Don't call stopRendering here, let the promise cleanup handle it
            this.resolveRunningPromise(run);
        } else {
            this.schedulePoll();
        }
    }

    private callStartCallback(run: TestRunResult) {
        if (this.startCallback) this.startCallback(run);
    }

    private callProgressCallback(run: TestRunResult) {
        // If display is enabled, update the renderer with new data
        if (this.showDisplay && this.renderer) {
            this.renderer.updateData(run);
        }
        
        // Call the original callback if it exists
        if (this.progressCallback) this.progressCallback(run);
    }

    private callWarningCallback(warning: Warning) {
        if (this.warningCallback) this.warningCallback(warning);
    }

    private callProblemCallback(problem: Problem) {
        if (this.problemCallback) this.problemCallback(problem);
    }

    public onStart(callback: (run: TestRunResult) => void): TestRunner {
        // Called when the run API returns
        this.startCallback = callback;
        return this;
    }

    public onProgress(callback: (run: TestRunResult) => void): TestRunner {
        this.progressCallback = callback;
        return this;
    }

    public onProblem(callback: (problem: Problem) => void): TestRunner {
        this.problemCallback = callback;
        return this;
    }

    public onWarning(callback: (warning: Warning) => void): TestRunner {
        this.warningCallback = callback;
        return this;
    }

    public show(): TestRunner {
        //console.log("show()")
        // Create renderer if it doesn't exist
        if (!this.renderer) {
            this.renderer = new TestRenderer();
        }
        
        // Set the flag to show display
        this.showDisplay = true;
        
        // Start the renderer immediately, even if we don't have test data yet
        this.renderer.startRendering(this.testCase);
        
        return this;
    }

    // Enables awaiting the class itself
    then<TResult1 = TestRunResult, TResult2 = never>(
        onfulfilled?: ((value: TestRunResult) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        // Return the already running promise with the callbacks attached
        return this.runningPromise.then(onfulfilled, onrejected);
    }
}
