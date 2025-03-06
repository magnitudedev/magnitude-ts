import { Magnitude } from 'magnitude-ts';
import { beforeAll, afterAll } from 'vitest';

// Initialize Magnitude with test configuration
beforeAll(() => {
    Magnitude.init({
        // This is default anyway
        apiKey: process.env.MAGNITUDE_API_KEY
    });
});

// Clean up after all tests
afterAll(() => {
    // Any cleanup code if needed
});
