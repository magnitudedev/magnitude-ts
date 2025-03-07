import { TestRun as TestRunData, Problem as ProblemData } from './types';
import { TestCase } from './testCase';
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
    // isFatal(): boolean {
    //     // Whether this problem caused the test to fail
    //     return this.data.is_fatal;
    // }
}

export class Warning extends Problem {}

export class TestRunResult {
    // Wrapper class for returned test data
    private data: TestRunData;
    private testCase: TestCase;

    constructor(data: TestRunData, testCase: TestCase) {
        this.data = data;
        this.testCase = testCase;
    }

    getUrl() {
        if (!this.testCase.getInternalId()) {
            // Should be impossible
            throw Error("URL not available until test run started");
        }
        return `https://app.magnitude.run/console/${this.testCase.getInternalId()}/runs/${this.data.id}`
    }

    getActions() {
        return this.data.actions;
    }

    getRawData() {
        return this.data;
    }

    getProblem(): Problem | null {
        // At most one critical problem 
        for (const step of this.data.steps) {
            for (const problem of step.problems ?? []) {
                if (problem.is_fatal) return new Problem(problem);
            }
            for (const check of step.checks) {
                for (const problem of check.problems ?? []) {
                    if (problem.is_fatal) return new Problem(problem);
                }
            }
        }
        return null;
    }

    getWarnings(): Warning[] {
        const warnings: Warning[] = [];
        for (const step of this.data.steps) {
            for (const problem of step.problems ?? []) {
                if (!problem.is_fatal) warnings.push(new Warning(problem));
            }
            for (const check of step.checks) {
                for (const problem of check.problems ?? []) {
                    if (!problem.is_fatal) warnings.push(new Warning(problem));
                }
            }
        }
        return warnings;
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