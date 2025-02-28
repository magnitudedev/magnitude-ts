import { TestCase } from './testCase';
import { z } from 'zod';
import { TestRun as TestRunData, Problem as ProblemData } from './types'; // move this?
import crypto from 'crypto';
import { Magnitude } from './client';
import { TestRenderer } from './testRenderer';
import { TestRunResult, Problem } from './dataWrappers';


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
    private lastResultHash: string | null = null;
    private lastProblemCount: number = 0;
    private showDisplay: boolean = false;
    private renderer: TestRenderer | null = null;

    constructor(testCase: TestCase) {
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

        const problems = run.getProblems();

        const numNewProblems = problems.length - this.lastProblemCount;

        if (numNewProblems > 0) {
            // Do callback for new problems
            for (const problem of problems.slice(-numNewProblems)) {
                this.callProblemCallback(problem);
            }
        }

        this.lastResultHash = runHash;
        this.lastProblemCount = problems.length;
    }

    private async start() {
        // Make API call to start test execution
        //console.log("Test Case:", this.testCase.toData());
        const runData = await Magnitude.getInstance().startTestRun(this.testCase.toData());
        // INTERNAL run CUID2
        this.runId = runData.id;
        this.testCase.setInternalId(runData.test_case_id);
        
        this.updateRun(new TestRunResult(runData));
        
        
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
        const run = new TestRunResult(await Magnitude.getInstance().getTestRunStatus(this.runId));

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

    public show(): TestRunner {
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

    // private async execute(): Promise<TestRunResult> {
    //     try {
    //         // Example implementation
    //         for (let i = 0; i < 10; i++) {
    //             console.log(i)
    //             // Simulate test steps
    //             await new Promise(resolve => setTimeout(resolve, 100));
                
    //         //   if (this.progressCallback) {
    //         //     this.progressCallback({ step: i, total: 10 });
    //         //   }
    //         }
            
    //         return { status: "success", message: "All tests passed" };
    //         } catch (error) {
    //         // if (this.problemCallback) {
    //         //   this.problemCallback(error);
    //         // }
    //         throw error;
    //     }
    // }

    // Enables awaiting the class itself
    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        // Return the already running promise with the callbacks attached
        return this.runningPromise.then(onfulfilled, onrejected);
    }
}
