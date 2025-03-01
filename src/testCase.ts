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
    private freeformTestData: string[] = [];
    private secureTestData: Record<string, string> = {};

    constructor(description: string) {
        this.description = description;
    }

    public check(description: string): TestStep {
        this.checks.push(description);
        return this;
    }

    public data(data: Record<string, string> | string): TestStep {
        /**
         * Pass in a string for a freeform description of data,
         * or arbitrary key/value pairs.
         */
        if (typeof data === "string") {
            this.freeformTestData.push(data);
        } else {
            this.testData = { ...this.testData, ...data };
        }
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
                other: this.freeformTestData.join("\n")
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
    // User-defined ID (sdk_id)
    private id: string;

    // Internal CUID2
    private internalId: string | null = null;

    private name: string;
    private url: string;
    private tunnelUrl: string | null = null;
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
            // If tunneling, provide tunnel url instead
            url: this.tunnelUrl ?? this.url,
            steps: this.steps.map(step => step.toData())
        }
    }

    public getUrl(): string {
        return this.url;
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

    public setTunnelUrl(url: string) {
        this.tunnelUrl = url;
    }

    public getTunnelUrl(): string | null {
        return this.tunnelUrl;
    }



    // get sdk id
}