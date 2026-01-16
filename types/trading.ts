// Order Book Types
export interface OrderBookLevel {
    price: string;
    quantity: string;
    total?: string;
}

export interface OrderBookData {
    symbol: string;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    spread: number;
    spreadPercent: number;
    lastUpdateId?: number;
    timestamp: number;
}

// Position Types
export interface Position {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    leverage: number;
    liquidationPrice?: number;
    marginUsed: number;
    timestamp: number;
}

// PnL Types
export interface PnLData {
    totalPnL: number;
    totalPnLPercent: number;
    realizedPnL: number;
    unrealizedPnL: number;
    dailyPnL: number;
    weeklyPnL: number;
    monthlyPnL: number;
    positions: Position[];
    timestamp: number;
}

// Trade Execution Types
export interface TradeExecution {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    price: number;
    quantity: number;
    filled: number;
    status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected';
    timestamp: number;
    exchange: string;
    pnl?: number;
    fee?: number;
    feeAsset?: string;
}

// Risk Metrics Types
export interface PortfolioRisk {
    totalValue: number;
    totalExposure: number;
    leverage: number;
    marginUtilization: number;
    var95: number;
    var99: number;
    maxDrawdown: number;
    riskScore: number;
    limits: RiskLimits;
    exposure: ExposureBreakdown;
    drawdown: DrawdownData[];
    correlation: CorrelationMatrix;
    timestamp: number;
}

export interface RiskLimits {
    maxLeverage: number;
    maxDrawdown: number;
    maxPositionSize: number;
    maxDailyLoss: number;
    currentLeverage: number;
    currentDrawdown: number;
    currentDailyLoss: number;
}

export interface ExposureBreakdown {
    byAsset: Record<string, number>;
    byExchange: Record<string, number>;
    byStrategy: Record<string, number>;
}

export interface DrawdownData {
    timestamp: number;
    value: number;
    percentage: number;
}

export interface CorrelationMatrix {
    assets: string[];
    matrix: number[][];
}

// Alert Types
export interface Alert {
    id: string;
    type: 'price' | 'pnl' | 'risk' | 'execution';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
    acknowledged: boolean;
}

// Market Data Types
export interface TickerData {
    symbol: string;
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
    timestamp: number;
}
