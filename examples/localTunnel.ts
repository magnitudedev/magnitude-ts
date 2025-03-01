import { TestCase } from 'magnitude-ts';

/**
 * Example showing how to run magnitude on a locally running site.
 * In this example, we assume a basic HTML page is being rendered at localhost:3000 showing "Hello World".
 */

async function runTest() {
    const loginTest = new TestCase({
        id: "tunnel-test",
        // SDK will detect local URLs and automatically establish a secure reverse tunnel for our agent to access it
        url: "http://localhost:3000"
    });
    
    loginTest.addStep("Page should show Hello World");

    await loginTest.run().show();
}

runTest();