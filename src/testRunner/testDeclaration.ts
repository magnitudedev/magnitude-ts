import { TestCase } from '../testCase';
import { TestDeclaration, TestGlobalConfig, TestOptions } from './types';
import { TestRegistry } from './testRegistry';

function testDecl(
    id: string,
    options?: TestOptions
): TestCase {
    // Returns a TestCase tracked by test registry so it can be run by test runner
    const registry = TestRegistry.getInstance();
    //console.log("registry.getActiveOptions()", registry.getActiveOptions())
    const combinedOptions = { ...registry.getActiveOptions(), id: id, ...(options ?? {}) };

    //console.log("combined:", combinedOptions);

    // TODO: implement relative URLs
    if (!combinedOptions.url) {
        throw Error("URL must be provided either through (1) env var MAGNITUDE_TEST_URL, (2) via test.config, or (3) in group or test options");
    }
    const tc = new TestCase(
        combinedOptions as TestOptions & Required<Pick<TestOptions, 'url'>> & { id: string }
    );
    registry.register(tc);
    return tc;
}

testDecl.group = function (
    id: string,
    optionsOrTestFn: TestOptions | (() => void),
    testFnOrNothing?: () => void
): void {
    let options: TestOptions;
    let testFn: () => void;

    if (typeof optionsOrTestFn == 'function') {
        options = {};
        testFn = optionsOrTestFn
    }
    else {
        options = optionsOrTestFn;
        if (!testFnOrNothing) {
            throw new Error("Test function is required");
        }
        testFn = testFnOrNothing;
    }

    const registry = TestRegistry.getInstance();

    // Set active group context
    registry.setCurrentGroup({
        name: id,
        options: options
    });

    // Run the block to register the test cases with the group context
    testFn();

    // Remove active group context
    registry.unsetCurrentGroup();
}

// testDecl.config = function (
//     options: TestGlobalConfig
// ) {
//     const registry = TestRegistry.getInstance();
//     registry.setGlobalOptions(options);
// }

export const test = testDecl as TestDeclaration;
