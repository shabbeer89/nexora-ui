export type StrategyType = 'pure_market_making' | 'cross_exchange_market_making' | 'avellaneda_market_making' | 'directional_strategy' | 'arbitrage' | 'dca_strategy' | 'twap' | 'vwap' | 'liquidity_mining' | 'stat_arb' | 'mean_reversion' | 'momentum' | 'rebalance' | 'smart_bot';

export interface StrategyParameter {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'percentage';
    defaultValue: any;
    description: string;
    options?: string[]; // For select type
    min?: number;
    max?: number;
    step?: number;
    required: boolean;
}

export interface StrategyConfig {
    id: string;
    name: string;
    type: StrategyType;
    description: string;
    parameters: Record<string, any>;
    created: number;
    updated: number;
    status: 'active' | 'inactive' | 'backtesting';
}

export interface BacktestConfig {
    strategyId: string;
    exchange: string;
    pair: string;
    startDate: number;
    endDate: number;
    initialBalance: number;
    includeFees: boolean;
}

export interface BacktestResult {
    id: string;
    strategyId: string;
    config: BacktestConfig;
    metrics: {
        totalReturn: number;
        sharpeRatio: number;
        maxDrawdown: number;
        trades: number;
        winRate: number;
    };
    equityCurve: { timestamp: number; value: number }[];
    trades: any[]; // TradeExecution[]
    logs: string[];
    timestamp: number;
}

