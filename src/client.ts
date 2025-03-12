import axios, { AxiosInstance } from 'axios';
import { TestCase as TestCaseData, TestRun as TestRunData } from './types';
import { validateTestCase } from './schema';

interface MagnitudeConfig {
    // Magnitude API key. Get one at https://app.magnitude.run/
    apiKey?: string;
    // Magnitude API URL
    baseUrl?: string;
    // Timeout for API requests to Magnitude backend
    apiTimeout?: number;
    // Tunnel server URL
    tunnelUrl?: string;
    // Whether to automatically try and tunnel to local URLs
    autoTunnel?: boolean;
    // Whether to throw an error when encountering a critical problem (default: true)
    throwOnProblem?: boolean;
    // Whether to throw an error when encountering an unexpected warning (default: false)
    throwOnWarning?: boolean;
}

const DEFAULT_CONFIG: Omit<Required<MagnitudeConfig>, 'apiKey'> = {
    baseUrl: 'https://api.app.magnitude.run/api',
    apiTimeout: 30000,
    tunnelUrl: 'https://api.app.magnitude.run:4444',
    autoTunnel: true,
    throwOnProblem: true,
    throwOnWarning: false,
};

// Ensure the global state exists
if (!(global as any).__magnitude__) {
    (global as any).__magnitude__ = {
        instance: null,
        initialized: false
    };
}

export class Magnitude {
    private config: Required<MagnitudeConfig>;
    private api: AxiosInstance;

    private constructor(config: MagnitudeConfig) {
        config = {
            ...DEFAULT_CONFIG,
            ...{ apiKey: process.env.MAGNITUDE_API_KEY },
            ...config
        };

        if (!config.apiKey) {
            throw new Error('API key is required. Provide it in config or set MAGNITUDE_API_KEY environment variable.');
        }

        this.api = axios.create({
            baseURL: config.baseUrl,
            timeout: config.apiTimeout,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.apiKey
            }
        });
        this.config = config as Required<MagnitudeConfig>;
    }

    public static init(config: MagnitudeConfig = {}): void {
        //console.log("Magnitude init()", config);
        (global as any).__magnitude__.instance = new Magnitude(config);
        (global as any).__magnitude__.initialized = true;
    }

    public static getInstance(): Magnitude {
        if (!(global as any).__magnitude__.instance) {
            this.init({});
        }
        return (global as any).__magnitude__.instance;
    }

    public static isInitialized(): boolean {
        if (!(global as any).__magnitude__.initialized) {
            // Attempt auto-initialize
            this.getInstance();
        }
        return (global as any).__magnitude__.initialized === true;
    }

    public static getTunnelUrl(): string {
        return this.getInstance().config.tunnelUrl;
    }

    public static isAutoTunnelEnabled(): boolean {
        return this.getInstance().config.autoTunnel;
    }

    public static shouldThrowOnProblem(): boolean {
        return this.getInstance().config.throwOnProblem;
    }

    public static shouldThrowOnWarning(): boolean {
        return this.getInstance().config.throwOnWarning;
    }

    public static async startTestRun(testCase: TestCaseData): Promise<TestRunData> {
        validateTestCase(testCase);
        const instance = this.getInstance();
        const response = await instance.api.post<TestRunData>('/run', testCase);
        return response.data;
    }

    public static async getTestRunStatus(runId: string): Promise<TestRunData> {
        const instance = this.getInstance();
        const response = await instance.api.get<TestRunData>(`/run/${runId}`);
        return response.data;
    }
}

export default Magnitude;