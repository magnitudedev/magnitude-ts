import { TestCase } from "../testCase";

export interface TestOptions {
    url?: string;
    name?: string;
}

export type TestGlobalConfig = {
    apiKey?: string;
    baseUrl?: string;
}//TestOptions & { apiKey?: string };

export interface TestGroup {
    name: string;
    options?: TestOptions;
}

export interface TestGroupDeclaration {
    (id: string, options: TestOptions, testFn: () => void): void;
    (id: string, testFn: () => void): void;
}

export interface TestDeclaration {
    (id: string, options?: TestOptions): TestCase;
    // (id: string, options: TestOptions, testFn: () => Promise<void>): void;
    // (id: string, testFn: () => Promise<void>): void;

    // group(groupName: string, groupOptions: TestOptions, groupFn: () => void): void;

    group: TestGroupDeclaration;

    // Configure global test options
    //config: (options: TestGlobalConfig) => void;
}

export type CategorizedTestCases = Record<string, { ungrouped: TestCase[], groups: Record<string, TestCase[]>}>;

export interface RenderIdTestCasePair {
    renderId: string;
    testCase: TestCase;
}

export type CategorizedTestCasesWithRenderIds = Record<string, { 
    ungrouped: RenderIdTestCasePair[], 
    groups: Record<string, RenderIdTestCasePair[]>
}>;

