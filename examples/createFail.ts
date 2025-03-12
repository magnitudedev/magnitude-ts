import { TestCase } from 'magnitude-ts';

/**
 * Example demonstrating how Magnitude handles failures and identifies problems.
 * bun examples/createFail.ts
 */

async function runTest() {
    const loginTest = new TestCase({
        id: "company-create",
        name: "Silent Fail Catcher",
        // Inject a bug to catch
        url: `https://qa-bench.com?bugs=["companies.create.failSilently"]`
    });
    
    loginTest.step("Login to the app")
        .check("Can see dashboard")
        .data({ username: "test-user@magnitude.run" })
        .secureData({ password: "test" });
    
    loginTest.step("Create a new company")
        .data("Make up the first 2 values and use defaults for the rest")
        .check("Company added successfully");
    
    await loginTest.run().show();
}

runTest();