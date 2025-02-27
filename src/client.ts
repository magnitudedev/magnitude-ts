
export class Magnitude {
    private static instance: Magnitude | null = null;
    private apiKey: string | null = null;
    private isInitialized: boolean = false;

    private constructor() {
        // Try to initialize client / API key from environment
        this.apiKey = process.env.MAGNITUDE_API_KEY || null;
        this.isInitialized = this.apiKey != null;
    }

    public static init(apiKey: string): void {
        const instance = Magnitude.getInstance();
        instance.apiKey = apiKey;
        instance.isInitialized = true;
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

    public getApiKey(): string {
        if (!this.apiKey) {
            throw new Error('Magnitude not initialized. Call Magnitude.init() first.');
        }
        return this.apiKey;
    }
}

export default Magnitude;