# Magnitude Client

A TypeScript client for running automated UI tests through the [Magnitude](https:/magnitude.run) testing platform.

## Installation

```bash
npm install magnitude-ts
```

## Setup

First, you'll need to initialize the Magnitude client with your API key. You can do this in two ways:

1. Pass the API key directly to the constructor:
```typescript
import { Magnitude } from 'magnitude-ts';

const client = new Magnitude('your-api-key-here');
```

2. Set it as an environment variable:
```bash
export MAGNITUDE_API_KEY=your-api-key-here
```

Then initialize without passing the key:
```typescript
const client = new Magnitude();
```

## Usage

### Creating a Test Case

A test case consists of a series of steps, each with its own checks and test data. Here's the complete structure with descriptions:

```typescript
interface TestCase {
    // Unique identifier for the test case
    id: string;
    
    // Human-readable name of the test case (1-50 characters)
    name: string;
    
    // Starting URL where the test will begin (valid domain with or without https://)
    url: string;
    
    // Array of steps to execute in sequence (minimum 1 step required)
    steps: TestStep[];
}

interface TestStep {
    // Description of what this step does (5-125 characters)
    description: string;
    
    // Optional array of assertions/checks to verify during this step
    // Each check must be 5-125 characters, maximum 5 checks allowed
    checks?: string[];
    
    // Optional test data used during this step
    test_data?: TestData;
}

interface TestData {
    // Optional array of key-value pairs used in the test
    // Defaults to empty array if not provided
    data?: TestDataEntry[];
    
    // Optional additional context or metadata for the test step
    // Defaults to empty string if not provided
    other?: string;
}

interface TestDataEntry {
    // Identifier for this piece of test data
    key: string;
    
    // The actual test data value
    value: string;
    
    // Whether this data should be masked in logs/reports
    // Defaults to false if not provided
    sensitive?: boolean;
}
```

Example of a complete test case:

```typescript
const testCase: TestCase = {
    id: "login-test",
    name: "Login Flow Test",
    url: "https://example.com/login",
    steps: [
        {
            description: "Fill in login form",
            checks: [
                "Login form is visible",
                "Submit button is enabled"
            ],
            test_data: {
                data: [
                    {
                        key: "username",
                        value: "testuser",
                        sensitive: false  // Will be shown in logs
                    },
                    {
                        key: "password",
                        value: "testpass123",
                        sensitive: true   // Will be masked in logs
                    }
                ],
                other: "additional context if needed"
            }
        },
        {
            description: "Verify dashboard access",
            checks: [
                "URL should contain /dashboard",
                "Welcome message should be visible"
            ],
            test_data: {
                data: [],
                other: "Verification step"
            }
        }
    ]
};
```

### Running Tests

#### Single Test Case

```typescript
const result = await client.runTestCase(testCase);
```

Tests typically take 2-5 minutes to complete.

#### Multiple Test Cases

```typescript
const results = await client.runMultipleTestCases([testCase1, testCase2]);
```

All tests run in parallel with the same execution time.

### Processing Results

The test runner returns a `TestRun` object containing detailed information about the test execution. You can use the built-in parser to get a human-readable output:

```typescript
// Parse a single test run
const readableOutput = client.parseTestRun(result);
console.log(readableOutput);
```

The parsed output includes:
- Test run summary (ID, creation time, status)
- Detailed steps information
- Check results with pass/fail status
- Any problems encountered during testing
- Actions taken during the test

### Progress Tracking

You can track test progress in real-time by providing a progress callback function to `runTestCase` or `runMultipleTestCases`. The callback receives the current `TestRun` object as it updates:

```typescript
// Custom progress callback
const onProgress = (testRun: TestRun) => {
    const completedSteps = testRun.steps.filter(step => step.status !== 'pending').length;
    const totalSteps = testRun.steps.length;
    console.log(`Progress: ${completedSteps}/${totalSteps} steps completed`);
};

// Use with runTestCase
const result = await client.runTestCase(testCase, onProgress);

// Use with multiple test cases
const results = await client.runMultipleTestCases([testCase1, testCase2], onProgress);
```

