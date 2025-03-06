import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { TestCase, TestRunResult } from 'magnitude-ts';
import { TunnelClient } from 'bunnel';

describe('Login Test with Magnitude', { timeout: 300000 }, () => {
    const TEST_URL = 'http://localhost:3000';

    it('should successfully log in with valid credentials', async () => {
        // Create a test case
        console.log("Creating test case")
        const loginTest = new TestCase({
            id: 'login-test',
            name: 'Login Test with Vitest',
            url: TEST_URL,
        });

        loginTest.addStep('Login')
            .data({ username: 'testuser' })
            .secureData({ password: 'password123' })
            .check('Dashboard is visible');

        await loginTest.run();
    });
});
