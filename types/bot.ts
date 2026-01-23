export type BotStatus = 'running' | 'stopped' | 'stopping' | 'starting' | 'error';

export interface BotConfig {
    strategy: string;
    exchange: string;
    pairs?: string[];
    tradingPair?: string; // Single trading pair (e.g., "BTC-USDT")
}

export interface Bot {
    id: string;
    name: string;
    status: BotStatus;
    strategy?: string;
    config: BotConfig;
    uptime?: number; // in seconds
    deployedAt?: string;
    startedAt?: string;
    exchange?: string;
    tradingPair?: string;
    performance?: {
        total_pnl: number;
        total_trades: number;
        total_volume?: number;
        total_fees?: number;
        last_error_timestamp?: number;
        log_counts?: {
            errors: number;
            warnings: number;
            infos: number;
        };
    };
    isOrphaned?: boolean;
    isNexoraInternal?: boolean;
}
