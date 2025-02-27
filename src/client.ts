import axios, { AxiosInstance } from 'axios';
import { TestCase as TestCaseData, TestRun as TestRunData } from './types';

export class Magnitude {
    private static instance: Magnitude | null = null;
    //private apiKey: string | null = null;
    private isInitialized: boolean = false;
    private api: AxiosInstance | null = null;

    private constructor() {
        // Try to initialize client / API key from environment
        //this.apiKey = process.env.MAGNITUDE_API_KEY || null;
        const apiKey = process.env.MAGNITUDE_API_KEY || null;

        console.log("API KEY:", apiKey);
        // if (apiKey) {
        //     Magnitude.init(apiKey);
        // }
        if (apiKey) {
            //Magnitude.init(apiKey);
            this._initializeApi(apiKey);
        }
    }

    // Private method for initialization logic
    private _initializeApi(apiKey: string): void {
        const api = axios.create({
            baseURL: 'https://api.app.magnitude.run/api',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        api.defaults.headers.common['X-API-Key'] = apiKey;

        api.interceptors.request.use(request => {
            console.log('Request URL:', request.url);
            console.log('Request Method:', request.method);
            console.log('Request Headers:', request.headers);
            return request;
        });

        this.api = api;
        this.isInitialized = true;
    }

    public static init(apiKey: string): void {
        const instance = Magnitude.getInstance();
        instance._initializeApi(apiKey);
        // const api = axios.create({
        //     baseURL: 'https://api.app.magnitude.run/api',
        //     timeout: 30000,
        //     headers: {
        //         'Content-Type': 'application/json',
        //     }
        // });
        // api.defaults.headers.common['X-API-Key'] = apiKey;
        // //instance.apiKey = apiKey;
        // instance.api = api;
        // instance.isInitialized = true;
    }

    public static isInitialized(): boolean {
        return Magnitude.getInstance().isInitialized;
    }

    public static getInstance(): Magnitude {
        // Get singleton instance
        if (!Magnitude.instance) {
            Magnitude.instance = new Magnitude();
        }
        return Magnitude.instance;
    }

    public getApi(): AxiosInstance {
        if (!this.api) {
            throw new Error('Magnitude not initialized. Call Magnitude.init() first.');
        }
        return this.api;
    }

    // public getApiKey(): string {
    //     if (!this.apiKey) {
    //         throw new Error('Magnitude not initialized. Call Magnitude.init() first.');
    //     }
    //     return this.apiKey;
    // }

    async startTestRun(testCase: TestCaseData): Promise<TestRunData> {
        const response = await this.getApi().post<TestRunData>('/run', testCase);
        return response.data;//.id;
    }
    //, attempt = 1, maxAttempts = 3
    async getTestRunStatus(runId: string): Promise<TestRunData> {
        const response = await this.getApi().get<TestRunData>(`/run/${runId}`);
        return response.data;
        // try {
        //     const response = await getApi().get<TestRun>(`/run/${runId}`);
        //     return response.data;
        // } catch (error) {
        //     if (attempt >= maxAttempts) throw error;
            
        //     // Exponential backoff: 2^attempt * 1000ms (1s, 2s, 4s, etc)
        //     const backoffDelay = Math.min(Math.pow(2, attempt) * 1000, 10000);
        //     await delay(backoffDelay);
            
        //     return getTestRunStatus(runId, attempt + 1, maxAttempts);
        // }
    }
}

export default Magnitude;