/**
 * Nexora API Client for Next.js UI
 * ================================
 * 
 * TypeScript/JavaScript client for connecting Next.js UI to Nexora Bot API.
 */


// lib/nexora-api.ts

const NEXORA_API_URL = process.env.NEXT_PUBLIC_NEXORA_API_URL || 'http://localhost:8888';

export interface RegimeData {
  regime: string;
  strength: number;
  timestamp: string;
  description: string;
}

export interface PortfolioData {
  total_value_usd: number;
  cex: {
    total_usd: number;
    details: any;
  };
  dex: {
    total_usd: number;
    details: any;
  };
  timestamp: string;
}

export interface RiskData {
  global_exposure_pct: number;
  max_exposure_pct: number;
  current_drawdown_pct: number;
  max_drawdown_pct: number;
  kill_switch_active: boolean;
  position_limits: {
    max_position_usd: number;
    current_largest_position_usd: number;
  };
}

export interface StrategyData {
  cex: {
    strategy: string;
    status: string;
    performance: any;
  };
  dex: {
    strategy: string;
    status: string;
    performance: any;
  };
}

class NexoraAPIClient {
  private baseURL: string;

  constructor(baseURL: string = NEXORA_API_URL) {
    this.baseURL = baseURL;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Health & Status
  async getHealth() {
    return this.fetch('/health');
  }

  async getStatus() {
    return this.fetch('/status');
  }

  // Regime
  async getRegime(): Promise<RegimeData> {
    return this.fetch<RegimeData>('/regime');
  }

  async getRegimeHistory(limit: number = 100) {
    return this.fetch(`/regime/history?limit=${limit}`);
  }

  // Portfolio
  async getPortfolio(): Promise<PortfolioData> {
    return this.fetch<PortfolioData>('/portfolio');
  }

  async getPositions() {
    return this.fetch('/portfolio/positions');
  }

  // Strategies
  async getStrategies(): Promise<StrategyData> {
    return this.fetch<StrategyData>('/strategies');
  }

  async getStrategyPerformance() {
    return this.fetch('/strategies/performance');
  }

  async routeStrategies(regime: string, force: boolean = false) {
    return this.fetch('/strategies/route', {
      method: 'POST',
      body: JSON.stringify({ regime, force }),
    });
  }

  // Risk
  async getRisk(): Promise<RiskData> {
    return this.fetch<RiskData>('/risk');
  }

  async getRiskAlerts() {
    return this.fetch('/risk/alerts');
  }
}

// Export singleton instance
export const nexoraAPI = new NexoraAPIClient();

// Export class for custom instances
export default NexoraAPIClient;
