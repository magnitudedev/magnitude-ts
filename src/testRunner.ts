import { TestCase } from './testCase';
import { z } from 'zod';
import { TestRun as TestRunData, Problem as ProblemData } from './types'; // move this?
import crypto from 'crypto';
import { Magnitude } from './client';

export class Problem {
    // Wrapper class for reported problems
    private data: ProblemData;

    constructor(data: ProblemData) {
        this.data = data;
    }

    getTitle(): string {
        return this.data.title;
    }

    getSeverity(): "critical" | "high" | "medium" | "low" | "cosmetic" {
        return this.data.severity;
    }

    getCategory(): "visual" | "functional" {
        return this.data.category;
    }

    getExpectedResult(): string {
        return this.data.expected_result;
    }

    getActualResult(): string {
        return this.data.actual_result;
    }

    isFatal(): boolean {
        // Whether this problem caused the test to fail
        return this.data.is_fatal;
    }
}

export class TestRunResult {
    // Wrapper class for returned test data
    private data: TestRunData;

    constructor(data: TestRunData) {
        this.data = data;
    }

    hasProblems() {
        return this.getProblems().length > 0;
    }

    getProblems(): Problem[] {
        const problems: Problem[] = [];
        for (const step of this.data.steps) {
            for (const problem of step.problems ?? []) {
                problems.push(new Problem(problem));
            }
            for (const check of step.checks) {
                for (const problem of check.problems ?? []) {
                    problems.push(new Problem(problem));
                }
            }
        }
        return problems;
    }

    isDone(): boolean {
        // Whether the test is done running - does not indicate passed/failed state or whether any problems.
        return this.data.is_done;
    }

    hasPassed() {
        // If last step/check is passed, test is passed
        if (!this.data.steps) {
            // Shouldn't really happen but ok
            return true;
        }
        const lastStep = this.data.steps.at(-1)!;
        if (lastStep.checks.length > 0) {
            return lastStep.checks.at(-1)!.status === "passed";
        }
        return lastStep.status === "passed";
    }

    getHash(): string {
        return crypto.createHash('sha256')
            .update(JSON.stringify(this.data))
            .digest('hex');
    }
}

export class TestRunner {
    private testCase: TestCase;
    private runningPromise: Promise<TestRunResult>;
    private pollTimeout: NodeJS.Timeout | null = null;
    private resolveRunningPromise!: (result: TestRunResult) => void;
    private rejectRunningPromise!: (error: any) => void;
    private runId: string | null = null;
    private progressCallback: ((progress: any) => void) | null = null;
    private problemCallback: ((problem: any) => void) | null = null;

    constructor(testCase: TestCase) {
        // Start test case
        this.testCase = testCase;
        //this.runningPromise = this.execute();
        this.runningPromise = new Promise<TestRunResult>((resolve, reject) => {
            this.resolveRunningPromise = resolve;
            this.rejectRunningPromise = reject;
        });

        this.start();
    }

    private updateRun(run: TestRunResult) {

    }

    private async start() {
        // Make API call to start test execution
        console.log("Test Case:", this.testCase.toData());
        const runData = await Magnitude.getInstance().startTestRun(this.testCase.toData());
        this.runId = runData.id;
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
        console.log("Polling...");
        //const someCondition = Math.random() > 0.8;

        // Call API to get results and make new TestRunResult() around the returned data
        //result = new TestRunResult();
        const run = new TestRunResult(await Magnitude.getInstance().getTestRunStatus(this.runId));

        console.log("Run:", run);

        this.updateRun(run);

        if (run.isDone()) {
            // when test case is totally done we should do this
            this.resolveRunningPromise(run);
        } else {
            this.schedulePoll();
        }
    }

    // TODO: call these on poll when appropriate, also change signature
    public onProgress(callback: (progress: any) => void): TestRunner {
        this.progressCallback = callback;
        return this;
    }

    public onProblem(callback: (problem: any) => void): TestRunner {
        this.problemCallback = callback;
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