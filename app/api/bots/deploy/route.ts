/**
 * Bot Deploy API Route
 * =====================
 * POST /api/bots/deploy - Deploy a new trading bot to Hummingbot API
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = (request: Request) => {
    // ALWAYS use Basic Auth for upstream calls to the Bot/Hummingbot API
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[Deploy] Received Body:', JSON.stringify(body, null, 2)); // Debug log
        const { name, exchange, pair, strategy, isPaperTrade } = body;
        const parameters = body.parameters || {}; // Safety check to prevent crash

        // Map strategy ID to script name
        const strategyScriptMap: Record<string, string> = {
            'pmm': 'simple_pmm.py',
            'xemm': 'simple_xemm.py',
            'dman': 'v2_directional_rsi.py',
            'dca': 'v2_with_controllers.py',
            'avellaneda': 'simple_pmm.py',
            'arbitrage': 'triangular_arbitrage.py',
            'liquidity_mining': 'amm_trade_example.py',
            'stat_arb': 'v2_with_controllers.py',
            'mean_reversion': 'simple_pmm.py',
            'momentum': 'v2_directional_rsi.py',
            'twap': 'simple_vwap.py',
            'vwap': 'simple_vwap.py',
            'rebalance': '1overN_portfolio.py',
            'smart_bot': 'v2_with_controllers.py',
        };

        // Validate strategy is supported
        if (!strategyScriptMap[strategy]) {
            return NextResponse.json(
                { error: `Strategy '${strategy}' is not supported.` },
                { status: 400 }
            );
        }

        const scriptName = strategyScriptMap[strategy];
        console.log(`[Deploy] Bot: ${name}, Strategy: ${strategy}, Exchange: ${exchange}, Paper: ${isPaperTrade}`);

        // ========================================
        // VALIDATION & CONFIG CONSTRUCTION
        // ========================================
        const errors: string[] = [];
        let configData: any = {};

        // Base validation
        if (!name?.trim()) errors.push('Bot name is required');

        // Helper to format exchange name (append paper_trade if needed)
        // Note: The UI might already send the full name, but we ensure consistency
        const formatExchange = (ex: string) => {
            if (!ex) return '';
            if (isPaperTrade && !ex.endsWith('_paper_trade') && !ex.includes('mock')) {
                return `${ex}_paper_trade`;
            }
            return ex;
        };

        // Helper to get stop loss
        const getStopLoss = () => {
            if (body.riskSettings?.killSwitchEnabled && body.riskSettings?.killSwitch?.threshold) {
                return parseFloat(body.riskSettings.killSwitch.threshold) / 100;
            }
            return undefined;
        };

        // Common Risk Config (Assuming backend scripts support it via a mixin or similar)
        // For now, we are just validating it's passed.
        // In a real implementation, we'd inject these into the strategy config or a global risk config.
        const riskConfig = {
            max_global_exposure: body.riskSettings?.maxGlobalExposureEnabled ? parseFloat(body.riskSettings?.maxGlobalExposureValue) : undefined,
            // ... other risk settings
        };
        // Strategy Specific Config Construction
        switch (strategy) {
            case 'pmm':
                if (!pair) errors.push('Trading pair is required');
                if (!parameters.bid_spread && !parameters.bidSpread) errors.push('Bid spread is required');
                if (!parameters.ask_spread && !parameters.askSpread) errors.push('Ask spread is required');
                if (!parameters.order_amount && !parameters.orderAmount) errors.push('Order amount is required');

                configData = {
                    script_file_name: scriptName,
                    exchange: exchange,
                    trading_pair: pair,
                    order_amount: parseFloat(parameters.order_amount ?? parameters.orderAmount),
                    bid_spread: parseFloat(parameters.bid_spread ?? parameters.bidSpread) / 100,
                    ask_spread: parseFloat(parameters.ask_spread ?? parameters.askSpread) / 100,
                    order_refresh_time: parseInt(parameters.order_refresh_time ?? parameters.refreshTime) || 15,
                    price_type: parameters.price_type || "mid",
                    max_order_age: parseInt(parameters.max_order_age || '300'),
                    inventory_skew_enabled: parameters.inventory_skew_enabled !== false,
                    target_base_pct: parseFloat(parameters.target_base_pct || '0.5'),
                    stop_loss_enabled: parameters.stop_loss_enabled !== false,
                    max_loss_pct: parseFloat(parameters.max_loss_pct || '5.0') / 100,
                    inventory_range_multiplier: 1.5,
                    min_spread: 0.0001
                };
                break;

            case 'xemm':
                // XEMM requires maker and taker config
                // We assume Step 2 "exchange" is Maker, and Taker comes from parameters (or defaults)
                // Actually, for XEMM, we should stick to the explicit parameters if provided
                const makerEx = parameters.maker_exchange || exchange;
                const makerPair = parameters.maker_pair || pair;
                const takerEx = parameters.taker_exchange;
                const takerPair = parameters.taker_pair || pair; // Usually same pair

                if (!makerEx) errors.push('Maker exchange is required');
                if (!takerEx) errors.push('Taker exchange is required');

                configData = {
                    script_file_name: scriptName,
                    maker_exchange: formatExchange(makerEx),
                    maker_pair: makerPair,
                    taker_exchange: formatExchange(takerEx),
                    taker_pair: takerPair,
                    order_amount: parseFloat(parameters.order_amount || parameters.orderAmount),
                    spread_bps: parseFloat(parameters.min_profitability || '0.5') * 100, // Convert % to bps
                    min_spread_bps: 10,
                    slippage_buffer_spread_bps: 100, // 1%
                    max_order_age: 120
                };
                break;

            case 'dca':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(exchange),
                    trading_pair: pair,
                    side: parameters.side || "buy",

                    // Sizing
                    use_account_percentage: parameters.use_account_percentage !== false,
                    account_risk_percentage: parseFloat(parameters.account_risk_percentage || '1.0'),
                    base_order_amount: parseFloat(parameters.base_order_amount || '100'),
                    safety_order_amount: parseFloat(parameters.safety_order_amount || '100'),
                    max_safety_orders: parseInt(parameters.max_safety_orders || '3'),
                    safety_order_volume_scale: parseFloat(parameters.safety_order_volume_scale || '1.2'),
                    max_total_exposure_multiplier: parseFloat(parameters.max_total_exposure_multiplier || '2.5'),

                    // Spacing
                    use_atr_spacing: parameters.use_atr_spacing !== false,
                    atr_multiplier_low_vol: parseFloat(parameters.atr_multiplier_low_vol || '3.0'),
                    atr_multiplier_medium_vol: parseFloat(parameters.atr_multiplier_medium_vol || '2.5'),
                    atr_multiplier_high_vol: parseFloat(parameters.atr_multiplier_high_vol || '2.0'),
                    price_deviation: parseFloat(parameters.price_deviation || '1.0'),
                    price_step_scale: parseFloat(parameters.price_step_scale || '1.3'),
                    fallback_deviation_pct: parseFloat(parameters.fallback_deviation_pct || '3.0'),

                    // Exit
                    use_dynamic_tp: parameters.use_dynamic_tp !== false,
                    take_profit_base: parseFloat(parameters.take_profit_base || '2.0'),
                    tp_scale_per_so: parseFloat(parameters.tp_scale_per_so || '0.4'),
                    max_take_profit: parseFloat(parameters.max_take_profit || '6.0'),
                    use_partial_exits: parameters.use_partial_exits !== false,
                    use_trailing_tp: parameters.use_trailing_tp !== false,
                    trailing_activation_pct: parseFloat(parameters.trailing_activation_pct || '1.0'),
                    trailing_callback_pct: parseFloat(parameters.trailing_callback_pct || '0.5'),

                    // Stop Loss
                    use_dynamic_sl: parameters.use_dynamic_sl !== false,
                    stop_loss_base: parseFloat(parameters.stop_loss_base || '4.0'),
                    sl_tighten_in_trend: parameters.sl_tighten_in_trend !== false,
                    sl_trail_after_profit: parameters.sl_trail_after_profit !== false,

                    // Filters
                    use_rsi_filter: parameters.use_rsi_filter !== false,
                    rsi_period: parseInt(parameters.rsi_period || '14'),
                    use_adaptive_rsi: parameters.use_adaptive_rsi !== false,
                    rsi_oversold_low_vol: parseFloat(parameters.rsi_oversold_low_vol || '30'),
                    rsi_overbought_low_vol: parseFloat(parameters.rsi_overbought_low_vol || '70'),
                    use_trend_filter: parameters.use_trend_filter !== false,
                    pause_so_in_strong_adverse_trend: parameters.pause_so_in_strong_adverse_trend !== false,
                    require_trend_weakening: parameters.require_trend_weakening !== false,

                    // Risks & Safety
                    max_trade_drawdown_pct: parseFloat(parameters.max_trade_drawdown_pct || '6.0'),
                    daily_loss_limit_usd: parseFloat(parameters.daily_loss_limit_usd || '30.0'),
                    post_loss_cooldown_minutes: parseFloat(parameters.post_loss_cooldown_minutes || '10'),
                    pause_on_panic: parameters.pause_on_panic !== false,
                    max_slippage_percent: parseFloat(parameters.max_slippage_percent || '0.3'),
                    check_liquidity_before_order: parameters.check_liquidity_before_order !== false,
                    min_liquidity_usd: parseFloat(parameters.min_liquidity_usd || '75000'),

                    // Units & Other
                    base_order_unit: parameters.base_order_unit || 'usdt',
                    safety_order_unit: parameters.safety_order_unit || 'usdt',
                    entry_order_type: parameters.entry_order_type || 'market',
                    heartbeat_interval_seconds: parseFloat(parameters.heartbeat_interval_seconds || '180.0'),
                };
                break;

            case 'dman': // Directional RSI
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(parameters.exchange || exchange),
                    trading_pair: parameters.trading_pair || pair,
                    candles_exchange: formatExchange(parameters.candles_exchange || exchange),
                    candles_pair: parameters.candles_pair || pair,
                    candles_interval: parameters.candles_interval || "1m",
                    rsi_low: parseFloat(parameters.rsi_low || '30'),
                    rsi_high: parseFloat(parameters.rsi_high || '70'),
                    order_amount_quote: parseFloat(parameters.order_amount || parameters.orderAmount),
                    leverage: parseInt(parameters.leverage || '1'),
                    position_mode: "ONEWAY",
                    stop_loss: getStopLoss() || 0.03, // Default 3% if not set
                    take_profit: parseFloat(parameters.take_profit || '0.01'), // Fixed: Use user param
                };
                break;

            case 'avellaneda':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(exchange),
                    trading_pair: pair,
                    order_amount: parseFloat(parameters.order_amount || parameters.orderAmount),
                    min_spread: parseFloat(parameters.min_spread || '0.5') / 100,
                    max_spread: parseFloat(parameters.max_spread || '5.0') / 100,
                    vol_to_spread_multiplier: parseFloat(parameters.vol_to_spread_multiplier || '1.0'),
                    inventory_risk_aversion: parseFloat(parameters.inventory_risk_aversion || '0.5'),
                };
                break;

            case 'arbitrage':
                configData = {
                    strategy: 'script',
                    script_file_name: scriptName,
                    connector_name: formatExchange(parameters.connector_name) || formatExchange(exchange),
                    first_pair: parameters.first_pair,
                    secondary_market: formatExchange(parameters.connector_name), // Explicitly ignore or map if needed, but triangular uses single connector
                    second_pair: parameters.second_pair,
                    third_pair: parameters.third_pair,
                    holding_asset: parameters.holding_asset || 'USDT',
                    min_profitability: parseFloat(parameters.min_profitability || '0.5'),
                    order_amount: parseFloat(parameters.order_amount),
                };
                break;

            case 'twap':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(parameters.connector_name),
                    trading_pair: parameters.trading_pair,
                    total_amount_quote: parseFloat(parameters.total_amount_quote),
                    total_duration: parseInt(parameters.total_duration),
                    order_interval: parseInt(parameters.order_interval),
                    is_buy: parameters.side === 'buy'
                };
                break;

            case 'vwap':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(parameters.connector_name),
                    trading_pair: parameters.trading_pair,
                    total_volume_quote: parseFloat(parameters.total_volume_quote),
                    price_spread: parseFloat(parameters.price_spread) / 100,
                    volume_perc: parseFloat(parameters.volume_perc) / 100,
                    order_delay_time: parseInt(parameters.order_delay_time),
                    is_buy: parameters.is_buy === 'true' || parameters.is_buy === true
                };
                break;

            case 'liquidity_mining':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(parameters.connector),
                    trading_pair: parameters.trading_pair,
                    range_width: parseFloat(parameters.range_width) / 100,
                    base_amount: parseFloat(parameters.base_amount),
                    quote_amount: parseFloat(parameters.quote_amount),
                };
                break;

            case 'stat_arb':
                configData = {
                    script_file_name: scriptName,
                    connector_1: formatExchange(parameters.connector_1),
                    trading_pair_1: parameters.trading_pair_1,
                    connector_2: formatExchange(parameters.connector_2),
                    trading_pair_2: parameters.trading_pair_2,
                    order_amount: parseFloat(parameters.order_amount || '100'),
                    z_score_threshold: parseFloat(parameters.z_score_threshold || '2.0'),
                };
                break;

            case 'mean_reversion':
                configData = {
                    script_file_name: scriptName,
                    connector: formatExchange(parameters.connector),
                    trading_pair: parameters.trading_pair || pair,
                    order_amount: parseFloat(parameters.order_amount || '100'),
                    bb_length: parseInt(parameters.bb_length || '20'),
                    bb_std: parseFloat(parameters.bb_std || '2.0'),
                };
                break;

            case 'momentum':
                configData = {
                    script_file_name: scriptName,
                    connector: formatExchange(parameters.connector),
                    trading_pair: parameters.trading_pair || pair,
                    order_amount: parseFloat(parameters.order_amount || '100'),
                    fast_period: parseInt(parameters.fast_period || '12'),
                    slow_period: parseInt(parameters.slow_period || '26'),
                    signal_period: parseInt(parameters.signal_period || '9'),
                    rsi_period: parseInt(parameters.rsi_period || '14'),
                };
                break;

            case 'rebalance':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(parameters.exchange || exchange),
                    assets: parameters.assets,
                    targets: parameters.targets,
                    threshold: parseFloat(parameters.threshold || '1.0'),
                };
                break;

            case 'smart_bot':
                configData = {
                    script_file_name: scriptName,
                    exchange: formatExchange(exchange),
                    trading_pair: pair,

                    // Trading
                    base_order_usd: parseFloat(parameters.base_order_usd || parameters.order_amount || '100'),
                    leverage: parseInt(parameters.leverage || '1'),
                    position_mode: parameters.position_mode || 'LONG',
                    atr_position_sizing: parameters.atr_position_sizing !== undefined ? parameters.atr_position_sizing : true,
                    atr_multiplier: parseFloat(parameters.atr_multiplier || '1.5'),

                    // Indicators
                    rsi_period: parseInt(parameters.rsi_period || '14'),
                    rsi_oversold: parseFloat(parameters.rsi_oversold || '30'),
                    rsi_overbought: parseFloat(parameters.rsi_overbought || '70'),
                    min_confidence: parseFloat(parameters.min_confidence || '65.0'),
                    adaptive_confidence: parameters.adaptive_confidence !== undefined ? parameters.adaptive_confidence : true,
                    adaptive_speed: parseInt(parameters.adaptive_speed || '3'),

                    // Risk Management
                    take_profit_pct: parseFloat(parameters.take_profit_pct || parameters.take_profit || '2.0'),
                    stop_loss_pct: parseFloat(parameters.stop_loss_pct || parameters.stop_loss || '1.0'),
                    trailing_stop: parameters.trailing_stop !== undefined ? parameters.trailing_stop : true,
                    trailing_activation_pct: parseFloat(parameters.trailing_activation_pct || '1.0'),
                    trailing_distance_pct: parseFloat(parameters.trailing_distance_pct || '0.5'),

                    daily_loss_limit_usd: parseFloat(parameters.daily_loss_limit_usd || '50'),
                    rolling_loss_limit_usd: parseFloat(parameters.rolling_loss_limit_usd || '30'),
                    rolling_window_minutes: parseInt(parameters.rolling_window_minutes || '60'),
                    max_drawdown_pct: parseFloat(parameters.max_drawdown_pct || '10'),
                    post_sl_cooldown_minutes: parseInt(parameters.post_sl_cooldown_minutes || '5'),
                    max_consecutive_losses: parseInt(parameters.max_consecutive_losses || '3'),

                    // Safety
                    max_slippage_pct: parseFloat(parameters.max_slippage_pct || parameters.max_slippage_percent || '0.5'),
                    min_depth_multiplier: parseFloat(parameters.min_depth_multiplier || parameters.min_order_book_depth_multiplier || '3.0'),
                    max_execution_seconds: parseFloat(parameters.max_execution_seconds || '5.0'),
                    order_timeout_seconds: parseInt(parameters.order_timeout_seconds || '30'),
                    fee_refresh_interval: parseFloat(parameters.fee_refresh_interval || '300'),

                    // Circuit Breaker
                    min_success_rate_pct: parseFloat(parameters.min_success_rate_pct || '40'),
                    success_rate_window: parseInt(parameters.success_rate_window || '10'),

                    // Advanced Features
                    use_multi_timeframe: parameters.use_multi_timeframe !== undefined ? parameters.use_multi_timeframe : true,
                    max_api_calls_per_minute: parseInt(parameters.max_api_calls_per_minute || '100'),
                    avoid_news_hours: parameters.avoid_news_hours !== undefined ? parameters.avoid_news_hours : true,
                    news_blackout_hours: parameters.news_blackout_hours || [14, 15],
                };
                break;
        }

        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }

        // ========================================
        // DEPLOY TO HUMMINGBOT API
        // ========================================
        const axiosConfig = {
            headers: getAuthHeaders(request)
        };

        try {
            // 1. Save Config
            await axios.post(`${API_URL}/scripts/configs/${name}`, configData, axiosConfig);

            // 2. Deploy
            const deployData = {
                instance_name: name,
                credentials_profile: "master_account",
                image: "hummingbot/hummingbot:latest",
                script: scriptName,
                script_config: `${name}.yml`
            };

            const deployResponse = await axios.post(`${API_URL}/bot-orchestration/deploy-v2-script`, deployData, axiosConfig);

            return NextResponse.json({
                success: true,
                data: deployResponse.data,
                message: 'Bot deployed successfully'
            });

        } catch (error: any) {
            console.error('[Deploy] Backend Error Details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            console.error('[Deploy] Backend Error:', error.response?.data || error.message);
            return NextResponse.json(
                { error: 'Failed to deploy bot', details: error.response?.data?.detail || error.message },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('[Deploy] Unexpected error:', error);
        console.error('[Deploy] Stack:', error.stack);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
