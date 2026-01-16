/**
 * API Router - Hummingbot API Integration
 * ========================================
 * Routes all API calls to Hummingbot API (Port 8000)
 */

// API URL for Hummingbot
export const getApiUrls = () => {
    return {
        baseUrl: process.env.HUMMINGBOT_API_URL || 'http://localhost:8000',
    };
};

// Helper to check API health before operations
export const checkApiHealth = async (): Promise<{
    healthy: boolean;
    error?: string;
}> => {
    const { baseUrl } = getApiUrls();

    try {
        const response = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
            return { healthy: true };
        }

        return {
            healthy: false,
            error: `API returned ${response.status}`
        };
    } catch (error: any) {
        return {
            healthy: false,
            error: error.message || 'Connection failed'
        };
    }
};

// Singleton for API configuration
class ApiRouter {
    private static instance: ApiRouter;

    private constructor() {
        console.log(`[ApiRouter] Initialized - Connecting to Hummingbot API`);
    }

    static getInstance(): ApiRouter {
        if (!ApiRouter.instance) {
            ApiRouter.instance = new ApiRouter();
        }
        return ApiRouter.instance;
    }

    getBaseUrl(): string {
        return getApiUrls().baseUrl;
    }
}

export const apiRouter = ApiRouter.getInstance();
