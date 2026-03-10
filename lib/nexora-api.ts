/**
 * Nexora API Client
 * =================
 * 
 * TypeScript client wrapper for the Nexora Bot API.
 * Handles authentication, request/response formatting, and error handling.
 */

// Empty string = use relative URLs → Next.js proxy handles routing to the droplet
const NEXORA_API_URL = process.env.NEXT_PUBLIC_NEXORA_API_URL || '/api';

// Types
export interface Token {
    access_token: string;
    token_type: string;
}

export interface User {
    username: string;
    email?: string;
    full_name?: string;
    disabled?: boolean;
    scopes: string[];
}

export interface Regime {
    regime: string;
    strength: number;
    timestamp: string;
    description: string;
    source: string;
}

export interface RegimeHistory {
    history: Array<{
        regime: string;
        timestamp: string;
        duration_minutes?: number;
        strength?: number;
        metadata?: any;
    }>;
    source: string;
}

export interface Portfolio {
    total_value_usd: number;
    cex: {
        total_usd: number;
        details: any;
    };
    dex: {
        total_usd: number;
        details: any;
    };
    orchestrator?: {
        best_bid: number;
        best_ask: number;
        spread: number;
        venues: string[];
    };
    timestamp: string;
}

export interface Position {
    symbol: string;
    size: number;
    entry_price: number;
    current_price: number;
    pnl_usd: number;
    pnl_pct: number;
}

export interface Positions {
    cex_positions: Position[];
    dex_positions: Position[];
    total_positions: number;
}

export interface StrategyPerformance {
    strategy: string;
    status: string;
    performance: {
        profit_usd: number;
        win_rate: number;
        total_trades?: number;
        sharpe_ratio?: number;
    };
}

export interface Strategies {
    cex: StrategyPerformance;
    dex: StrategyPerformance;
}

export interface RiskStatus {
    global_exposure_pct: number;
    max_exposure_pct: number;
    current_drawdown_pct: number;
    max_drawdown_pct: number;
    kill_switch_active: boolean;
    position_limits: {
        max_position_usd: number;
        current_largest_position_usd: number;
    };
    source: string;
}

export interface RiskAlert {
    level: string;
    message: string;
    timestamp: string;
}

// Import the shared token getter from backend-api
import { getAccessToken } from './backend-api';

// API Client Class
class NexoraAPIClient {
    private baseURL: string;

    constructor(baseURL: string = NEXORA_API_URL) {
        this.baseURL = baseURL;
    }

    // Use shared authentication - no separate login needed
    // The main app handles authentication via backend-api
    async getCurrentUser(): Promise<User> {
        return this.get<User>('/auth/me');
    }

    // Generic request methods
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        // Add authentication using shared token system
        const token = getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token expired or insufficient permissions
                throw new Error(`Authentication Error: ${response.statusText}`);
            }
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    private async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    private async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // Health & Status
    async getHealth() {
        return this.get<any>('/health');
    }

    async getStatus() {
        return this.get<any>('/status');
    }

    // Regime Detection
    async getCurrentRegime(): Promise<Regime> {
        return this.get<Regime>('/regime');
    }

    async getRegimeHistory(limit: number = 100): Promise<RegimeHistory> {
        return this.get<RegimeHistory>(`/regime/history?limit=${limit}`);
    }

    // Portfolio
    async getPortfolio(): Promise<Portfolio> {
        return this.get<Portfolio>('/portfolio');
    }

    async getPositions(): Promise<Positions> {
        return this.get<Positions>('/portfolio/positions');
    }

    // Strategies
    async getStrategies(): Promise<Strategies> {
        return this.get<Strategies>('/strategies');
    }

    async getStrategyPerformance() {
        return this.get<any>('/strategies/performance');
    }

    async routeStrategies(regime: string, force: boolean = false) {
        return this.post<any>('/strategies/route', { regime, force });
    }

    // Risk Monitoring
    async getRiskStatus(): Promise<RiskStatus> {
        return this.get<RiskStatus>('/risk');
    }

    async getRiskAlerts() {
        return this.get<{ alerts: RiskAlert[] }>('/risk/alerts');
    }

    // Analytics
    async getRecentTrades(limit: number = 100): Promise<{ trades: any[] }> {
        return this.get<{ trades: any[] }>(`/analytics/trades?limit=${limit}`);
    }

    async getRiskAssessment() {
        return this.get<any>('/risk');
    }

    async getAnalyticsPerformance() {
        return this.get<any>('/analytics/performance');
    }

    // Orders (Standard + Advanced)
    async getUnifiedOrders(): Promise<{ standard: any[], advanced: any[], total_count: number }> {
        return this.get<{ standard: any[], advanced: any[], total_count: number }>('/unified-orders');
    }

    async getAdvancedOrders(): Promise<{ orders: any[] }> {
        return this.get<{ orders: any[] }>('/orders/advanced');
    }

    async submitAdvancedOrder(orderData: {
        type: string;
        symbol: string;
        side: string;
        size: number;
        duration: number;
    }) {
        return this.post<any>('/orders/advanced', orderData);
    }
}

// Export singleton instance
export const nexoraAPI = new NexoraAPIClient();

// Export class for custom instances
export default NexoraAPIClient;
