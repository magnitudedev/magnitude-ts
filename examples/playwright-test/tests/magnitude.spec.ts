import { test, expect } from '@playwright/test';
import { Magnitude, TestCase } from 'magnitude-ts';
import { TunnelClient } from 'bunnel';

// Initialize Magnitude
//Magnitude.init({ apiKey: process.env.MAGNITUDE_API_KEY || 'your-api-key-here' });

// Use Playwright's test runner with Magnitude
test('has title', async () => {
    // const tunnel = new TunnelClient({
    //     localServerUrl: "http://localhost:3000",
    //     tunnelServerUrl: "https://api.app.magnitude.run:4444"
    // });
    
    // console.log("Trying to connect...")
    // const result = await tunnel.connect();
    // console.log("Tunnel connection result:", result);
    // console.log("Connected!")


    const titleTest = new TestCase({
        id: "has-title-test",
        name: "Check Page Title",
        //url: "http://127.0.0.1:3000"
        //url: "localhost:3000"
        url: "http://localhost:3000"
        //url: "https://playwright.dev/"
    });

    titleTest.addStep("Page title contains 'Playwright'");

    console.log("Running magnitude test...");
    await titleTest.run();
});

// test('get started link', async () => {
//   const linkTest = new TestCase({
//     id: "get-started-link-test",
//     name: "Get Started Link Navigation",
//     url: "https://playwright.dev/"
//   });
  
//   linkTest.addStep("Find and click the 'Get started' link")
//     .check("Link is visible and clickable");
    
//   linkTest.addStep("Click on the 'Get started' link")
//     .check("Page navigates to a new URL");
    
//   linkTest.addStep("Verify the heading on the new page")
//     .check("A heading with text 'Installation' is visible on the page");
    
//   const result = await linkTest.run();
//   expect(result.hasPassed()).toBeTruthy();
//   expect(result.getProblems().length).toBe(0);
// });

// // You can use Playwright's hooks as well
// test.beforeEach(async () => {
//   // Setup code before each test
//   console.log('Setting up test...');
// });

// test.afterEach(async ({ testInfo }) => {
//   // Cleanup code after each test
//   console.log(`Test '${testInfo.title}' ${testInfo.status}`);
// });

// // More complex test with Magnitude
// test('complex user flow', async ({ testInfo }) => {
//   const userFlowTest = new TestCase({
//     id: `user-flow-${testInfo.project.name}`,
//     name: "Complex User Flow Test",
//     url: "https://example.com"
//   });
  
//   userFlowTest.addStep("Login to the application")
//     .data({ username: "test-user@example.com" })
//     .secureData({ password: process.env.TEST_PASSWORD || "password" })
//     .check("Login is successful");
  
//   userFlowTest.addStep("Navigate to the dashboard")
//     .check("Dashboard components are visible")
//     .check("User profile information is correct");
  
//   userFlowTest.addStep("Create a new item")
//     .data("Fill in all required fields with valid data")
//     .check("Item is created successfully")
//     .check("Success notification appears");
  
//   const result = await userFlowTest.run();
  
//   // Using Playwright's expect with Magnitude results
//   expect(result.hasPassed()).toBeTruthy();
  
//   // You can make more specific assertions based on the test results
//   const steps = result.getSteps();
//   expect(steps.length).toBe(3);
//   expect(steps[0].status).toBe('passed');
// });