// Strategy Templates
export const STRATEGY_TEMPLATES: Record<StrategyType, StrategyParameter[]> = {
    pure_market_making: [

        {
            name: 'bid_spread',
            label: 'Bid Spread (%)',
            type: 'percentage',
            defaultValue: 0.1,
            min: 0.01,
            max: 5,
            step: 0.01,
            description: 'Distance from mid price to place bid order',
            required: true
        },
        {
            name: 'ask_spread',
            label: 'Ask Spread (%)',
            type: 'percentage',
            defaultValue: 0.1,
            min: 0.01,
            max: 5,
            step: 0.01,
            description: 'Distance from mid price to place ask order',
            required: true
        },
        {
            name: 'order_amount',
            label: 'Order Amount (Base Asset)',
            type: 'number',
            defaultValue: 0.001,
            min: 0,
            description: 'Size of the order to place',
            required: true
        },
        {
            name: 'order_refresh_time',
            label: 'Order Refresh Time (s)',
            type: 'number',
            defaultValue: 30,
            min: 5,
            description: 'How often to cancel and replace orders',
            required: true
        },
        {
            name: 'price_type',
            label: 'Price Source',
            type: 'select',
            defaultValue: 'mid',
            options: ['mid', 'last'],
            description: 'Price reference: mid-price or last-trade price',
            required: true
        },
        {
            name: 'max_order_age',
            label: 'Max Order Age (s)',
            type: 'number',
            defaultValue: 300,
            min: 60,
            description: 'Maximum time an order can stay open before forced refresh',
            required: true
        },
        {
            name: 'inventory_skew_enabled',
            label: 'Inventory Management',
            type: 'boolean',
            defaultValue: true,
            description: 'Automatically adjust spreads to maintain target inventory',
            required: false
        },
        {
            name: 'target_base_pct',
            label: 'Target Base %',
            type: 'percentage',
            defaultValue: 0.5,
            min: 0,
            max: 1,
            description: 'Target percentage of base asset to hold (0.5 = 50%)',
            required: false
        },
        {
            name: 'stop_loss_enabled',
            label: 'Stop Loss Protection',
            type: 'boolean',
            defaultValue: true,
            description: 'Halt strategy if total loss exceeds threshold',
            required: false
        },
        {
            name: 'max_loss_pct',
            label: 'Max Loss Threshold (%)',
            type: 'percentage',
            defaultValue: 5.0,
            min: 0.1,
            max: 50,
            description: 'Maximum acceptable loss from starting balance',
            required: false
        }
    ],
    cross_exchange_market_making: [

        {
            name: 'taker_exchange',
            label: 'Taker Exchange',
            type: 'select',
            defaultValue: 'kucoin',
            description: 'Exchange where market orders are placed to hedge',
            options: ['binance', 'kucoin', 'gate_io'],
            required: true
        },
        {
            name: 'min_profitability',
            label: 'Min Profitability (%)',
            type: 'percentage',
            defaultValue: 0.5,
            min: 0.1,
            description: 'Minimum profit margin required to trade',
            required: true
        },
        {
            name: 'order_amount',
            label: 'Order Amount',
            type: 'number',
            defaultValue: 0.001,
            min: 0,
            description: 'Size of the order to place',
            required: true
        }
    ],
    avellaneda_market_making: [

        {
            name: 'order_amount',
            label: 'Order Amount',
            type: 'number',
            defaultValue: 0.1,
            description: 'Size of the order to place',
            required: true
        },
        {
            name: 'min_spread',
            label: 'Min Spread (%)',
            type: 'percentage',
            defaultValue: 0.5,
            min: 0.1,
            max: 5,
            description: 'Minimum spread from mid price',
            required: true
        },
        {
            name: 'max_spread',
            label: 'Max Spread (%)',
            type: 'percentage',
            defaultValue: 5.0,
            min: 0.5,
            max: 20,
            description: 'Maximum spread from mid price',
            required: true
        },
        {
            name: 'vol_to_spread_multiplier',
            label: 'Vol to Spread Mult',
            type: 'number',
            defaultValue: 1.0,
            description: 'Multiplier for volatility',
            required: true
        },
        {
            name: 'inventory_risk_aversion',
            label: 'Inv. Risk Aversion',
            type: 'number',
            defaultValue: 0.5,
            description: 'Inventory risk aversion factor',
            required: true
        }
    ],
    directional_strategy: [

        {
            name: 'candles_exchange',
            label: 'Candles Exchange',
            type: 'select',
            defaultValue: 'binance_perpetual',
            description: 'Exchange to fetch candles from',
            options: ['binance_perpetual', 'binance'],
            required: true
        },
        {
            name: 'candles_pair',
            label: 'Candles Pair',
            type: 'string',
            defaultValue: 'ETH-USDT',
            description: 'Pair to fetch candles for',
            required: true
        },
        {
            name: 'candles_interval',
            label: 'Interval',
            type: 'select',
            defaultValue: '1m',
            options: ['1m', '3m', '5m', '15m', '1h', '4h'],
            description: 'Candle interval',
            required: true
        },
        {
            name: 'rsi_low',
            label: 'RSI Low',
            type: 'number',
            defaultValue: 30,
            min: 1,
            max: 49,
            description: 'RSI Lower Threshold (Buy)',
            required: true
        },
        {
            name: 'rsi_high',
            label: 'RSI High',
            type: 'number',
            defaultValue: 70,
            min: 51,
            max: 99,
            description: 'RSI Upper Threshold (Sell)',
            required: true
        },
        {
            name: 'leverage',
            label: 'Leverage',
            type: 'number',
            defaultValue: 1,
            min: 1,
            max: 100,
            description: 'Leverage to use',
            required: true
        }
    ],
    dca_strategy: [
        {
            name: 'total_investment_amount',
            label: 'Total Investment Amount ($)',
            type: 'number',
            defaultValue: 600,
            min: 100,
            description: 'Maximum capital allocated to this DCA bot.',
            required: true
        },
        {
            name: 'side',
            label: 'Trade Side',
            type: 'select',
            defaultValue: 'buy',
            options: ['buy', 'sell'],
            description: 'Direction of DCA (buy for long, sell for short)',
            required: true
        },
        // Sizing
        {
            name: 'use_account_percentage',
            label: 'Use Account % Sizing',
            type: 'boolean',
            defaultValue: true,
            description: 'Size orders as a percentage of available balance',
            required: false
        },
        {
            name: 'account_risk_percentage',
            label: 'Account Risk %',
            type: 'number',
            defaultValue: 1.0,
            min: 0.1,
            max: 5,
            step: 0.1,
            description: 'Percentage of account to risk per trade',
            required: false
        },
        {
            name: 'base_order_amount',
            label: 'Base Order Amount',
            type: 'number',
            defaultValue: 100,
            min: 0,
            description: 'Size of the initial entry order.',
            required: true
        },
        {
            name: 'safety_order_amount',
            label: 'Safety Order Amount',
            type: 'number',
            defaultValue: 100,
            min: 0,
            description: 'Size of each DCA safety order.',
            required: true
        },
        {
            name: 'max_safety_orders',
            label: 'Max Safety Orders',
            type: 'number',
            defaultValue: 3,
            min: 1,
            max: 10,
            description: 'Maximum number of safety orders to place.',
            required: true
        },
        {
            name: 'safety_order_volume_scale',
            label: 'SO Volume Scale',
            type: 'number',
            defaultValue: 1.2,
            min: 1.0,
            max: 2.0,
            step: 0.1,
            description: 'Volume multiplier for each subsequent safety order.',
            required: true
        },
        {
            name: 'max_total_exposure_multiplier',
            label: 'Max Exposure Multiplier',
            type: 'number',
            defaultValue: 2.5,
            min: 1.0,
            max: 5.0,
            step: 0.1,
            description: 'Maximum total exposure relative to base order.',
            required: true
        },
        // Spacing
        {
            name: 'use_atr_spacing',
            label: 'Use ATR Spacing',
            type: 'boolean',
            defaultValue: true,
            description: 'Adjust SO spacing based on volatility',
            required: false
        },
        {
            name: 'atr_multiplier_low_vol',
            label: 'ATR Mult (Low Vol)',
            type: 'number',
            defaultValue: 3.0,
            min: 0.5,
            max: 5.0,
            step: 0.1,
            description: 'Spacing multiplier during low volatility',
            required: false
        },
        {
            name: 'atr_multiplier_medium_vol',
            label: 'ATR Mult (Med Vol)',
            type: 'number',
            defaultValue: 2.5,
            min: 0.5,
            max: 5.0,
            step: 0.1,
            description: 'Spacing multiplier during medium volatility',
            required: false
        },
        {
            name: 'atr_multiplier_high_vol',
            label: 'ATR Mult (High Vol)',
            type: 'number',
            defaultValue: 2.0,
            min: 0.5,
            max: 5.0,
            step: 0.1,
            description: 'Spacing multiplier during high volatility',
            required: false
        },
        {
            name: 'price_deviation',
            label: 'Base Deviation (%)',
            type: 'percentage',
            defaultValue: 1.0,
            min: 0.1,
            description: 'Base deviation required for first safety order.',
            required: true
        },
        {
            name: 'price_step_scale',
            label: 'Deviation Step Scale',
            type: 'number',
            defaultValue: 1.3,
            min: 1.0,
            max: 3.0,
            step: 0.1,
            description: 'Exponential scaling for SO spacing.',
            required: true
        },
        // Exit
        {
            name: 'use_dynamic_tp',
            label: 'Use Dynamic TP',
            type: 'boolean',
            defaultValue: true,
            description: 'Scale TP based on safety orders filled',
            required: false
        },
        {
            name: 'take_profit_base',
            label: 'Base Take Profit (%)',
            type: 'percentage',
            defaultValue: 2.0,
            min: 0.1,
            description: 'Base target profit percentage.',
            required: true
        },
        {
            name: 'tp_scale_per_so',
            label: 'TP Scale per SO (%)',
            type: 'percentage',
            defaultValue: 0.4,
            min: 0.0,
            max: 2.0,
            step: 0.1,
            description: 'Additional target profit per SO filled.',
            required: false
        },
        {
            name: 'max_take_profit',
            label: 'Max Take Profit (%)',
            type: 'percentage',
            defaultValue: 6.0,
            min: 1,
            max: 20,
            description: 'Hard cap for take profit percentage.',
            required: false
        },
        {
            name: 'use_partial_exits',
            label: 'Enable Partial Exits',
            type: 'boolean',
            defaultValue: true,
            description: 'Take profits at fixed intervals (30%/30%/40%)',
            required: false
        },
        {
            name: 'use_trailing_tp',
            label: 'Enable Trailing TP',
            type: 'boolean',
            defaultValue: true,
            description: 'Trail take profit for additional gains',
            required: false
        },
        {
            name: 'trailing_activation_pct',
            label: 'Trailing Activation (%)',
            type: 'percentage',
            defaultValue: 1.0,
            min: 0.1,
            description: 'Profit % required to start trailing.',
            required: false
        },
        {
            name: 'trailing_callback_pct',
            label: 'Trailing Callback (%)',
            type: 'percentage',
            defaultValue: 0.5,
            min: 0.1,
            description: 'Callback percentage from peak for trailing.',
            required: false
        },
        {
            name: 'use_dynamic_sl',
            label: 'Use Dynamic SL',
            type: 'boolean',
            defaultValue: true,
            description: 'Move SL to breakeven or trail favorably',
            required: false
        },
        {
            name: 'stop_loss_base',
            label: 'Base Stop Loss (%)',
            type: 'percentage',
            defaultValue: 4.0,
            min: 1,
            max: 20,
            description: 'Initial stop loss percentage.',
            required: true
        },
        {
            name: 'sl_tighten_in_trend',
            label: 'Tighten SL in Trend',
            type: 'boolean',
            defaultValue: true,
            description: 'Tighten SL during adverse trends',
            required: false
        },
        {
            name: 'sl_trail_after_profit',
            label: 'Trail SL after Profit',
            type: 'boolean',
            defaultValue: true,
            description: 'Trail SL after reaching 50% of TP target',
            required: false
        },
        // Filters
        {
            name: 'use_rsi_filter',
            label: 'Enable RSI Filter',
            type: 'boolean',
            defaultValue: true,
            description: 'Use RSI levels for entry confirmation',
            required: false
        },
        {
            name: 'rsi_period',
            label: 'RSI Period',
            type: 'number',
            defaultValue: 14,
            min: 5,
            max: 50,
            description: 'Period for RSI calculation.',
            required: false
        },
        {
            name: 'use_adaptive_rsi',
            label: 'Use Adaptive RSI',
            type: 'boolean',
            defaultValue: true,
            description: 'Adjust RSI levels based on volatility',
            required: false
        },
        {
            name: 'rsi_oversold_low_vol',
            label: 'RSI OS (Low Vol)',
            type: 'number',
            defaultValue: 30,
            min: 10,
            max: 50,
            description: 'Oversold level for low volatility',
            required: false
        },
        {
            name: 'rsi_overbought_low_vol',
            label: 'RSI OB (Low Vol)',
            type: 'number',
            defaultValue: 70,
            min: 50,
            max: 90,
            description: 'Overbought level for low volatility',
            required: false
        },
        {
            name: 'use_trend_filter',
            label: 'Enable Trend Filter',
            type: 'boolean',
            defaultValue: true,
            description: 'Filter entries based on EMA trend',
            required: false
        },
        {
            name: 'pause_so_in_strong_adverse_trend',
            label: 'Pause SO in Strong Trend',
            type: 'boolean',
            defaultValue: true,
            description: 'Pause safety orders during strong adverse trends',
            required: false
        },
        {
            name: 'require_trend_weakening',
            label: 'Wait for Weakening',
            type: 'boolean',
            defaultValue: true,
            description: 'Wait for trend to weaken before placing SO',
            required: false
        },
        // Risks
        {
            name: 'max_trade_drawdown_pct',
            label: 'Max Trade Drawdown (%)',
            type: 'percentage',
            defaultValue: 6.0,
            min: 1,
            max: 20,
            description: 'Force close trade if drawdown exceeds this.',
            required: true
        },
        {
            name: 'daily_loss_limit_usd',
            label: 'Daily Loss Limit ($)',
            type: 'number',
            defaultValue: 30.0,
            min: 1,
            description: 'Stop trading for the day if loss exceeds this.',
            required: true
        },
        {
            name: 'post_loss_cooldown_minutes',
            label: 'Loss Cooldown (Min)',
            type: 'number',
            defaultValue: 10,
            min: 0,
            description: 'Wait time after a loss before new entry.',
            required: false
        },
        {
            name: 'pause_on_panic',
            label: 'Panic Protection',
            type: 'boolean',
            defaultValue: true,
            description: 'Pause entries during detected panic selling',
            required: false
        },
        // Execution
        {
            name: 'max_slippage_percent',
            label: 'Max Slippage (%)',
            type: 'percentage',
            defaultValue: 0.3,
            min: 0.1,
            max: 2.0,
            step: 0.1,
            description: 'Maximum allowed slippage for market orders.',
            required: true
        },
        {
            name: 'check_liquidity_before_order',
            label: 'Check Liquidity',
            type: 'boolean',
            defaultValue: true,
            description: 'Verify market depth before placing orders',
            required: false
        },
        {
            name: 'min_liquidity_usd',
            label: 'Min Liquidity ($)',
            type: 'number',
            defaultValue: 75000,
            min: 1000,
            description: 'Required liquidity in order book.',
            required: false
        }
    ],
    arbitrage: [

        {
            name: 'first_pair',
            label: 'First Pair',
            type: 'string',
            defaultValue: 'ETH-USDT',
            description: 'First trading pair (e.g. ETH-USDT)',
            required: true
        },
        {
            name: 'second_pair',
            label: 'Second Pair',
            type: 'string',
            defaultValue: 'ETH-BTC',
            description: 'Second trading pair (e.g. ETH-BTC)',
            required: true
        },
        {
            name: 'third_pair',
            label: 'Third Pair',
            type: 'string',
            defaultValue: 'BTC-USDT',
            description: 'Third trading pair (e.g. BTC-USDT)',
            required: true
        },
        {
            name: 'holding_asset',
            label: 'Holding Asset',
            type: 'string',
            defaultValue: 'USDT',
            description: 'Asset to hold inventory in',
            required: true
        },
        {
            name: 'order_amount',
            label: 'Order Amount (Input Asset)',
            type: 'number',
            defaultValue: 10,
            description: 'Amount of the first asset to trade',
            required: true
        },
        {
            name: 'min_profitability',
            label: 'Min Profitability (%)',
            type: 'percentage',
            defaultValue: 0.5,
            description: 'Minimum profit to trigger trade',
            required: true
        },
        // --- Added Production Parameters ---
        {
            name: 'kill_switch_enabled',
            label: 'Enable Kill Switch',
            type: 'boolean',
            defaultValue: true,
            description: 'Stop bot if cumulative loss exceeds threshold',
            required: false
        },
        {
            name: 'kill_switch_rate',
            label: 'Kill Switch Rate (%)',
            type: 'percentage',
            defaultValue: -2.0,
            max: 0,
            description: 'Cumulative loss % to trigger stop (must be negative)',
            required: true
        },
        {
            name: 'max_slippage_percent',
            label: 'Max Slippage (%)',
            type: 'percentage',
            defaultValue: 0.3,
            min: 0.0,
            max: 5.0,
            description: 'Abort trade if price slips more than this %',
            required: true
        },
        {
            name: 'min_order_book_depth_multiplier',
            label: 'Min Depth Multiplier',
            type: 'number',
            defaultValue: 2.0,
            min: 1.0,
            description: 'Required OB depth relative to order size (e.g. 2x)',
            required: true
        },
        {
            name: 'trading_fee_percent',
            label: 'Est. Fee (%)',
            type: 'percentage',
            defaultValue: 0.1,
            description: 'Manual fee override if auto-detect fails',
            required: false
        }
    ],
    twap: [

        {
            name: 'side',
            label: 'Side',
            type: 'select',
            defaultValue: 'buy',
            options: ['buy', 'sell'],
            description: 'Buy or Sell',
            required: true
        },
        {
            name: 'total_amount_quote',
            label: 'Total Amount (Quote)',
            type: 'number',
            defaultValue: 1000,
            description: 'Total volume to trade in quote currency (e.g. USDT). The bot splits this into smaller orders.',
            required: true
        },
        {
            name: 'total_duration',
            label: 'Duration (Sec)',
            type: 'number',
            defaultValue: 3600,
            description: 'Total time for execution',
            required: true
        },
        {
            name: 'order_interval',
            label: 'Interval (Sec)',
            type: 'number',
            defaultValue: 60,
            description: 'Time between orders',
            required: true
        }
    ],
    vwap: [

        {
            name: 'is_buy',
            label: 'Is Buy side?',
            type: 'boolean',
            defaultValue: true,
            description: 'True for Buy, False for Sell',
            required: true
        },
        {
            name: 'total_volume_quote',
            label: 'Total Volume (Quote)',
            type: 'number',
            defaultValue: 1000,
            description: 'Total volume to trade',
            required: true
        },
        {
            name: 'price_spread',
            label: 'Price Spread (%)',
            type: 'percentage',
            defaultValue: 0.1,
            description: 'Max spread for orders',
            required: true
        },
        {
            name: 'volume_perc',
            label: 'Volume Percentage (%)',
            type: 'percentage',
            defaultValue: 0.1,
            description: '% of OB volume to take',
            required: true
        },
        {
            name: 'order_delay_time',
            label: 'Delay (Sec)',
            type: 'number',
            defaultValue: 10,
            description: 'Delay between orders',
            required: true
        }
    ],
    liquidity_mining: [

        {
            name: 'range_width',
            label: 'Range Width (%)',
            type: 'percentage',
            defaultValue: 10,
            description: 'Liquidity range width (+/-)',
            required: true
        },
        {
            name: 'base_amount',
            label: 'Base Amount',
            type: 'number',
            defaultValue: 0.1,
            description: 'Amount of base token',
            required: true
        },
        {
            name: 'quote_amount',
            label: 'Quote Amount',
            type: 'number',
            defaultValue: 10,
            description: 'Amount of quote token',
            required: true
        }
    ],
    stat_arb: [

        {
            name: 'connector_2',
            label: 'Exchange 2',
            type: 'select',
            defaultValue: 'binance_paper_trade',
            options: ['binance_paper_trade', 'kucoin_paper_trade'],
            description: 'Exchange for second leg',
            required: true
        },
        {
            name: 'trading_pair_2',
            label: 'Trading Pair 2',
            type: 'string',
            defaultValue: 'BTC-USDT',
            description: 'Trading pair 2',
            required: true
        },
        {
            name: 'order_amount',
            label: 'Order Value (Quote Currency)',
            type: 'number',
            defaultValue: 20,
            description: 'Value of the order in quote currency (e.g. USDT)',
            required: true
        },
        {
            name: 'z_score_threshold',
            label: 'Z-Score Threshold',
            type: 'number',
            defaultValue: 2.0,
            step: 0.1,
            description: 'Z-Score deviation to trigger trades',
            required: true
        }
    ],
    mean_reversion: [

        {
            name: 'order_amount',
            label: 'Order Amount (Base Asset)',
            type: 'number',
            defaultValue: 0.01,
            description: 'Amount of base asset to trade',
            required: true
        },
        {
            name: 'bb_length',
            label: 'BB Length',
            type: 'number',
            defaultValue: 20,
            description: 'Bollinger Bands length',
            required: true
        },
        {
            name: 'bb_std',
            label: 'BB Std Dev',
            type: 'number',
            defaultValue: 2.0,
            step: 0.1,
            description: 'Bollinger Bands standard deviation',
            required: true
        }
    ],
    momentum: [

        {
            name: 'order_amount',
            label: 'Order Amount (Base Asset)',
            type: 'number',
            defaultValue: 0.01,
            description: 'Amount of base asset to trade',
            required: true
        },
        {
            name: 'fast_period',
            label: 'MACD Fast',
            type: 'number',
            defaultValue: 12,
            description: 'MACD Fast Period',
            required: true
        },
        {
            name: 'slow_period',
            label: 'MACD Slow',
            type: 'number',
            defaultValue: 26,
            description: 'MACD Slow Period',
            required: true
        },
        {
            name: 'signal_period',
            label: 'MACD Signal',
            type: 'number',
            defaultValue: 9,
            description: 'MACD Signal Period',
            required: true
        },
        {
            name: 'rsi_period',
            label: 'RSI Period',
            type: 'number',
            defaultValue: 14,
            description: 'RSI Period for filter',
            required: true
        }
    ],
    rebalance: [

        {
            name: 'assets',
            label: 'Assets (CSV)',
            type: 'string',
            defaultValue: 'BTC,ETH,USDT',
            description: 'Commodity separated assets (e.g. BTC,ETH,USDT)',
            required: true
        },
        {
            name: 'targets',
            label: 'Targets (CSV %)',
            type: 'string',
            defaultValue: '40,40,20',
            description: 'Target percentages (e.g. 40,40,20)',
            required: true
        },
        {
            name: 'threshold',
            label: 'Threshold (%)',
            type: 'percentage',
            defaultValue: 1.0,
            min: 0.1,
            description: 'Rebalance threshold',
            required: true
        }
    ],
    smart_bot: [
        // Trading
        {
            name: 'base_order_usd',
            label: 'Order Size (USD)',
            type: 'number',
            defaultValue: 100,
            min: 10,
            description: 'Base order size in USD',
            required: true
        },
        {
            name: 'position_mode',
            label: 'Position Mode',
            type: 'select',
            defaultValue: 'LONG',
            options: ['LONG', 'SHORT', 'BOTH'],
            description: 'Trading direction: LONG (buy), SHORT (sell), or BOTH',
            required: true
        },
        {
            name: 'leverage',
            label: 'Leverage',
            type: 'number',
            defaultValue: 1,
            min: 1,
            max: 20,
            description: 'Leverage multiplier (use with caution)',
            required: false
        },
        // Indicators
        {
            name: 'rsi_period',
            label: 'RSI Period',
            type: 'number',
            defaultValue: 14,
            min: 5,
            max: 50,
            description: 'RSI calculation period',
            required: true
        },
        {
            name: 'rsi_oversold',
            label: 'RSI Oversold',
            type: 'number',
            defaultValue: 30,
            min: 10,
            max: 40,
            description: 'RSI oversold threshold',
            required: true
        },
        {
            name: 'rsi_overbought',
            label: 'RSI Overbought',
            type: 'number',
            defaultValue: 70,
            min: 60,
            max: 90,
            description: 'RSI overbought threshold',
            required: true
        },
        {
            name: 'min_confidence',
            label: 'Min Confidence (%)',
            type: 'percentage',
            defaultValue: 65,
            min: 50,
            max: 90,
            description: 'Minimum confidence score to enter trade (0-100)',
            required: true
        },
        // Risk Management
        {
            name: 'take_profit_pct',
            label: 'Take Profit (%)',
            type: 'percentage',
            defaultValue: 2.0,
            min: 0.5,
            max: 10,
            step: 0.1,
            description: 'Profit target percentage',
            required: true
        },
        {
            name: 'stop_loss_pct',
            label: 'Stop Loss (%)',
            type: 'percentage',
            defaultValue: 1.0,
            min: 0.3,
            max: 5,
            step: 0.1,
            description: 'Stop loss percentage',
            required: true
        },
        {
            name: 'trailing_stop',
            label: 'Enable Trailing Stop',
            type: 'boolean',
            defaultValue: true,
            description: 'Lock in profits as price moves favorably',
            required: false
        },
        {
            name: 'trailing_activation_pct',
            label: 'Trailing Activation (%)',
            type: 'percentage',
            defaultValue: 1.0,
            min: 0.5,
            max: 5,
            description: 'Profit % required to activate trailing stop',
            required: false
        },
        {
            name: 'trailing_distance_pct',
            label: 'Trailing Distance (%)',
            type: 'percentage',
            defaultValue: 0.5,
            min: 0.2,
            max: 3,
            description: 'Distance to trail from peak price',
            required: false
        },
        {
            name: 'daily_loss_limit_usd',
            label: 'Daily Loss Limit ($)',
            type: 'number',
            defaultValue: 50,
            min: 10,
            description: 'Maximum daily loss before stopping',
            required: true
        },
        {
            name: 'rolling_loss_limit_usd',
            label: 'Rolling Loss Limit ($)',
            type: 'number',
            defaultValue: 30,
            min: 5,
            description: 'Max loss in rolling window (default 1 hour)',
            required: true
        },
        {
            name: 'max_drawdown_pct',
            label: 'Max Drawdown (%)',
            type: 'percentage',
            defaultValue: 10,
            min: 5,
            max: 30,
            description: 'Maximum peak-to-trough drawdown tolerated',
            required: true
        },
        {
            name: 'max_consecutive_losses',
            label: 'Max Consecutive Losses',
            type: 'number',
            defaultValue: 3,
            min: 2,
            max: 10,
            description: 'Circuit breaker after N losses in a row',
            required: true
        },
        // Advanced
        {
            name: 'atr_position_sizing',
            label: 'ATR Position Sizing',
            type: 'boolean',
            defaultValue: true,
            description: 'Scale position size based on volatility',
            required: false
        },
        {
            name: 'adaptive_confidence',
            label: 'Adaptive Confidence',
            type: 'boolean',
            defaultValue: true,
            description: 'Auto-adjust entry threshold based on performance',
            required: false
        },
        {
            name: 'use_multi_timeframe',
            label: 'Multi-Timeframe Analysis',
            type: 'boolean',
            defaultValue: true,
            description: 'Analyze multiple timeframes (tick, 1m, 5m, 1h)',
            required: false
        },
        {
            name: 'avoid_news_hours',
            label: 'Avoid News Hours',
            type: 'boolean',
            defaultValue: true,
            description: 'Skip trading during major news events',
            required: false
        }
    ]
};

