import { TestOptions, TestGroup, CategorizedTestCases, TestGlobalConfig } from "./types";
import { TestCase } from "../testCase";
import { Magnitude } from "../client";

declare global {
    var __testRegistry: TestRegistry | undefined;
}

export class TestRegistry {
    //private static instance: TestRegistry;

    // map from filepath to ungrouped & grouped test cases
    private tests: CategorizedTestCases = {};

    private currentGroup?: TestGroup;
    private currentFilePath?: string;

    private globalOptions: TestGlobalConfig = {};

    private constructor() { }

    public static getInstance(): TestRegistry {
        // Use global to ensure same instance is used across module boundaries
        if (!(global as any).__magnitude__) {
            (global as any).__magnitude__ = {};
        }

        if (!(global as any).__magnitude__.registry) {

            (global as any).__magnitude__.registry = new TestRegistry();

        }
        return (global as any).__magnitude__.registry;
    }

    public register(testCase: TestCase): void {
        // Register a test case to be tracked by test runner
        if (!this.currentFilePath) {
            throw Error("File path context not set before registering test");
        }

        if (!(this.currentFilePath in this.tests)) {
            this.tests[this.currentFilePath] = { ungrouped: [], groups: {} }
        }
        const testsForPath = this.tests[this.currentFilePath];

        if (this.currentGroup) {
            const groupName = this.currentGroup.name;
            if (!(groupName in testsForPath.groups)) {
                testsForPath.groups[groupName] = [];
            }
            testsForPath.groups[groupName].push(testCase);
        } else {
            testsForPath.ungrouped.push(testCase);
        }
    }

    public getRegisteredTestCases(): CategorizedTestCases {
        return this.tests;
    }

    public setCurrentGroup(group: TestGroup): void {
        //this.currentGroupName = groupName;
        this.currentGroup = group;
    }

    public unsetCurrentGroup(): void {
        this.currentGroup = undefined;
    }

    public setCurrentFilePath(filePath: string): void {
        //console.log("setCurrentFilePath:", filePath);
        this.currentFilePath = filePath;
        //console.log("currentFilePath:", this.currentFilePath);
    }

    public unsetCurrentFilePath(): void {
        //console.log("unsetCurrentFilePath:", this.currentFilePath);
        this.currentFilePath = undefined;
    }

    public setGlobalOptions(options: TestGlobalConfig): void {
        if (options.apiKey) {
            Magnitude.init({
                apiKey: options.apiKey
            });
        }
        this.globalOptions = options;
    }

    // Get current option overrides for the active group scope
    public getActiveOptions(): TestOptions {
        const envOptions = process.env.MAGNITUDE_TEST_URL ? {
            url: process.env.MAGNITUDE_TEST_URL
        } : {};

        //console.log("global options:", this.globalOptions)

        //const configuredOptions = this.globalOptions;
        const globalOptions = this.globalOptions.baseUrl ? {
            url: this.globalOptions.baseUrl
        } : {};

        const groupOptions = this.currentGroup?.options ?? {};

        const combinedOptions = {
            ...envOptions,
            ...globalOptions,
            ...groupOptions
        }

        //console.log("combinedOptions:", combinedOptions)

        return combinedOptions;
    }
}

export default TestRegistry;