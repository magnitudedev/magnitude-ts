# Magnitude

[Magnitude](https://magnitude.run) is AI-powered E2E testing for web apps. Sign up [here](https://app.magnitude.run/signup).

This repo is a TypeScript client for running natural language test cases with Magnitude.

Magnitude can be used however you like, but some common use cases include:
- Pre-deployment E2E testing: Check all your core user flows before deploying with low maintenance.
- Production monitoring: Make sure key flows are always working properly and find bugs before your users do.
- Local testing - Magnitude can run on any machine with no additional setup. Use it in dev environments, pipelines, or wherever.

## Installation

```bash
npm install magnitude-ts
```

## Setup

First, you'll need to initialize the Magnitude client with your API key. You can get a free API key by signing up at https://app.magnitude.run/signup, then creating one in Settings->API Keys. Then configure it in one of two ways:

1. Initialize in code:
```typescript
import { Magnitude } from 'magnitude-ts';

Magnitude.init({ apiKey: 'your-api-key-here' });
```

2. Or set it as an environment variable:
```bash
export MAGNITUDE_API_KEY=your-api-key-here
```


## Running Test Cases

Here's a basic test case:
```ts
import { TestCase } from 'magnitude-ts';

async function runTest() {
    const loginTest = new TestCase({
        id: "login-test", // any ID you want
        name: "Basic Login Test", // friendly name, optional
        url: "https://qa-bench.com" // target site url
    });
    
    loginTest.addStep("Login to the app")
        .check("Can see dashboard") // natural language assertion
        .data({ username: "test-user@magnitude.com" } // arbitrary key/values
        .secureData({ password: "test" }); // encrypted data
    // ^ in reality pull sensitive data from process.env or wherever
    
    loginTest.addStep("Create a new company")
        .data("Make up the first 2 values and use defaults for the rest")
        .check("Company added successfully");
    
    // start the test case!
    const result = await loginTest.run().show();

    // do whatever based on result - e.g. halt deployment if fails
    if (!result.hasPassed()) {
        console.log("Test failed! Problems:", result.getProblems());
    }
}

runTest();
```

Any step descriptions, checks, or data are represented in natural language. You can be as vague or specific as you'd like - though more specificity does generally lead to more consistent test runs.

For more examples see the [examples folder](./examples).

## Tunneling

Magnitude runs the browser and AI agent so you don't have to. In order to access locally running sites, a secure HTTP tunnel is established from our servers to your localhost when you specify a private URL (for example `localhost:3000` or `127.0.0.1`).

This is handled automatically - when you specify a private URL the SDK will detect this and establish a reverse tunnel first.

## How it Works

Magnitude uses multi-modal LLMs and state-of-the-art web interaction techniques to follow the intention of a natural language test case, rather than specific brittle instructions that rely on selectors (e.g. selenium or playwright).

The LLM decides at runtime what to do based on the test case steps, a screenshot of the browser, a history of its own activity, and other information. If it encounters something unexpected, a problem will be reported and categorized. If the problem encountered inhibits the further execution of the test case, the test case fails. Some problems identiifed may not justify a failure of the test case, but indicate some smaller visual issue or bug.

## Contact

To get a personalized demo or see how Magnitude can help your company, feel free to reach out to us at founders@magnitude.run

You can also join our Discord community for help or any suggestions! https://discord.gg/VcdpMh9tTy