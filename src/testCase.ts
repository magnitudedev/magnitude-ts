import { Magnitude } from './client';
import { TestRunner } from './testRunner';
import { TestStepSchema } from './schema';
import { z } from 'zod';
import { TestCase as TestCaseData, TestStep as TestStepData } from './types';

class TestStep {
    // Test step builder class
    private description: string;
    private checks: string[] = [];
    private testData: Record<string, string> = {};
    private secureTestData: Record<string, string> = {};

    constructor(description: string) {
        this.description = description;
    }

    public check(description: string): TestStep {
        this.checks.push(description);
        return this;
    }

    public data(data: Record<string, string>): TestStep {
        this.testData = { ...this.testData, ...data };
        return this;
    }

    public secureData(data: Record<string, string>): TestStep {
        this.secureTestData = { ...this.secureTestData, ...data };
        return this;
    }

    public toData(): TestStepData {
        const testData = [
            ...Object.entries(this.testData).map(([k, v]) => ({ key: k, value: v, sensitive: false })),
            ...Object.entries(this.secureTestData).map(([k, v]) => ({ key: k, value: v, sensitive: true }))
        ];

        return {
            description: this.description,
            checks: this.checks,
            test_data: {
                data: testData,
                other: "" // FIXME: What should be the pattern for providing this if any?
            },
        }
    }
}

export interface TestCaseOptions {
    id: string;
    name?: string;
    url: string;
  }

export class TestCase {
    
    private id: string;

    private internalId: string | null = null;

    // Internal CUID2
    // User-defined ID
    //private sdk_id: string;
    private name: string;
    private url: string;
    private steps: TestStep[] = [];

    constructor(options: TestCaseOptions) {
        this.id = options.id;
        //this.sdk_id = options.id;
        this.name = options.name ?? options.id;
        this.url = options.url;
    }

    public addStep(description: string): TestStep {
        const step = new TestStep(description);
        this.steps.push(step);
        return step;
    }

    public run(): TestRunner {
        // Ensure Magnitude is initialized
        if (!Magnitude.isInitialized()) {
            throw new Error('Magnitude not initialized. Call Magnitude.init() before running tests.');
        }

        // Create and return a runner
        return new TestRunner(this);
    }

    public toData(): TestCaseData {
        return {
            id: this.id,
            name: this.name,
            url: this.url,
            steps: this.steps.map(step => step.toData())
        }
    }

    public getId(): string {
        return this.id;
    }

    public getInternalId(): string | null {
        return this.internalId;
    }

    public setInternalId(id: string) {
        this.internalId = id;
    }

    // get sdk id
}