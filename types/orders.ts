export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'twap' | 'vwap' | 'iceberg' | 'trailing_stop' | 'oco';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export interface BaseOrder {
    id: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    status: OrderStatus;
    timestamp: number;
    filled: number;
    averagePrice?: number;
    exchange?: string;
    accountName?: string;
}

export interface MarketOrder extends BaseOrder {
    type: 'market';
}

export interface LimitOrder extends BaseOrder {
    type: 'limit';
    price: number;
}

export interface StopOrder extends BaseOrder {
    type: 'stop';
    stopPrice: number;
}

export interface TWAPOrder extends BaseOrder {
    type: 'twap';
    duration: number; // in minutes
    interval: number; // in seconds
    randomizeSize: boolean; // randomize chunk size
    randomizeInterval: boolean; // randomize time interval
    priceLimit?: number; // max buy price or min sell price
}

export interface VWAPOrder extends BaseOrder {
    type: 'vwap';
    duration: number; // in minutes
    participationRate: number; // percentage of volume to participate in (e.g., 0.1 for 10%)
    minVolume?: number; // min volume required to execute
}

export interface IcebergOrder extends BaseOrder {
    type: 'iceberg';
    price: number;
    visibleQuantity: number; // amount to show in order book
    variance?: number; // percentage variance in visible quantity
}

export interface TrailingStopOrder extends BaseOrder {
    type: 'trailing_stop';
    activationPrice?: number; // price to activate the trailing stop
    callbackRate?: number; // percentage drop/rise to trigger
    callbackValue?: number; // absolute value drop/rise to trigger
}

export interface OCOOrder extends BaseOrder {
    type: 'oco';
    price: number; // limit price
    stopPrice: number; // stop trigger price
    stopLimitPrice?: number; // limit price after stop trigger
}

export type AdvancedOrder =
    | MarketOrder
    | LimitOrder
    | StopOrder
    | TWAPOrder
    | VWAPOrder
    | IcebergOrder
    | TrailingStopOrder
    | OCOOrder;

export interface OrderHistoryFilter {
    symbol?: string;
    type?: OrderType[];
    status?: OrderStatus[];
    startTime?: number;
    endTime?: number;
}