For convenience, Magnitude provides a default progress handler that shows detailed progress information:

```typescript
// Use the built-in progress handler
const defaultProgress = Magnitude.createDefaultProgressHandler();
const result = await client.runTestCase(testCase, defaultProgress);
```

The default handler displays:
- Overall progress percentage
- Currently executing step
- Completed steps with their check results
- Real-time status of checks in the current step

### Test Run Structure

The `TestRun` response provides detailed information about the test execution:

```typescript
interface TestRun {
    // Unique identifier for this test run
    id: string;
    
    // ISO timestamp of when the test run was created
    created_at: string;
    
    // Chronological list of all actions taken during the test
    actions: TestAction[];
    
    // Results for each step in the test case
    steps: TestStepResult[];
    
    // Whether the test run has completed
    is_done: boolean;
    
    // Whether the test run was aborted
    aborted: boolean;
    
    // Reason for abortion if the test was aborted
    aborted_reason?: string;
}

interface TestAction {
    // Type of action performed
    variant: "load" | "click" | "hover" | "type" | "scroll" | "wait" | "back";
    
    // Human-readable description of the action
    description: string;
    
    // URL to screenshot taken after this action
    screenshot_url: string;
}

interface TestStepResult {
    // Description from the original test step
    description: string;
    
    // Current status of this step
    status: "pending" | "passed" | "failed";
    
    // Index of the last action performed in this step
    last_action_index: number;
    
    // Results of individual checks within this step
    checks: TestCheckResult[];
    
    // Any problems encountered during this step
    problems?: Problem[];
}

interface TestCheckResult {
    // Description of what was being checked
    description: string;
    
    // Current status of this check
    status: "pending" | "passed" | "failed";
    
    // Index of the last action performed for this check
    last_action_index: number;
    
    // Any problems encountered during this check
    problems?: Problem[];
}

interface Problem {
    // Description of what went wrong
    title: string;
    
    // How severe the problem is
    severity: "critical" | "high" | "medium" | "low" | "cosmetic";
    
    // Type of problem encountered
    category: "visual" | "functional";
    
    // What was expected to happen
    expected_result: string;
    
    // What actually happened
    actual_result: string;
    
    // Index of the action where the problem occurred
    action_index: number;
    
    // Whether this problem caused the test to stop
    is_fatal: boolean;
}
```

## Example

Here's a complete example of setting up and running a test:

```typescript
import { Magnitude, TestCase } from 'magnitude-ts';

async function runLoginTest() {
    // Initialize client
    const client = new Magnitude(process.env.MAGNITUDE_API_KEY);

    // Create test case
    const loginTest: TestCase = {
        id: "login-test",
        name: "Basic Login Test",
        url: "https://example.com/login",
        steps: [
            {
                description: "Login with valid credentials",
                checks: [
                    "Login form should be visible",
                    "Submit button should be enabled",
                    "Should redirect to dashboard after login"
                ],
                test_data: {
                    data: [
                        {
                            key: "username",
                            value: "testuser",
                            sensitive: false
                        },
                        {
                            key: "password",
                            value: "securepass123",
                            sensitive: true
                        }
                    ],
                    other: ""
                }
            }
        ]
    };

    // Use the default progress handler
    const progressHandler = Magnitude.createDefaultProgressHandler();

    // Run the test with progress tracking
    const result = await client.runTestCase(loginTest, progressHandler);

    // Parse and display results
    console.log(client.parseTestRun(result));
}

runLoginTest().catch(console.error);
```

## Error Handling

The client will throw errors in these cases:
- No API key provided (either through constructor or environment variable)
- Invalid test case format
- API connection issues

Make sure to wrap your calls in try-catch blocks for proper error handling. 
