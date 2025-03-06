import { TestCase } from 'magnitude-ts';

/**
 * Simple example demonstrating a login flow.
 * export TEST_USER_EMAIL="test-user@magnitude.run"; export TEST_USER_PASSWORD="test"; bun examples/login.ts
 */

async function runTest() {
    const loginTest = new TestCase({
        id: "login-test", // any ID you want
        name: "Basic Login Test", // friendly name
        url: "https://qa-bench.com" // target site url
    });
    
    loginTest.addStep("Login to the app")
        .check("Can see dashboard") // natural language assertion
        .data({ username: process.env.TEST_USER_EMAIL! }) // plaintext data
        .secureData({ password: process.env.TEST_USER_PASSWORD! }); // encrypted data
    
    // start the test case!
    const result = await loginTest.run().show();

    if (!result.hasPassed()) {
        console.log("Test failed! Problem:", result.getProblem());
    }
}

runTest();