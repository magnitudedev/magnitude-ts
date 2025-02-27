import { TestRun as TestRunData, Problem as ProblemData } from './types';
import crypto from 'crypto';

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

    getRawData() {
        return this.data;
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