export interface StrategyPreset {
    id?: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
    estimated_capital?: number;
    risk_level?: string;
    recommended_for?: string;
}

export const STRATEGY_PRESETS: Record<string, StrategyPreset[]> = {
    pure_market_making: [
        {
            name: 'Steady Market (Conservative)',
            description: 'Wider spreads and slow refresh. Best for steady, low-volatility markets.',
            risk_level: 'Low',
            recommended_for: 'Standard trading, low fee exchanges',
            parameters: {
                bid_spread: 0.5,
                ask_spread: 0.5,
                order_refresh_time: 60,
                price_type: 'mid',
                max_order_age: 600,
                inventory_skew_enabled: true,
                target_base_pct: 0.5,
                stop_loss_enabled: true,
                max_loss_pct: 2.0
            }
        },
        {
            name: 'High Frequency (Active)',
            description: 'Tight spreads and fast refresh for competitive markets. Requires low latency and low fees.',
            risk_level: 'Medium',
            recommended_for: 'Highly liquid pairs (BTC, ETH)',
            parameters: {
                bid_spread: 0.1,
                ask_spread: 0.1,
                order_refresh_time: 15,
                price_type: 'mid',
                max_order_age: 180,
                inventory_skew_enabled: true,
                target_base_pct: 0.5,
                stop_loss_enabled: true,
                max_loss_pct: 5.0
            }
        },
        {
            name: 'Inventory Balancer',
            description: 'Focuses on maintaining a specific asset ratio while capturing small spreads.',
            risk_level: 'Medium',
            recommended_for: 'Portfolio rebalancing with yield',
            parameters: {
                bid_spread: 0.2,
                ask_spread: 0.2,
                order_refresh_time: 30,
                price_type: 'last',
                max_order_age: 300,
                inventory_skew_enabled: true,
                target_base_pct: 0.5,
                stop_loss_enabled: true,
                max_loss_pct: 3.0
            }
        }
    ],
    dca_strategy: [
        {
            name: 'Conservative (First Deployment)',
            description: 'Safe accumulation with moderate spreads and tight risk controls. Best for First 2 Weeks.',
            risk_level: 'Low',
            recommended_for: 'Learning, stable markets, protected capital',
            parameters: {
                account_risk_percentage: 1.0,
                max_safety_orders: 3,
                safety_order_volume_scale: 1.2,
                max_total_exposure_multiplier: 2.5,
                use_atr_spacing: true,
                atr_multiplier_low_vol: 3.0,
                atr_multiplier_medium_vol: 2.5,
                atr_multiplier_high_vol: 2.0,
                fallback_deviation_pct: 4.0,
                price_step_scale: 1.3,
                take_profit_base: 2.0,
                tp_scale_per_so: 0.4,
                max_take_profit: 6.0,
                use_partial_exits: true,
                use_trailing_tp: true,
                trailing_activation_pct: 1.0,
                stop_loss_base: 4.0,
                max_trade_drawdown_pct: 6.0,
                daily_loss_limit_usd: 30.0,
                rolling_loss_limit_usd: 20.0,
                min_confidence_pct: 70
            }
        },
        {
            name: 'Moderate (Standard Production)',
            description: 'Balanced config for steady gains once confidence is established. Best for ETH/BTC.',
            risk_level: 'Medium',
            recommended_for: 'Standard production use after 2 weeks successful testing',
            parameters: {
                account_risk_percentage: 2.0,
                max_safety_orders: 4,
                safety_order_volume_scale: 1.2,
                max_total_exposure_multiplier: 3.0,
                use_atr_spacing: true,
                atr_multiplier_low_vol: 2.5,
                atr_multiplier_medium_vol: 2.0,
                atr_multiplier_high_vol: 1.5,
                fallback_deviation_pct: 3.0,
                price_step_scale: 1.3,
                take_profit_base: 2.0,
                tp_scale_per_so: 0.5,
                max_take_profit: 8.0,
                use_partial_exits: true,
                use_trailing_tp: true,
                trailing_activation_pct: 1.5,
                stop_loss_base: 5.0,
                max_trade_drawdown_pct: 8.0,
                daily_loss_limit_usd: 50.0,
                rolling_loss_limit_usd: 30.0,
                min_confidence_pct: 65
            }
        },
        {
            name: 'Aggressive (High Return)',
            description: 'Tight spacing and loose filters to maximize trade frequency and profit targets.',
            risk_level: 'High',
            recommended_for: 'Experienced traders in volatile markets',
            parameters: {
                account_risk_percentage: 3.0,
                max_safety_orders: 5,
                safety_order_volume_scale: 1.2,
                max_total_exposure_multiplier: 4.0,
                use_atr_spacing: true,
                atr_multiplier_low_vol: 2.0,
                atr_multiplier_medium_vol: 1.5,
                atr_multiplier_high_vol: 1.2,
                fallback_deviation_pct: 2.5,
                price_step_scale: 1.3,
                take_profit_base: 2.5,
                tp_scale_per_so: 0.6,
                max_take_profit: 10.0,
                use_partial_exits: false,
                use_trailing_tp: true,
                trailing_activation_pct: 2.0,
                stop_loss_base: 6.0,
                max_trade_drawdown_pct: 10.0,
                daily_loss_limit_usd: 75.0,
                rolling_loss_limit_usd: 50.0,
                min_confidence_pct: 60
            }
        }
    ],
    arbitrage: [
        {
            name: 'Ultra-Conservative',
            description: 'Maximum safety with strict slippage and loss limits. Best for learning.',
            risk_level: 'Very Low',
            recommended_for: 'Beginners, high-fee exchanges',
            parameters: {
                min_profitability: 1.5,
                kill_switch_enabled: true,
                kill_switch_rate: -0.5,
                max_slippage_percent: 0.2,
                min_order_book_depth_multiplier: 3.0
            }
        },
        {
            name: 'Conservative',
            description: 'Balanced safety profile suitable for standard operation.',
            risk_level: 'Low',
            recommended_for: 'Standard production use',
            parameters: {
                min_profitability: 0.8,
                kill_switch_enabled: true,
                kill_switch_rate: -1.0,
                max_slippage_percent: 0.3,
                min_order_book_depth_multiplier: 2.0
            }
        },
        {
            name: 'Moderate',
            description: 'Standard risk profile accepting moderate drawdowns for better fill rates.',
            risk_level: 'Medium',
            recommended_for: 'Experienced traders',
            parameters: {
                min_profitability: 0.5,
                kill_switch_enabled: true,
                kill_switch_rate: -2.0,
                max_slippage_percent: 0.3,
                min_order_book_depth_multiplier: 2.0
            }
        },
        {
            name: 'Aggressive',
            description: 'Wide limits to capture more opportunities. Higher risk of bad fills.',
            risk_level: 'High',
            recommended_for: 'High volume, competitive pairs',
            parameters: {
                min_profitability: 0.3,
                kill_switch_enabled: true,
                kill_switch_rate: -5.0,
                max_slippage_percent: 0.5,
                min_order_book_depth_multiplier: 1.5
            }
        }
    ],
    smart_bot: [
        {
            name: 'Conservative (Low Risk)',
            description: 'Safe institutional-grade settings with ATR sizing, tight stops, and maximum safety',
            estimated_capital: 200,
            risk_level: 'Low',
            recommended_for: 'New traders, stable markets, learning',
            parameters: {
                base_order_usd: 50,
                position_mode: 'LONG',
                leverage: 1,
                rsi_period: 14,
                rsi_oversold: 30,
                rsi_overbought: 70,
                min_confidence: 75,
                take_profit_pct: 1.5,
                stop_loss_pct: 0.8,
                trailing_stop: true,
                trailing_activation_pct: 1.0,
                trailing_distance_pct: 0.5,
                daily_loss_limit_usd: 20,
                rolling_loss_limit_usd: 15,
                max_drawdown_pct: 5,
                max_consecutive_losses: 2,
                atr_position_sizing: true,
                adaptive_confidence: true,
                use_multi_timeframe: true,
                avoid_news_hours: true
            }
        },
        {
            name: 'Balanced (Medium Risk)',
            description: 'Production-grade balanced approach with all v4.0 features enabled. Best for general trading.',
            estimated_capital: 500,
            risk_level: 'Medium',
            recommended_for: 'Most traders, standard production use',
            parameters: {
                base_order_usd: 100,
                position_mode: 'BOTH',
                leverage: 1,
                rsi_period: 14,
                rsi_oversold: 30,
                rsi_overbought: 70,
                min_confidence: 65,
                take_profit_pct: 2.0,
                stop_loss_pct: 1.0,
                trailing_stop: true,
                trailing_activation_pct: 1.0,
                trailing_distance_pct: 0.5,
                daily_loss_limit_usd: 50,
                rolling_loss_limit_usd: 30,
                max_drawdown_pct: 10,
                max_consecutive_losses: 3,
                atr_position_sizing: true,
                adaptive_confidence: true,
                use_multi_timeframe: true,
                avoid_news_hours: true
            }
        },
        {
            name: 'Aggressive (High Risk)',
            description: 'High-frequency trading with looser thresholds. For experienced traders in volatile markets only.',
            estimated_capital: 1000,
            risk_level: 'High',
            recommended_for: 'Experienced traders, volatile markets, active monitoring',
            parameters: {
                base_order_usd: 200,
                position_mode: 'BOTH',
                leverage: 2,
                rsi_period: 14,
                rsi_oversold: 30,
                rsi_overbought: 70,
                min_confidence: 55,
                take_profit_pct: 3.0,
                stop_loss_pct: 1.5,
                trailing_stop: true,
                trailing_activation_pct: 1.5,
                trailing_distance_pct: 0.7,
                daily_loss_limit_usd: 100,
                rolling_loss_limit_usd: 60,
                max_drawdown_pct: 15,
                max_consecutive_losses: 5,
                atr_position_sizing: false,
                adaptive_confidence: true,
                use_multi_timeframe: true,
                avoid_news_hours: false
            }
        }
    ]
};

