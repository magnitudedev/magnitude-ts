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
    
    loginTest.addStep("Login to the app")
        .check("Can see dashboard")
        .data({ username: "test-user@magnitude.run" })
        .secureData({ password: "test" });
    
    loginTest.addStep("Create a new company")
        .data("Make up the first 2 values and use defaults for the rest")
        .check("Company added successfully");
    
    console.log("Starting test")
    const result = await loginTest.run()
        .onStart(run => console.log("View run at:", run.getUrl()))
        .onProblem(problem => console.log("Identified a problem!", problem.getTitle()))
        .onProgress(result => console.log("Total actions taken:", result.getActions().length))
    console.log("Passed?", result.hasPassed());
    console.log(`Ran into ${result.getProblems().length} problems`);
}

runTest();