import axios, { AxiosInstance } from 'axios';
import { TestCase, TestRun } from './types';

// Progress callback type
export type ProgressCallback = (testRun: TestRun) => void;

// Default configuration
const DEFAULT_CONFIG = {
    baseURL: 'https://api.app.magnitude.run/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Create a configurable API instance
let apiInstance: AxiosInstance;

/**
 * Initialize the API instance with authentication
 * @param apiKey The API key for authentication
 */
export function initializeApi(apiKey: string): void {
    apiInstance = axios.create(DEFAULT_CONFIG);
    apiInstance.defaults.headers.common['X-API-Key'] = apiKey;
}

/**
 * Get the configured API instance
 * @throws Error if API is not initialized
 */
function getApi(): AxiosInstance {
    if (!apiInstance) {
        throw new Error('API not initialized. Call initializeApi with an API key first.');
    }
    return apiInstance;
}

/**
 * Starts a test case run and returns the run ID
 * @param testCase The test case to run
 * @returns Promise containing the run ID
 */
async function startTestRun(testCase: TestCase): Promise<string> {
    const response = await getApi().post<{ id: string }>('/run', testCase);
    return response.data.id;
}

/**
 * Gets the current status of a test run with retry and exponential backoff
 * @param runId The ID of the test run
 * @param attempt Current attempt number
 * @param maxAttempts Maximum number of retry attempts
 * @returns Promise containing the test run result
 */
async function getTestRunStatus(runId: string, attempt = 1, maxAttempts = 3): Promise<TestRun> {
    try {
        const response = await getApi().get<TestRun>(`/run/${runId}`);
        return response.data;
    } catch (error) {
        if (attempt >= maxAttempts) throw error;
        
        // Exponential backoff: 2^attempt * 1000ms (1s, 2s, 4s, etc)
        const backoffDelay = Math.min(Math.pow(2, attempt) * 1000, 10000);
        await delay(backoffDelay);
        
        return getTestRunStatus(runId, attempt + 1, maxAttempts);
    }
}

/**
 * Delay utility function
 * @param ms milliseconds to delay
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Runs a single test case and returns the test run result
 * @param testCase The test case to run
 * @param onProgress Optional callback for progress updates
 * @returns Promise containing the test run result
 */
export async function runTestCase(testCase: TestCase, onProgress?: ProgressCallback): Promise<TestRun> {
    const runId = await startTestRun(testCase);
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (true) {
        try {
            const testRun = await getTestRunStatus(runId);
            consecutiveErrors = 0; // Reset error count on success
            
            if (onProgress) {
                onProgress(testRun);
            }

            if (testRun.is_done) {
                return testRun;
            }

            await delay(5000);
        } catch (error) {
            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
                throw new Error(`Failed to get test run status after ${maxConsecutiveErrors} consecutive attempts`);
            }
            // Continue polling even after error
            await delay(5000);
        }
    }
}

/**
 * Runs multiple test cases in parallel and returns array of test run results
 * @param testCases Array of test cases to run
 * @param onProgress Optional callback for progress updates
 * @returns Promise containing array of test run results in the same order as input
 */
export async function runMultipleTestCases(testCases: TestCase[], onProgress?: ProgressCallback): Promise<TestRun[]> {
    const runIds = await Promise.all(testCases.map(testCase => startTestRun(testCase)));
    const results: TestRun[] = new Array(runIds.length);
    const pendingRunIds = new Set(runIds);

    while (pendingRunIds.size > 0) {
        const statusChecks = Array.from(pendingRunIds).map(async runId => {
            try {
                const testRun = await getTestRunStatus(runId);
                
                if (onProgress) {
                    onProgress(testRun);
                }

                if (testRun.is_done) {
                    pendingRunIds.delete(runId);
                    results[runIds.indexOf(runId)] = testRun;
                }
            } catch (error) {
                // Log error but continue polling
                console.error(`Error checking status for run ${runId}:`, error);
            }
        });

        await Promise.all(statusChecks);
        if (pendingRunIds.size > 0) {
            await delay(5000);
        }
    }

    return results;
}
