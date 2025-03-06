# Magnitude-TS with Vitest Example

This example demonstrates how to use the Magnitude-TS SDK with Vitest for UI testing.

## Project Structure

- `public/` - A simple login page for testing
- `tests/` - Vitest test files using Magnitude-TS
- `vitest.config.ts` - Vitest configuration

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Running the Example Site

```bash
# Start the local server
npm run serve
```

This will start a local server at http://localhost:3000 with the login page.

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Login Credentials

For the example site, use these credentials:

- Username: `testuser`
- Password: `password123`

## How It Works

This example demonstrates:

1. **Setting up Magnitude with Vitest** - Configuration and initialization
2. **Creating Test Cases** - Defining test steps and assertions
3. **Mocking Magnitude** - Using Vitest's mocking capabilities to test without real API calls
4. **Combining Assertions** - Using both Magnitude's built-in checks and Vitest's expect API

## Key Concepts

### Test Structure

Magnitude tests are organized into test cases with steps:

```typescript
const loginTest = new TestCase({
  id: 'login-test',
  name: 'Login Test',
  url: 'http://localhost:3000',
});

loginTest.addStep('Navigate to login page')
  .check('Login form is visible');
  
loginTest.addStep('Enter credentials')
  .data({ username: 'testuser' })
  .secureData({ password: 'password123' });
  
loginTest.addStep('Click login button')
  .check('User is logged in successfully');
```

### Running Tests

Tests can be run and awaited:

```typescript
const result = await loginTest.run().show();

// Use Vitest assertions
expect(result.hasPassed()).toBe(true);
```

### Mocking

The example shows how to mock Magnitude for unit testing:

```typescript
vi.mock('magnitude-ts', async (importOriginal) => {
  // Mock implementation
});
```

## Notes

- In a real-world scenario, you would need a valid Magnitude API key
- The mocks in this example always return success for simplicity
