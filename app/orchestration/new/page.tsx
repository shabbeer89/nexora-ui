"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Rocket, Settings, LayoutGrid, Wallet, Loader2, AlertCircle, CheckCircle, ToggleLeft, ToggleRight, Beaker, Zap, Shield, Search, ArrowRightLeft, Info, XCircle, TrendingUp, Calculator, Wand2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { backendApi } from "@/lib/backend-api";
import { RiskSettingsForm, DEFAULT_RISK_SETTINGS, RiskSettings } from "@/components/bot/RiskSettings";
import { STRATEGY_TEMPLATES, STRATEGY_PRESETS, StrategyPreset, StrategyType } from "@/types/strategy";
import { ParameterInput } from "@/components/strategy/StrategyBuilder";

// ===========================================
// CONFIGURATION DATA
// ===========================================

interface CalculatedConfig {
    base_order_amount: number;
    safety_order_amount: number;
    max_safety_orders: number;
    price_deviation: number;
    price_step_scale: number;
    safety_order_volume_scale: number;
    take_profit_base: number;
    stop_loss_base: number;
}

const calculateRecommendedConfig = (inputs: {
    totalInvestment: number;
    takeProfitPercent: number;
    stopLossPercent: number;
    tradingPair: string;
}): CalculatedConfig => {
    const { totalInvestment, takeProfitPercent, stopLossPercent, tradingPair } = inputs;

    // Step 1: Determine asset volatility profile
    const pair = tradingPair.toUpperCase();
    let volatility: "low" | "medium" | "high" = "high";
    if (pair.includes("BTC") && (pair.includes("USDT") || pair.includes("USDC"))) volatility = "low";
    else if (pair.includes("ETH") || pair.includes("BNB") || pair.includes("SOL")) volatility = "medium";

    // Step 2: Calculate base configuration
    let config: CalculatedConfig;

    if (totalInvestment < 300) {
        config = {
            base_order_amount: totalInvestment * 0.25,
            safety_order_amount: totalInvestment * 0.25,
            max_safety_orders: 3,
            price_deviation: volatility === "high" ? 2.5 : volatility === "medium" ? 2.0 : 1.5,
            price_step_scale: 1.2,
            safety_order_volume_scale: 1.1,
            take_profit_base: takeProfitPercent,
            stop_loss_base: stopLossPercent
        };
    } else if (totalInvestment < 1000) {
        config = {
            base_order_amount: totalInvestment * 0.20,
            safety_order_amount: (totalInvestment * 0.80) / 4,
            max_safety_orders: 4,
            price_deviation: volatility === "high" ? 2.0 : volatility === "medium" ? 1.5 : 1.0,
            price_step_scale: 1.3,
            safety_order_volume_scale: 1.2,
            take_profit_base: takeProfitPercent,
            stop_loss_base: stopLossPercent
        };
    } else if (totalInvestment < 5000) {
        config = {
            base_order_amount: totalInvestment * 0.15,
            safety_order_amount: (totalInvestment * 0.85) / 5,
            max_safety_orders: 5,
            price_deviation: volatility === "high" ? 1.5 : volatility === "medium" ? 1.2 : 1.0,
            price_step_scale: 1.4,
            safety_order_volume_scale: 1.25,
            take_profit_base: takeProfitPercent,
            stop_loss_base: stopLossPercent
        };
    } else {
        config = {
            base_order_amount: totalInvestment * 0.12,
            safety_order_amount: (totalInvestment * 0.88) / 7,
            max_safety_orders: 7,
            price_deviation: volatility === "high" ? 1.2 : volatility === "medium" ? 1.0 : 0.8,
            price_step_scale: 1.5,
            safety_order_volume_scale: 1.3,
            take_profit_base: takeProfitPercent,
            stop_loss_base: stopLossPercent
        };
    }

    // Step 3: Round values
    config.base_order_amount = Math.floor(config.base_order_amount);
    config.safety_order_amount = Math.floor(config.safety_order_amount);
    config.price_deviation = Math.round(config.price_deviation * 10) / 10;
    config.price_step_scale = Math.round(config.price_step_scale * 10) / 10;
    config.safety_order_volume_scale = Math.round(config.safety_order_volume_scale * 10) / 10;

    // Step 4: Adjust for stop loss distance
    // Ensure safety orders can reach max drawdown before SL
    const calculateMaxSODistance = (deviation: number, maxSO: number, stepScale: number) => {
        let totalDistance = deviation;
        let currentStep = deviation;
        for (let i = 1; i < maxSO; i++) {
            currentStep *= stepScale;
            totalDistance += currentStep;
        }
        return totalDistance;
    };

    let maxDistance = calculateMaxSODistance(
        config.price_deviation,
        config.max_safety_orders,
        config.price_step_scale
    );

    // If distance is too close to SL, reduce max SOs
    while (maxDistance > stopLossPercent * 0.9 && config.max_safety_orders > 1) {
        config.max_safety_orders--;
        maxDistance = calculateMaxSODistance(
            config.price_deviation,
            config.max_safety_orders,
            config.price_step_scale
        );
    }

    return config;
};

// Map short IDs (backend) to long IDs (templates)
const STRATEGY_ID_MAP: Record<string, StrategyType> = {
    'pmm': 'pure_market_making',
    'xemm': 'cross_exchange_market_making',
    'avellaneda': 'avellaneda_market_making',
    'dman': 'directional_strategy',
    'dca': 'dca_strategy',
};

const getTemplateId = (id: string): StrategyType => {
    return STRATEGY_ID_MAP[id] || (id as StrategyType);
};

const strategies = [
    // Group 1: Steady Gains (Conservative)
    {
        id: 'dca',
        name: 'Dollar Cost Averaging',
        description: 'Accumulate positions over time to smooth out volatility.',
        group: 'Steady Gains',
        rating: 5,
        winRate: '90% (Long Term)',
        riskLevel: 'Low',
        minAmount: '$100',
        knowledge: 'Beginner',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' }
    },
    {
        id: 'arbitrage',
        name: 'Triangular Arbitrage',
        description: 'Exploit price differences between 3 pairs on one exchange.',
        group: 'Arbitrage',
        rating: 4,
        winRate: '95% (Opportunity Based)',
        riskLevel: 'Very Low',
        minAmount: '$500',
        knowledge: 'Advanced',
        requirements: { exchanges: 1, connectorType: 'cex', pairs: 3, primaryParam: 'connector_name' }
    },
    {
        id: 'xemm',
        name: 'Cross Exchange Mining (Spatial)',
        description: 'Arbitrage between two exchanges (Maker-Taker).',
        group: 'Arbitrage',
        rating: 4,
        winRate: 'High',
        riskLevel: 'Low',
        minAmount: '$500',
        knowledge: 'Intermediate',
        requirements: { exchanges: 2, connectorType: 'any', pairs: 1, primaryParam: 'maker_exchange' }
    },
    {
        id: 'liquidity_mining',
        name: 'Liquidity Mining',
        description: 'Provide liquidity to AMM/CLMM pools for yield.',
        group: 'Steady Gains',
        rating: 4,
        winRate: 'Consistent Yield',
        riskLevel: 'Medium',
        minAmount: '$200',
        knowledge: 'Intermediate',
        requirements: { exchanges: 1, connectorType: 'dex', pairs: 1, primaryParam: 'connector' }
    },
    {
        id: 'rebalance',
        name: 'Portfolio Rebalancing',
        description: 'Auto-rebalance portfolio to target percentages.',
        group: 'Steady Gains',
        rating: 5,
        winRate: 'N/A (Balancing)',
        riskLevel: 'Low',
        minAmount: '$100',
        knowledge: 'Beginner',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 0, assets: true, primaryParam: 'exchange' }
    },
    {
        id: 'twap',
        name: 'TWAP Execution',
        description: 'Execute large orders over time to minimize impact.',
        group: 'Steady Gains',
        rating: 3,
        winRate: 'N/A (Execution)',
        riskLevel: 'Low',
        minAmount: '$1000',
        knowledge: 'Intermediate',
        requirements: { exchanges: 1, connectorType: 'cex', pairs: 1, primaryParam: 'connector_name' }
    },
    {
        id: 'vwap',
        name: 'VWAP Execution',
        description: 'Execute orders based on volume profile.',
        group: 'Steady Gains',
        rating: 3,
        winRate: 'N/A (Execution)',
        riskLevel: 'Low',
        minAmount: '$1000',
        knowledge: 'Intermediate',
        requirements: { exchanges: 1, connectorType: 'cex', pairs: 1, primaryParam: 'connector_name' }
    },

    // Group 2: Market Neutral (Volatility)
    {
        id: 'pmm',
        name: 'Production Market Making',
        description: 'Advanced market making with inventory skew, stop loss, and order age management.',
        group: 'Market Neutral',
        rating: 5,
        winRate: '75% (Low Volatility)',
        riskLevel: 'Low-Medium',
        minAmount: '$500',
        knowledge: 'Intermediate',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' }
    },
    {
        id: 'avellaneda',
        name: 'Avellaneda Market Making',
        description: 'Advanced market making with inventory risk management.',
        group: 'Market Neutral',
        rating: 5,
        winRate: '70%',
        riskLevel: 'Medium',
        minAmount: '$1000',
        knowledge: 'Advanced',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' }
    },
    {
        id: 'mean_reversion',
        name: 'Mean Reversion',
        description: 'Trade range-bound markets using Bollinger Bands.',
        group: 'Market Neutral',
        rating: 3,
        winRate: '60%',
        riskLevel: 'Medium',
        minAmount: '$200',
        knowledge: 'Intermediate',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'connector' }
    },

    // Group 3: High Octane (Directional/Alpha)
    {
        id: 'dman',
        name: 'Directional Market Making',
        description: 'Market making biased by trend indicators (RSI).',
        group: 'High Octane',
        rating: 4,
        winRate: '50-60%',
        riskLevel: 'High',
        minAmount: '$300',
        knowledge: 'Advanced',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' }
    },
    {
        id: 'momentum',
        name: 'Momentum Breakdown',
        description: 'Capture strong trends using MACD & RSI.',
        group: 'High Octane',
        rating: 3,
        winRate: '40% (Big Wins)',
        riskLevel: 'High',
        minAmount: '$200',
        knowledge: 'Intermediate',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'connector' }
    },
    {
        id: 'stat_arb',
        name: 'Statistical Arbitrage',
        description: 'Pairs trading betting on correlation reversion.',
        group: 'Arbitrage',
        rating: 4,
        winRate: '55-65%',
        riskLevel: 'High',
        minAmount: '$1000',
        knowledge: 'Advanced',
        requirements: { exchanges: 2, connectorType: 'any', pairs: 2, primaryParam: 'connector_1' }
    },
    {
        id: 'smart_bot',
        name: 'Smart Trading Bot v4.0',
        description: 'Institutional-grade AI strategy with ATR position sizing, multi-timeframe analysis, trailing stops, and adaptive confidence. Supports LONG/SHORT/BOTH modes.',
        group: 'High Octane',
        rating: 5,
        winRate: 'Adaptive',
        riskLevel: 'Medium',
        minAmount: '$100',
        knowledge: 'Beginner',
        requirements: { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' }
    },
];

// Group Names
const STRATEGY_GROUPS = ['Steady Gains', 'Market Neutral', 'High Octane', 'Arbitrage'];

// Base exchanges - paper trade suffix added automatically based on toggle
const PAPER_TRADE_SUPPORTED_EXCHANGES = ['binance', 'kucoin', 'gate_io', 'ascend_ex', 'bybit', 'okx'];

const exchanges = [
    // Paper trade enabled
    { id: 'binance', name: 'Binance', type: 'CEX', supportsPaper: true },
    { id: 'kucoin', name: 'KuCoin', type: 'CEX', supportsPaper: true },
    { id: 'gate_io', name: 'Gate.io', type: 'CEX', supportsPaper: true },
    { id: 'ascend_ex', name: 'AscendEX', type: 'CEX', supportsPaper: true },
    { id: 'bybit', name: 'Bybit', type: 'CEX', supportsPaper: true },
    { id: 'okx', name: 'OKX', type: 'CEX', supportsPaper: true },
    // Live only
    { id: 'kraken', name: 'Kraken', type: 'CEX', supportsPaper: false },
    { id: 'mexc', name: 'MEXC', type: 'CEX', supportsPaper: false },
    { id: 'uniswap', name: 'Uniswap', type: 'DEX', supportsPaper: false },
];

// Initial trading pairs
const INITIAL_PAIRS = [
    'BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'XRP-USDT',
    'ADA-USDT', 'DOGE-USDT', 'AVAX-USDT', 'DOT-USDT', 'LINK-USDT',
    'BTC-USDC', 'ETH-USDC', 'SOL-USDC', 'ETH-BTC', 'MATIC-USDT',
    'LTC-USDT', 'UNI-USDT', 'ATOM-USDT', 'ETC-USDT', 'FIL-USDT',
    'ALGO-USDT', 'NEAR-USDT', 'APE-USDT', 'MANA-USDT', 'SAND-USDT',
    'AAVE-USDT', 'EOS-USDT', 'AXS-USDT', 'THETA-USDT', 'XTZ-USDT',
    'NEO-USDT', 'IOTA-USDT', 'KSM-USDT', 'EGLD-USDT', 'FTM-USDT',
    'TRX-USDT', 'SHIB-USDT', 'MEME-USDT', 'PEPE-USDT', 'WIF-USDT',
    'BONK-USDT', 'JUP-USDT', 'RNDR-USDT', 'INJ-USDT', 'TIA-USDT'
];

// ===========================================
// COMPONENT
// ===========================================



// Helper functions for Triangular Arbitrage
function validateTriangle(first: string, second: string, third: string, holding: string) {
    if (!first || !second || !third) return { valid: false, assets: [], errors: [] };

    const extractAssets = (pair: string) => pair ? pair.split('-') : [];
    const assets1 = extractAssets(first);
    const assets2 = extractAssets(second);
    const assets3 = extractAssets(third);

    const allAssets = new Set([...assets1, ...assets2, ...assets3]);

    return {
        valid: allAssets.size === 3 && (holding ? allAssets.has(holding) : true),
        assets: Array.from(allAssets),
        errors: [
            allAssets.size !== 3 ? 'Must have exactly 3 unique assets' : null,
            (holding && !allAssets.has(holding)) ? `Holding asset '${holding}' not in pairs` : null
        ].filter(Boolean) as string[]
    };
}

function calculateFeeInfo(minProfitability: number, tradingFeePercent: number = 0.1) {
    const totalFees = tradingFeePercent * 3;
    const breakEvenProfit = totalFees;

    return {
        totalFees,
        breakEvenProfit,
        isProfitable: minProfitability > breakEvenProfit
    };
}

export default function NewBotPage() {
    const router = useRouter();
    const { fetchBots, appMode, toggleAppMode } = useStore();
    const [step, setStep] = useState(1);
    const [isDeploying, setIsDeploying] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isPaperMode, setIsPaperMode] = useState(appMode === 'paper');

    // Sync paper mode with global store
    useEffect(() => {
        setIsPaperMode(appMode === 'paper');
    }, [appMode]);

    const [formData, setFormData] = useState({
        name: '',
        strategy: 'pmm',
        exchange: 'binance',
        pair: 'BTC-USDT',
        parameters: {} as Record<string, any>
    });

    const [exchangeFees, setExchangeFees] = useState<{ maker: number, taker: number, source: string } | null>(null);

    // Valid Pair Search State
    const [pairSearch, setPairSearch] = useState('');
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

    // Strategy Selection Logic
    const [selectedGroup, setSelectedGroup] = useState(STRATEGY_GROUPS[0]);

    // Filter strategies by group
    const filteredStrategies = strategies.filter(s => s.group === selectedGroup);

    // Initialize defaults
    useEffect(() => {
        const defaults: any = {};
        STRATEGY_TEMPLATES['pure_market_making'].forEach(p => defaults[p.name] = p.defaultValue);
        setFormData(prev => ({ ...prev, parameters: defaults }));
    }, []);

    // Risk management settings
    const [riskSettings, setRiskSettings] = useState<RiskSettings>(DEFAULT_RISK_SETTINGS);

    // UNIT CONVERSION STATE
    const [inputUnit, setInputUnit] = useState<'base' | 'quote'>('base');
    const [quoteAmount, setQuoteAmount] = useState<string>('');
    const [quoteAmountSafety, setQuoteAmountSafety] = useState<string>('');
    const [estimatedPrice, setEstimatedPrice] = useState<string>('');

    // Sync UI units with backend parameters for DCA
    useEffect(() => {
        if (formData.strategy === 'dca') {
            // Use 'base' for base asset (SOL, ETH, BTC, etc.) or 'usdt' for quote currency
            const unit = inputUnit === 'base' ? 'base' : 'usdt';
            console.log(`[DCA] Syncing unit: ${inputUnit} -> ${unit} (Pair: ${formData.pair})`);
            setFormData(prev => ({
                ...prev,
                parameters: {
                    ...prev.parameters,
                    'base_order_unit': unit,
                    'safety_order_unit': unit
                }
            }));
        }
    }, [inputUnit, formData.strategy, formData.pair]);

    // DYNAMIC PAIR MANAGEMENT
    const [customPairs, setCustomPairs] = useState<string[]>([]);
    const [pairStats, setPairStats] = useState<Record<string, number>>({});

    // Load custom pairs and stats on mount
    useEffect(() => {
        try {
            const savedCustom = localStorage.getItem('hbot_custom_pairs');
            if (savedCustom) setCustomPairs(JSON.parse(savedCustom));

            const savedStats = localStorage.getItem('hbot_pair_stats');
            if (savedStats) setPairStats(JSON.parse(savedStats));
        } catch (e) {
            console.error('Failed to load pair data from localStorage', e);
        }
    }, []);

    const recordPairUsage = (pair: string) => {
        const newStats = { ...pairStats, [pair]: (pairStats[pair] || 0) + 1 };
        setPairStats(newStats);
        localStorage.setItem('hbot_pair_stats', JSON.stringify(newStats));
    };

    const addCustomPair = (pair: string) => {
        const upperPair = pair.toUpperCase().trim();
        if (!INITIAL_PAIRS.includes(upperPair) && !customPairs.includes(upperPair)) {
            const newCustom = [...customPairs, upperPair];
            setCustomPairs(newCustom);
            localStorage.setItem('hbot_custom_pairs', JSON.stringify(newCustom));
            toast.success(`Dynamic Market Added: ${upperPair}`, {
                description: `Successfully validated on ${formData.exchange}`
            });
        }
        updateForm('pair', upperPair);
        recordPairUsage(upperPair);
    };

    // PAIR VALIDATION State
    const [isValidatingPair, setIsValidatingPair] = useState(false);
    const [pairValidationResult, setPairValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

    // Validate pair against exchange
    useEffect(() => {
        const search = pairSearch.toUpperCase().trim();
        const isValidFormat = validateTradingPair(search).valid;
        const allAvailable = Array.from(new Set([...INITIAL_PAIRS, ...customPairs]));
        const isNew = search.length > 3 && !allAvailable.includes(search);

        if (isValidFormat && isNew && formData.exchange) {
            const timer = setTimeout(async () => {
                setIsValidatingPair(true);
                setPairValidationResult(null);
                try {
                    // Check if exchange supports the pair by trying to fetch its price
                    const connector = getConnectorName(formData.exchange);
                    const response = await backendApi.get(`/market-data?connector=${connector}&pair=${search}`);

                    if (response.data && !response.data.error) {
                        setPairValidationResult({ valid: true });
                    } else {
                        setPairValidationResult({
                            valid: false,
                            error: `Not supported on ${formData.exchange}`
                        });
                    }
                } catch (e: any) {
                    setPairValidationResult({
                        valid: false,
                        error: `Pair not found on ${formData.exchange}`
                    });
                } finally {
                    setIsValidatingPair(false);
                }
            }, 800); // 800ms debounce
            return () => clearTimeout(timer);
        } else {
            setPairValidationResult(null);
            setIsValidatingPair(false);
        }
    }, [pairSearch, formData.exchange, customPairs]);

    // DCA-Specific State
    const [dcaPresets, setDcaPresets] = useState<any[]>([]);
    const [requiredCapital, setRequiredCapital] = useState<number | null>(null);
    const [availableBalance, setAvailableBalance] = useState<number | null>(null);
    const [loadingPresets, setLoadingPresets] = useState(false);

    // DCA Quick Setup State
    const [quickSetupValues, setQuickSetupValues] = useState({
        totalInvestment: 600,
        takeProfit: 2.0,
        stopLoss: 10.0
    });
    const [selectedWizardPreset, setSelectedWizardPreset] = useState<string | null>(null);
    const [showQuickPreview, setShowQuickPreview] = useState(false);
    const [calculatedConfig, setCalculatedConfig] = useState<CalculatedConfig | null>(null);

    // Rough price map for auto-filling estimated price
    const PRICE_ESTIMATES: Record<string, string> = {
        'BTC': '95000',
        'ETH': '3400',
        'SOL': '145',
        'BNB': '600',
        'AVAX': '40',
        'DOGE': '0.15',
        'XRP': '1.10',
        'ADA': '0.5',
    };

    // Auto-fill price when pair changes
    useEffect(() => {
        if (formData.pair) {
            const base = formData.pair.split('-')[0];
            if (PRICE_ESTIMATES[base]) {
                setEstimatedPrice(PRICE_ESTIMATES[base]);
            }
        }
    }, [formData.pair]);

    // NOTE: Hardcoded conversion useEffect removed in favor of direct onChange calculation 
    // to support multiple amount fields (base vs safety).

    // Get the actual connector name (with or without _paper_trade suffix)
    const getConnectorName = (baseExchange: string): string => {
        if (isPaperMode && PAPER_TRADE_SUPPORTED_EXCHANGES.includes(baseExchange)) {
            return `${baseExchange}_paper_trade`;
        }
        return baseExchange;
    };

    // Fetch DCA presets when strategy is DCA
    useEffect(() => {
        if (formData.strategy === 'dca') {
            setLoadingPresets(true);
            backendApi.get('/strategies/dca/presets')
                .then(res => {
                    setDcaPresets(res.data.presets || []);
                })
                .catch(err => console.error('Failed to load DCA presets:', err))
                .finally(() => setLoadingPresets(false));
        }
    }, [formData.strategy]);

    // Fetch available balance when exchange or strategy changes
    useEffect(() => {
        if (formData.exchange && (formData.strategy === 'dca' || formData.strategy === 'pmm' || formData.strategy === 'arbitrage')) {
            console.log(`[Portfolio] Fetching balance for ${formData.exchange}...`);
            backendApi.get('/portfolio')
                .then(res => {
                    const data = res.data;
                    let targetAsset = 'USDT';

                    if (formData.strategy === 'arbitrage') {
                        targetAsset = (formData.parameters.holding_asset as string) || 'USDT';
                    } else {
                        targetAsset = formData.pair?.split('-')[1] || 'USDT';
                    }

                    const assets = data.assets || [];
                    const asset = assets.find((a: any) =>
                        a.symbol === targetAsset &&
                        a.exchange.toLowerCase() === formData.exchange.toLowerCase()
                    );

                    if (asset) {
                        console.log(`[Portfolio] Found ${targetAsset}: ${asset.amount}`);
                        setAvailableBalance(asset.amount);
                    } else {
                        // Fallback to USDT in general if specific exchange asset not found
                        const usdt = assets.find((a: any) => a.symbol === 'USDT');
                        console.log(`[Portfolio] ${targetAsset} not found on ${formData.exchange}, fallback to USDT: ${usdt ? usdt.amount : 0}`);
                        setAvailableBalance(usdt ? usdt.amount : 0);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch portfolio:', err);
                    setAvailableBalance(0); // Set to 0 on error to avoid null hiding the UI
                });
        }
    }, [formData.exchange, formData.strategy, formData.pair, formData.parameters.holding_asset]);

    // Calculate required capital and validate with backend for DCA
    useEffect(() => {
        if (formData.strategy === 'dca') {
            const timer = setTimeout(() => {
                const config = {
                    symbol: formData.pair || 'BTC-USDT',
                    side: formData.parameters.side || 'buy',
                    ...formData.parameters
                };

                backendApi.post('/strategies/dca/validate', config)
                    .then(res => {
                        const data = res.data;
                        if (data.required_capital) {
                            setRequiredCapital(data.required_capital);
                        }
                        if (data.errors && data.errors.length > 0) {
                            setValidationErrors(data.errors);
                        } else {
                            setValidationErrors([]);
                        }
                    })
                    .catch(err => console.error('Failed to validate DCA config:', err));
            }, 500); // 500ms debounce

            return () => clearTimeout(timer);
        }
    }, [
        formData.strategy,
        formData.pair,
        formData.parameters
    ]);

    // Fetch exchange fees
    useEffect(() => {
        const exchange = formData.exchange;
        const pair = formData.strategy === 'arbitrage' ? formData.parameters.first_pair : formData.pair;

        if (exchange) {
            backendApi.get(`/exchanges/${exchange}/fees?pair=${pair || ''}`)
                .then(res => {
                    setExchangeFees(res.data);
                })
                .catch(err => {
                    console.error('Failed to fetch exchange fees:', err);
                    setExchangeFees(null);
                });
        }
    }, [formData.exchange, formData.pair, formData.strategy, formData.parameters.first_pair]);

    const updateForm = (key: string, value: any) => {
        setFormData(prev => {
            const updates: any = { [key]: value };

            // If strategy changed, load its default parameters
            if (key === 'strategy') {
                const defaultParams: any = {};
                const templateId = getTemplateId(value);
                const template = STRATEGY_TEMPLATES[templateId];
                if (template) {
                    template.forEach(p => defaultParams[p.name] = p.defaultValue);
                    updates.parameters = defaultParams;
                }
            }

            return { ...prev, ...updates };
        });
        setValidationErrors([]);
    };

    const applyPreset = (preset: StrategyPreset) => {
        setFormData(prev => ({
            ...prev,
            parameters: {
                ...prev.parameters,
                ...preset.parameters
            }
        }));
        toast.success(`Applied ${preset.name} preset`);
    };

    const updateParameter = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            parameters: { ...prev.parameters, [key]: value }
        }));
        setValidationErrors([]);
    };

    // ===========================================
    // VALIDATION
    // ===========================================

    const validateTradingPair = (pair: string): { valid: boolean; error?: string } => {
        if (!pair) return { valid: false, error: 'Trading pair is required' };

        // Check format
        if (!pair.includes('-')) {
            return { valid: false, error: 'Format must be BASE-QUOTE (e.g., BTC-USDT)' };
        }

        const parts = pair.split('-');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            return { valid: false, error: 'Invalid pair format. Use BASE-QUOTE format.' };
        }

        // Check for common garbage input
        if (pair.toLowerCase().includes('garbage') || pair.toLowerCase().includes('test')) {
            return { valid: false, error: 'Please use a real trading pair' };
        }

        // Warn if not in known pairs list (but don't block)
        const allPairs = [...INITIAL_PAIRS, ...customPairs];
        if (!allPairs.includes(pair)) {
            return { valid: true }; // Valid but show info toast
        }

        return { valid: true };
    };

    const validateStep = (stepNum: number): boolean => {
        const errors: string[] = [];

        switch (stepNum) {
            case 1:
                if (!formData.strategy) {
                    errors.push('Please select a strategy');
                }
                break;

            case 2:
                const strategy = strategies.find(s => s.id === formData.strategy);
                const reqs = strategy?.requirements || { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' };

                if (!formData.exchange) {
                    errors.push('Please select a primary exchange');
                }

                if (reqs.exchanges > 1) {
                    // Check for second connector based on strategy param mapping
                    const secEx = formData.strategy === 'stat_arb'
                        ? formData.parameters.connector_2
                        : formData.parameters.taker_exchange;

                    if (!secEx) {
                        errors.push('Please select a secondary exchange');
                    } else if (secEx === formData.exchange) {
                        errors.push('Primary and Secondary exchanges must be different');
                    }
                }

                if (reqs.pairs > 0) {
                    const pairValidation = validateTradingPair(formData.pair);
                    if (!pairValidation.valid) {
                        errors.push(pairValidation.error!);
                    }
                }
                break;

            case 3:
                // Dynamic validation based on templates
                const currentTemplate = STRATEGY_TEMPLATES[getTemplateId(formData.strategy)];
                if (!currentTemplate) return true;

                currentTemplate.forEach(param => {
                    if (param.required) {
                        const val = formData.parameters[param.name];
                        if (val === undefined || val === null || val === '') {
                            errors.push(`${param.label} is required`);
                        }
                        if (param.type === 'number' || param.type === 'percentage') {
                            const numVal = parseFloat(val);
                            if (isNaN(numVal)) {
                                errors.push(`${param.label} must be a number`);
                            } else {
                                if (param.min !== undefined && numVal < param.min) {
                                    errors.push(`${param.label} must be at least ${param.min}`);
                                }
                                if (param.max !== undefined && numVal > param.max) {
                                    errors.push(`${param.label} must be at most ${param.max}`);
                                }
                            }
                        }
                    }
                });
                break;
        }

        setValidationErrors(errors);

        // --- ARBITRAGE SPECIFIC VALIDATION ---
        if (errors.length === 0 && stepNum === 3) {
            // XEMM Validation
            if (formData.strategy === 'xemm') {
                const makerEx = formData.exchange; // Primary is maker
                const takerEx = formData.parameters.taker_exchange;
                if (makerEx === takerEx) {
                    errors.push('Spatial Arbitrage (XEMM) requires two DIFFERENT exchanges.');
                }
            }

            // Stat Arb Validation
            if (formData.strategy === 'stat_arb') {
                const ex1 = formData.parameters.connector_1;
                const ex2 = formData.parameters.connector_2;
                const pair1 = formData.parameters.trading_pair_1;
                const pair2 = formData.parameters.trading_pair_2;

                if (ex1 === ex2 && pair1 === pair2) {
                    errors.push('Statistical Arbitrage requires different assets or different exchanges.');
                }
            }
            // Triangular Arbitrage Validation
            if (formData.strategy === 'arbitrage') {
                const p1 = formData.parameters.first_pair;
                const p2 = formData.parameters.second_pair;
                const p3 = formData.parameters.third_pair;

                if (!p1 || !p2 || !p3) return false; // Already caught by required check

                // Simple loop check: Ensure assets overlap
                const assets = new Set([
                    ...p1.split('-'),
                    ...p2.split('-'),
                    ...p3.split('-')
                ]);
                // A valid triangle usually has exactly 3 unique assets (A-B, B-C, C-A -> A,B,C)
                if (assets.size !== 3) {
                    errors.push('Triangular Arbitrage must use exactly 3 unique assets to form a loop (e.g. A-B, B-C, C-A).');
                }
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    // ===========================================
    // DEPLOY HANDLER
    // ===========================================

    const handleDeploy = useCallback(async () => {
        if (!validateStep(3)) {
            toast.error('Please fix validation errors before deploying');
            return;
        }

        setIsDeploying(true);
        setValidationErrors([]);

        // Show loading toast
        const loadingToast = toast.loading('Deploying bot...', {
            description: 'Creating configuration and starting bot'
        });

        try {
            // Use JWT token for authentication (via backendApi from backend-api.ts)

            // Determine the actual connector to use
            const actualConnector = getConnectorName(formData.exchange);
            const modePrefix = isPaperMode ? 'paper' : 'live';

            const botName = formData.name.trim() ||
                `${modePrefix}-${formData.exchange}-${formData.pair}-${formData.strategy}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

            console.log(`[Deploy] Paper Mode: ${isPaperMode}, Base Exchange: ${formData.exchange}, Actual Connector: ${actualConnector}`);

            // === INJECT REDUNDANT PARAMETERS ===
            const strategyInfo = strategies.find(s => s.id === formData.strategy);
            const reqs = strategyInfo?.requirements || { exchanges: 1, connectorType: 'any', pairs: 1, primaryParam: 'exchange' };
            const finalParameters = { ...formData.parameters };

            // 1. Inject Primary Exchange/Connector
            if (reqs.primaryParam) {
                finalParameters[reqs.primaryParam] = actualConnector;
            }

            // 2. Inject Trading Pair
            // Most use 'trading_pair', PMM uses 'pair'
            const pairKey = formData.strategy === 'pmm' ? 'pair' : 'trading_pair';

            // Strategies that need pair injection
            if (reqs.pairs > 0 && formData.pair) {
                // For Stat Arb, we inject pair as pair_1? No, wizard Step 2 for Stat Arb needs review if it supports 2 pairs.
                // Current Wizard Step 2 only supports ONE pair `formData.pair`.
                // If Stat Arb needs 2 pairs, we kept pair_2 in config. We inject pair_1.
                if (formData.strategy === 'stat_arb') {
                    finalParameters['trading_pair_1'] = formData.pair;
                } else {
                    finalParameters[pairKey] = formData.pair;
                }
            }

            // XEMM: Maker (Primary) is injected above as primaryParam. Taker is in parameters.

            // ===================================

            const response = await backendApi.post('/bots/deploy', {
                name: botName,
                strategy: formData.strategy,
                exchange: actualConnector, // Use the paper trade connector if in paper mode
                pair: formData.pair,
                isPaperTrade: isPaperMode,
                parameters: finalParameters, // Send enriched parameters
                // Risk management settings
                riskSettings: {
                    killSwitch: riskSettings.killSwitchEnabled ? {
                        enabled: true,
                        mode: riskSettings.killSwitchMode,
                        maxLoss: riskSettings.killSwitchMaxLoss,
                        maxProfit: riskSettings.killSwitchMaxProfit,
                    } : { enabled: false },
                    dailyLossLimit: riskSettings.dailyLossLimitEnabled ? {
                        enabled: true,
                        limit: riskSettings.dailyLossLimit,
                    } : { enabled: false },
                    maxDrawdown: riskSettings.maxDrawdownEnabled ? {
                        enabled: true,
                        percent: riskSettings.maxDrawdownPercent,
                    } : { enabled: false },
                    inventorySkew: riskSettings.inventorySkewEnabled ? {
                        enabled: true,
                        targetBasePct: riskSettings.inventoryTargetBasePct,
                    } : { enabled: false },
                }
            });

            const data = response.data;

            if (response.status !== 200 && response.status !== 201) {
                // Dismiss loading and show error
                toast.dismiss(loadingToast);

                const errorMessage = Array.isArray(data.details)
                    ? data.details.join(', ')
                    : data.details || data.error || 'Unknown error';

                toast.error('Deployment Failed', {
                    description: errorMessage,
                    duration: 5000,
                });

                setValidationErrors([errorMessage]);
                setIsDeploying(false);
                return;
            }

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            // Show success toast
            toast.success('Bot Deployed Successfully! 🚀', {
                description: `${botName} is now running`,
                duration: 4000,
            });

            // Refresh bots list
            await fetchBots();

            // Navigate back after short delay for user to see success
            setTimeout(() => {
                router.push('/orchestration');
            }, 1000);

        } catch (error: any) {
            toast.dismiss();
            toast.error('Network Error', {
                description: error.message || 'Failed to connect to server',
                duration: 5000,
            });
            setValidationErrors([error.message || 'Network error']);
            setIsDeploying(false);
        }
    }, [formData, fetchBots, router]);

    // ===========================================
    // STEP NAVIGATION
    // ===========================================

    const handleNext = () => {
        if (validateStep(step)) {
            // Show info toast for non-standard pairs
            const allPairs = [...INITIAL_PAIRS, ...customPairs];
            if (step === 2 && formData.pair && !allPairs.includes(formData.pair)) {
                toast.info('Custom Trading Pair', {
                    description: `${formData.pair} is not in our verified list. Make sure it exists on ${formData.exchange}.`,
                    duration: 4000,
                });
            }
            setStep(prev => Math.min(5, prev + 1)); // Now 5 steps instead of 4
        }
    };

    const handleBack = () => {
        setValidationErrors([]);
        setStep(prev => Math.max(1, prev - 1));
    };

    // ===========================================
    // RENDER
    // ===========================================

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Paper Trading Toggle - Prominent at the top */}
            <div className={cn(
                "rounded-xl p-4 border-2 transition-all",
                isPaperMode
                    ? "bg-amber-500/10 border-amber-500/50"
                    : "bg-green-500/10 border-green-500/50"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isPaperMode ? (
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <Beaker className="w-6 h-6 text-amber-400" />
                            </div>
                        ) : (
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <Zap className="w-6 h-6 text-green-400" />
                            </div>
                        )}
                        <div>
                            <h3 className={cn(
                                "font-bold text-lg",
                                isPaperMode ? "text-amber-400" : "text-green-400"
                            )}>
                                {isPaperMode ? "📝 PAPER TRADING MODE" : "⚡ LIVE TRADING MODE"}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {isPaperMode
                                    ? "Simulated orders - No real money at risk. Uses real market data."
                                    : "⚠️ REAL ORDERS - Actual funds will be used!"
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsPaperMode(!isPaperMode);
                            toggleAppMode();
                            toast.info(isPaperMode ? 'Switched to LIVE mode' : 'Switched to PAPER mode', {
                                description: isPaperMode
                                    ? '⚠️ Real orders will be placed!'
                                    : 'No real money at risk'
                            });
                        }}
                        className={cn(
                            "relative w-16 h-8 rounded-full transition-colors",
                            isPaperMode ? "bg-amber-500" : "bg-green-500"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg",
                            isPaperMode ? "left-1" : "left-9"
                        )} />
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Deploy New Bot</h2>
                <p className="text-slate-400 mt-1">Configure and launch a new trading bot instance</p>
            </div>

            {/* Progress Steps */}
            <div className="relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full -z-10"></div>
                <div className="flex justify-between">
                    {[
                        { num: 1, label: 'Strategy', icon: LayoutGrid },
                        { num: 2, label: 'Market', icon: Wallet },
                        { num: 3, label: 'Config', icon: Settings },
                        { num: 4, label: 'Risk', icon: Shield },
                        { num: 5, label: 'Review', icon: Rocket },
                    ].map((s) => (
                        <div key={s.num} className="flex flex-col items-center bg-slate-950 px-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                step >= s.num
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-slate-900 border-slate-700 text-slate-500"
                            )}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "text-xs font-medium mt-2",
                                step >= s.num ? "text-blue-500" : "text-slate-500"
                            )}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-400">Please fix the following errors:</p>
                            <ul className="list-disc list-inside text-sm text-red-300 mt-2 space-y-1">
                                {validationErrors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 min-h-[400px]">
                {/* Step 1: Strategy Selection */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-white">Select a Strategy</h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800 mb-4 overflow-x-auto">
                            {STRATEGY_GROUPS.map(group => (
                                <button
                                    key={group}
                                    onClick={() => setSelectedGroup(group)}
                                    className={cn(
                                        "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                                        selectedGroup === group
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                    )}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredStrategies.map((strategy) => (
                                <button
                                    key={strategy.id}
                                    onClick={() => updateForm('strategy', strategy.id)}
                                    className={cn(
                                        "w-full text-left p-0 rounded-xl border transition-all hover:border-blue-500/50 relative overflow-hidden group",
                                        formData.strategy === strategy.id
                                            ? "bg-blue-900/10 border-blue-500 ring-1 ring-blue-500"
                                            : "bg-slate-950/50 border-slate-800 hover:bg-slate-900"
                                    )}
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                                                    {strategy.name}
                                                </h4>
                                                <p className="text-sm text-slate-400 mt-1 pr-8">
                                                    {strategy.description}
                                                </p>
                                            </div>
                                            <div className="flex text-amber-400 text-xs tracking-tighter bg-slate-900/50 px-2 py-1 rounded-full border border-slate-800">
                                                {'★'.repeat(strategy.rating)}
                                                <span className="text-slate-700">{'★'.repeat(5 - strategy.rating)}</span>
                                            </div>
                                        </div>

                                        {/* Metadata Badges */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/50">
                                            <div className="bg-slate-900/50 p-2 rounded-lg">
                                                <div className="text-[10px] uppercase text-slate-500 font-semibold">Win Rate</div>
                                                <div className="text-xs text-green-400 font-medium">{strategy.winRate}</div>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg">
                                                <div className="text-[10px] uppercase text-slate-500 font-semibold">Risk Level</div>
                                                <div className={cn(
                                                    "text-xs font-medium",
                                                    strategy.riskLevel.includes('Low') ? "text-blue-400" :
                                                        strategy.riskLevel === 'Medium' ? "text-amber-400" : "text-red-400"
                                                )}>{strategy.riskLevel}</div>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg">
                                                <div className="text-[10px] uppercase text-slate-500 font-semibold">Min Capital</div>
                                                <div className="text-xs text-slate-300 font-medium">{strategy.minAmount}</div>
                                            </div>
                                            <div className="bg-slate-900/50 p-2 rounded-lg">
                                                <div className="text-[10px] uppercase text-slate-500 font-semibold">Difficulty</div>
                                                <div className="text-xs text-purple-400 font-medium">{strategy.knowledge}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.strategy === strategy.id && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <div className="bg-blue-600 text-white p-1 rounded-bl-lg rounded-tr-lg shadow-lg">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Market Selection (Dynamic) */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium text-white">Select Market</h3>
                        <div className="space-y-4 max-w-md">
                            {(() => {
                                const strategy = strategies.find(s => s.id === formData.strategy);
                                const reqs = strategy?.requirements || { exchanges: 1, connectorType: 'any', pairs: 1, assets: false, primaryParam: 'exchange' };

                                // Filter exchanges based on type (CEX/DEX)
                                const validExchanges = exchanges.filter(ex => {
                                    if (isPaperMode && !ex.supportsPaper) return false;
                                    if (reqs.connectorType === 'dex' && ex.type !== 'DEX') return false;
                                    if (reqs.connectorType === 'cex' && ex.type !== 'CEX') return false;
                                    return true;
                                });

                                return (
                                    <>
                                        {/* Primary Exchange */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                                {reqs.exchanges > 1 ? 'Maker / Primary Exchange' : 'Exchange'}
                                            </label>
                                            <select
                                                value={formData.exchange}
                                                onChange={(e) => {
                                                    updateForm('exchange', e.target.value);
                                                    if (reqs.primaryParam) {
                                                        updateParameter(reqs.primaryParam, e.target.value);
                                                    }
                                                }}
                                                className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                            >
                                                <option value="">Select Exchange</option>
                                                {validExchanges.map(ex => (
                                                    <option key={ex.id} value={ex.id}>
                                                        {ex.name} ({ex.type}){isPaperMode && ex.supportsPaper ? ' - Paper' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Secondary Exchange (for XEMM/Arb) */}
                                        {reqs.exchanges > 1 && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                                    Taker / Secondary Exchange
                                                </label>
                                                <select
                                                    value={formData.parameters.taker_exchange || formData.parameters.connector_2 || ''}
                                                    onChange={(e) => {
                                                        // Map to the correct parameter based on strategy
                                                        const paramName = formData.strategy === 'stat_arb' ? 'connector_2' : 'taker_exchange';
                                                        updateParameter(paramName, e.target.value);
                                                    }}
                                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                                >
                                                    <option value="">Select Exchange</option>
                                                    {validExchanges.map(ex => (
                                                        <option key={ex.id} value={ex.id} disabled={ex.id === formData.exchange}>
                                                            {ex.name} ({ex.type}){isPaperMode && ex.supportsPaper ? ' - Paper' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Trading Pair Grid Selection - Hidden for Arbitrage */}
                                        {reqs.pairs > 0 && formData.strategy !== 'arbitrage' && (
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-slate-400">
                                                    {reqs.pairs > 1 ? 'Primary Trading Pair' : 'Trading Pair'}
                                                </label>

                                                {/* Search Box */}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search pair (e.g. BTC)..."
                                                        value={pairSearch}
                                                        onChange={(e) => setPairSearch(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>

                                                <div className="h-64 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950/50 space-y-4">
                                                    {(() => {
                                                        const search = pairSearch.toUpperCase().trim();
                                                        const allAvailablePairs = Array.from(new Set([...INITIAL_PAIRS, ...customPairs]));

                                                        // Filter and Sort by Frequency
                                                        const filtered = allAvailablePairs
                                                            .filter(p => !search || p.includes(search))
                                                            .sort((a, b) => (pairStats[b] || 0) - (pairStats[a] || 0));

                                                        // Check if search is a valid new pair candidate
                                                        const isValidFormat = validateTradingPair(search).valid;
                                                        const isNewPair = search.length > 3 && !allAvailablePairs.includes(search);

                                                        // Group Pairs
                                                        const groups: Record<string, string[]> = {
                                                            'Frequently Used': filtered.filter(p => (pairStats[p] || 0) > 0),
                                                            'USDT Markets': filtered.filter(p => p.endsWith('-USDT')),
                                                            'USDC Markets': filtered.filter(p => p.endsWith('-USDC')),
                                                            'BTC Markets': filtered.filter(p => p.endsWith('-BTC') || p.startsWith('BTC-')),
                                                            'Others': filtered.filter(p => !p.endsWith('USDT') && !p.endsWith('USDC') && !p.includes('BTC') && (pairStats[p] || 0) === 0)
                                                        };

                                                        return (
                                                            <>
                                                                {/* Dynamic Add Button with Validation Check */}
                                                                {isValidFormat && isNewPair && (
                                                                    <div className="mb-4 p-2 bg-blue-600/10 border border-blue-500/30 rounded-lg animate-in zoom-in-95 duration-200">
                                                                        {isValidatingPair ? (
                                                                            <div className="flex items-center justify-center py-2 px-3 text-xs text-slate-400 gap-3 italic">
                                                                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                                                                Validating with {formData.exchange}...
                                                                            </div>
                                                                        ) : pairValidationResult?.valid ? (
                                                                            <button
                                                                                onClick={() => addCustomPair(search)}
                                                                                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40"
                                                                            >
                                                                                <Zap className="w-3 h-3" />
                                                                                Add & Select "{search}"
                                                                            </button>
                                                                        ) : pairValidationResult?.error ? (
                                                                            <div className="flex items-center justify-center py-2 px-3 text-[10px] text-red-500 gap-2 font-medium bg-red-500/5 rounded border border-red-500/20">
                                                                                <XCircle className="w-3 h-3" />
                                                                                {pairValidationResult.error}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center py-2 text-[10px] text-slate-500 italic">
                                                                                Search for a pair to validate on {formData.exchange}...
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {Object.entries(groups).map(([groupName, pairs]) => {
                                                                    const displayPairs = groupName === 'Frequently Used'
                                                                        ? pairs.slice(0, 6) // Only top 6 frequent
                                                                        : pairs.filter(p => groupName !== 'Frequently Used' && (groupName !== 'Others' || (pairStats[p] || 0) === 0));

                                                                    if (displayPairs.length === 0) return null;

                                                                    // Avoid showing frequent pairs twice in their respective categories if they are frequent
                                                                    // Actually, it's better to show them in both or just frequent. 
                                                                    // Let's hide them from normal groups if they are in Frequent to reduce clutter.
                                                                    const filteredDisplayPairs = groupName === 'Frequently Used'
                                                                        ? displayPairs
                                                                        : displayPairs.filter(p => (pairStats[p] || 0) === 0);

                                                                    if (filteredDisplayPairs.length === 0 && groupName !== 'Frequently Used') return null;

                                                                    return (
                                                                        <div key={groupName} className="mb-4">
                                                                            <h4 className={cn(
                                                                                "text-[10px] font-bold uppercase tracking-widest mb-2 sticky top-0 bg-slate-950 py-1 flex items-center gap-1.5",
                                                                                groupName === 'Frequently Used' ? "text-amber-400" : "text-slate-500"
                                                                            )}>
                                                                                {groupName === 'Frequently Used' && <TrendingUp className="w-3 h-3" />}
                                                                                {groupName}
                                                                            </h4>
                                                                            <div className="grid grid-cols-3 gap-2">
                                                                                {filteredDisplayPairs.map(pair => (
                                                                                    <button
                                                                                        key={pair}
                                                                                        onClick={() => {
                                                                                            updateForm('pair', pair);
                                                                                            recordPairUsage(pair);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "text-[10px] py-2 px-2 rounded-lg border transition-all text-center truncate group",
                                                                                            formData.pair === pair
                                                                                                ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40"
                                                                                                : "bg-slate-900/50 border-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                                                                        )}
                                                                                    >
                                                                                        <span className="font-bold underline decoration-slate-600/50 underline-offset-2">{pair.split('-')[0]}</span>
                                                                                        <span className="opacity-50 ml-0.5">/{pair.split('-')[1]}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Selected Pair Feedback */}
                                                {formData.pair && (
                                                    <div className="text-xs text-center text-blue-400">
                                                        Selected: <span className="font-bold text-white">{formData.pair}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Info Box */}
                                        <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-3 text-xs text-blue-300">
                                            <p className="font-semibold mb-1">Requirements for {strategy?.name}:</p>
                                            <ul className="list-disc list-inside space-y-0.5 opacity-80">
                                                <li>Requires {reqs.exchanges} Exchange{reqs.exchanges > 1 ? 's' : ''}</li>
                                                <li>Type: {reqs.connectorType === 'any' ? 'CEX or DEX' : reqs.connectorType.toUpperCase()}</li>
                                                {reqs.pairs > 0 && <li>Requires Trading Pair</li>}
                                                {reqs.assets && <li>Requires Asset List (Configured in next step)</li>}
                                            </ul>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Step 3: Configuration (Dynamic) */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium text-white">Configuration</h3>
                        <div className="space-y-4 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Bot Name (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="My Trading Bot"
                                    value={formData.name}
                                    onChange={(e) => updateForm('name', e.target.value)}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-slate-500 text-xs mt-1">
                                    Leave empty to auto-generate: {formData.exchange}-{formData.pair}-{formData.strategy}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                {/* Preset Selector (Hidden for DCA to prefer Smart Auto-Fill) */}
                                {STRATEGY_PRESETS[getTemplateId(formData.strategy)] && formData.strategy !== 'dca' && (
                                    <div className="col-span-1 md:col-span-2 mb-4">
                                        <label className="block text-sm font-medium text-slate-400 mb-3">
                                            Load Preset (Optional)
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {(STRATEGY_PRESETS[getTemplateId(formData.strategy)] || []).map((preset) => (
                                                <button
                                                    key={preset.id || preset.name}
                                                    onClick={() => {
                                                        applyPreset(preset);
                                                        setSelectedPresetId(preset.name);
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-start p-3 rounded-lg border transition-all text-left group",
                                                        selectedPresetId === preset.name
                                                            ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500"
                                                            : "bg-slate-900/30 border-slate-800 hover:bg-slate-800 hover:border-blue-500/50"
                                                    )}
                                                >
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Zap className="w-3 h-3 text-amber-400" />
                                                        <span className="font-medium text-sm text-slate-200 group-hover:text-white">
                                                            {preset.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 leading-tight mb-2 line-clamp-2">
                                                        {preset.description}
                                                    </p>
                                                    {preset.estimated_capital && (
                                                        <div className="mt-auto pt-2 border-t border-slate-800/50 w-full flex justify-between items-center">
                                                            <span className="text-[10px] text-slate-400 font-medium">Min Capital:</span>
                                                            <span className="text-[10px] text-blue-400 font-bold">${Number(preset.estimated_capital).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* DCA Quick Setup Wizard */}
                                {formData.strategy === 'dca' && (
                                    <div className="col-span-1 md:col-span-2 mb-6 bg-blue-600/10 border-2 border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Calculator className="w-24 h-24 text-blue-400" />
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-blue-500/20">
                                                <Wand2 className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white tracking-tight">Smart Auto-Fill</h3>
                                                <p className="text-xs text-slate-400">Enter your targets or choose a style below</p>
                                            </div>
                                        </div>

                                        {/* Wizard Presets */}
                                        <div className="grid grid-cols-3 gap-2 mb-6">
                                            {[
                                                { name: 'Conservative', icon: '🛡️', desc: 'Low Risk', values: { totalInvestment: 600, takeProfit: 2.0, stopLoss: 4.0 } },
                                                { name: 'Balanced', icon: '⚖️', desc: 'Moderate', values: { totalInvestment: 1000, takeProfit: 2.0, stopLoss: 5.0 } },
                                                { name: 'Aggressive', icon: '🔥', desc: 'High Risk', values: { totalInvestment: 2000, takeProfit: 2.5, stopLoss: 6.0 } },
                                            ].map((p) => (
                                                <button
                                                    key={p.name}
                                                    onClick={() => {
                                                        setQuickSetupValues(p.values);
                                                        setSelectedWizardPreset(p.name);
                                                        const config = calculateRecommendedConfig({
                                                            totalInvestment: p.values.totalInvestment,
                                                            takeProfitPercent: p.values.takeProfit,
                                                            stopLossPercent: p.values.stopLoss,
                                                            tradingPair: formData.pair
                                                        });
                                                        setCalculatedConfig(config);
                                                        setShowQuickPreview(true);
                                                        toast.info(`Loaded ${p.name} preset`, {
                                                            description: "Review and apply the calculated settings below."
                                                        });
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center p-3 rounded-xl border transition-all group",
                                                        selectedWizardPreset === p.name
                                                            ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-900/20"
                                                            : "bg-slate-950/50 border-slate-800 hover:bg-blue-600/10 hover:border-blue-500/50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-xl mb-1 transition-transform",
                                                        selectedWizardPreset === p.name ? "scale-110" : "group-hover:scale-110"
                                                    )}>{p.icon}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-wider",
                                                        selectedWizardPreset === p.name ? "text-blue-400" : "text-white"
                                                    )}>{p.name}</span>
                                                    <span className="text-[9px] text-slate-500">{p.desc}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Investment ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                    <input
                                                        type="number"
                                                        value={quickSetupValues.totalInvestment}
                                                        onChange={(e) => {
                                                            setQuickSetupValues(prev => ({ ...prev, totalInvestment: Number(e.target.value) }));
                                                            setSelectedWizardPreset(null); // Clear preset selection on manual edit
                                                        }}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-7 pr-3 text-white focus:border-blue-500 focus:outline-none transition-all text-sm"
                                                        placeholder="500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Profit (%)</label>
                                                <div className="relative">
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                                                    <input
                                                        type="number"
                                                        value={quickSetupValues.takeProfit}
                                                        onChange={(e) => {
                                                            setQuickSetupValues(prev => ({ ...prev, takeProfit: Number(e.target.value) }));
                                                            setSelectedWizardPreset(null);
                                                        }}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-8 text-white focus:border-blue-500 focus:outline-none transition-all text-sm"
                                                        placeholder="2.0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Stop Loss (%)</label>
                                                <div className="relative">
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                                                    <input
                                                        type="number"
                                                        value={quickSetupValues.stopLoss}
                                                        onChange={(e) => {
                                                            setQuickSetupValues(prev => ({ ...prev, stopLoss: Number(e.target.value) }));
                                                            setSelectedWizardPreset(null);
                                                        }}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-8 text-white focus:border-blue-500 focus:outline-none transition-all text-sm"
                                                        placeholder="10.0"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const config = calculateRecommendedConfig({
                                                    totalInvestment: quickSetupValues.totalInvestment,
                                                    takeProfitPercent: quickSetupValues.takeProfit,
                                                    stopLossPercent: quickSetupValues.stopLoss,
                                                    tradingPair: formData.pair
                                                });
                                                setCalculatedConfig(config);
                                                setShowQuickPreview(true);
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                                        >
                                            <Calculator className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                            Calculate Recommended Settings
                                        </button>

                                        {showQuickPreview && calculatedConfig && (
                                            <div className="mt-6 pt-6 border-t border-blue-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Recommended Configuration
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                                                    {[
                                                        { label: 'Base Order', value: `$${calculatedConfig.base_order_amount}` },
                                                        { label: 'Safety Order', value: `$${calculatedConfig.safety_order_amount}` },
                                                        { label: 'Max SOs', value: calculatedConfig.max_safety_orders },
                                                        { label: 'Deviation', value: `${calculatedConfig.price_deviation}%` },
                                                        { label: 'Step Scale', value: `${calculatedConfig.price_step_scale}x` },
                                                        { label: 'Vol Scale', value: `${calculatedConfig.safety_order_volume_scale}x` },
                                                        { label: 'Take Profit', value: `${calculatedConfig.take_profit_base}%` },
                                                        { label: 'Stop Loss', value: `${calculatedConfig.stop_loss_base}%` },
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-2.5">
                                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">{item.label}</div>
                                                            <div className="text-xs font-bold text-white tracking-tight">{item.value}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            const newParams = { ...formData.parameters };

                                                            newParams.total_investment_amount = quickSetupValues.totalInvestment;
                                                            // Wizard calculates in USD, so we set raw USD values and tell UI to use Quote mode
                                                            newParams.base_order_amount = calculatedConfig.base_order_amount.toString();
                                                            newParams.safety_order_amount = calculatedConfig.safety_order_amount.toString();
                                                            newParams.max_safety_orders = calculatedConfig.max_safety_orders.toString();
                                                            newParams.price_deviation = calculatedConfig.price_deviation.toString();
                                                            newParams.price_step_scale = calculatedConfig.price_step_scale.toString();
                                                            newParams.safety_order_volume_scale = calculatedConfig.safety_order_volume_scale.toString();
                                                            newParams.take_profit_base = calculatedConfig.take_profit_base.toString();
                                                            newParams.stop_loss_base = calculatedConfig.stop_loss_base.toString();

                                                            setFormData(prev => ({
                                                                ...prev,
                                                                parameters: newParams
                                                            }));

                                                            // Force UI to Quote (USD) mode so the unit sync effect triggers 'usdt'
                                                            setInputUnit('quote');

                                                            setShowQuickPreview(false);
                                                            toast.success("Settings applied! ⚡", {
                                                                description: "DCA parameters have been auto-filled. The bot will manage the conversion using live exchange rates."
                                                            });
                                                        }}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all text-xs"
                                                    >
                                                        Apply These Settings
                                                    </button>
                                                    <button
                                                        onClick={() => setShowQuickPreview(false)}
                                                        className="px-4 py-2.5 border border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-slate-300 rounded-xl transition-all text-xs"
                                                    >
                                                        Discard
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* DCA Capital Calculator - Show after presets */}
                                {formData.strategy === 'dca' && requiredCapital !== null && (
                                    <div className="col-span-1 md:col-span-2 mb-4">
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-blue-500/20">
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold text-blue-400 mb-1">Capital Requirement</h4>
                                                            <p className="text-xs text-slate-300 mb-2">
                                                                Calculated based on your orders and martingale scaling:
                                                            </p>
                                                            <div className="text-2xl font-bold text-white">
                                                                ${requiredCapital.toFixed(2)}
                                                            </div>
                                                            <div className="text-[10px] text-blue-400 font-mono mt-1 opacity-80">
                                                                Sum of: {formData.parameters.base_order_amount || 100} + ({formData.parameters.max_safety_orders || 5} SOs with {formData.parameters.safety_order_volume_scale || 1.5}x scale)
                                                            </div>
                                                        </div>
                                                        {availableBalance !== null && (
                                                            <div className="text-right">
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Balance</span>
                                                                <div className={cn(
                                                                    "text-lg font-bold",
                                                                    availableBalance >= (requiredCapital || 0) ? "text-green-400" : "text-red-400"
                                                                )}>
                                                                    ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </div>
                                                                {availableBalance < (requiredCapital || 0) && (
                                                                    <span className="text-[10px] text-red-400 font-medium italic block mt-0.5">
                                                                        ⚠️ Insufficient Funds
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-2 border-t border-blue-500/10 pt-2 flex items-center gap-1">
                                                        <Shield className="w-3 h-3 text-blue-500/50" />
                                                        Requires {Math.ceil(requiredCapital)} USDT on {formData.exchange.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        This covers 1 base order + {formData.parameters.max_safety_orders || 5} safety orders with martingale scaling
                                                    </p>
                                                    {formData.parameters.total_amount && parseFloat(formData.parameters.total_amount) < requiredCapital && (
                                                        <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            Warning: Your allocated capital (${parseFloat(formData.parameters.total_amount)}) is insufficient
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(() => {
                                    const templateId = getTemplateId(formData.strategy);
                                    const params = STRATEGY_TEMPLATES[templateId] || [];
                                    const strategy = strategies.find(s => s.id === formData.strategy);

                                    // Split into normal and Guardian params if DCA
                                    let normalParams = params;
                                    let guardianParams: any[] = [];

                                    if (formData.strategy === 'dca') {
                                        const secondaryFieldNames = [
                                            'take_profit_base', 'tp_scale_per_so', 'max_take_profit', 'use_dynamic_tp',
                                            'use_partial_exits', 'use_trailing_tp', 'trailing_activation_pct', 'trailing_callback_pct',
                                            'stop_loss_base', 'use_dynamic_sl', 'sl_tighten_in_trend', 'sl_trail_after_profit',
                                            'use_rsi_filter', 'rsi_period', 'use_adaptive_rsi', 'rsi_oversold_low_vol', 'rsi_overbought_low_vol',
                                            'use_trend_filter', 'pause_so_in_strong_adverse_trend', 'require_trend_weakening',
                                            'max_trade_drawdown_pct', 'daily_loss_limit_usd', 'post_loss_cooldown_minutes', 'pause_on_panic',
                                            'max_slippage_percent', 'check_liquidity_before_order', 'min_liquidity_usd',
                                            'heartbeat_interval_seconds', 'entry_order_type'
                                        ];
                                        normalParams = params.filter(p => !secondaryFieldNames.includes(p.name));
                                        guardianParams = params.filter(p => secondaryFieldNames.includes(p.name));
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Normal Params */}
                                            {normalParams.map((param) => {
                                                // Hide primary exchange parameter (handled in Step 2)
                                                if (strategy?.requirements?.primaryParam === param.name) return null;

                                                // Special handling for Trade Side
                                                if (param.name === 'side') {
                                                    return (
                                                        <div key={param.name} className="col-span-1 md:col-span-2 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 mt-2 mb-2">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                                                                <label className="text-sm font-medium text-slate-200">Trade Side (DCA Direction)</label>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <button
                                                                    onClick={() => updateParameter('side', 'buy')}
                                                                    className={cn(
                                                                        "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center group",
                                                                        formData.parameters.side === 'buy' || !formData.parameters.side
                                                                            ? "bg-green-500/10 border-green-500/50 text-green-400 ring-1 ring-green-500/20"
                                                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                                                                    )}
                                                                >
                                                                    <div className="font-bold mb-0.5 uppercase tracking-wide">Buy (Long)</div>
                                                                    <div className="text-[10px] opacity-70">Accumulate & Sell Higher</div>
                                                                </button>
                                                                <button
                                                                    onClick={() => updateParameter('side', 'sell')}
                                                                    className={cn(
                                                                        "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center group",
                                                                        formData.parameters.side === 'sell'
                                                                            ? "bg-red-500/10 border-red-500/50 text-red-400 ring-1 ring-red-500/20"
                                                                            : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                                                                    )}
                                                                >
                                                                    <div className="font-bold mb-0.5 uppercase tracking-wide">Sell (Short)</div>
                                                                    <div className="text-[10px] opacity-70">Sell & Buy Back Lower</div>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // === ORDER AMOUNT UNIT HANDLING ===
                                                const isOrderAmountField = param.name === 'order_amount' || param.name === 'base_order_amount' || param.name === 'safety_order_amount';

                                                if (isOrderAmountField) {
                                                    // For DCA, we consolidate both base and safety amounts into one section
                                                    if (formData.strategy === 'dca') {
                                                        if (param.name === 'safety_order_amount') return null; // Skip, handled with base_order_amount

                                                        const baseAsset = formData.pair ? formData.pair.split('-')[0] : 'Base Asset';
                                                        const safetyParam = params.find(p => p.name === 'safety_order_amount');

                                                        return (
                                                            <div key="dca_order_amounts" className="col-span-1 md:col-span-2 space-y-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Wallet className="w-4 h-4 text-blue-400" />
                                                                        <label className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                                                                            Order Amounts
                                                                        </label>
                                                                    </div>

                                                                    {/* Unit Toggle */}
                                                                    <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
                                                                        <button
                                                                            onClick={() => setInputUnit('base')}
                                                                            className={cn(
                                                                                "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
                                                                                inputUnit === 'base'
                                                                                    ? "bg-blue-600 text-white shadow-lg"
                                                                                    : "text-slate-500 hover:text-slate-300"
                                                                            )}
                                                                        >
                                                                            {baseAsset}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setInputUnit('quote')}
                                                                            className={cn(
                                                                                "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1",
                                                                                inputUnit === 'quote'
                                                                                    ? "bg-blue-600 text-white shadow-lg"
                                                                                    : "text-slate-500 hover:text-slate-300"
                                                                            )}
                                                                        >
                                                                            USD Value
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* WARNING ALERT */}
                                                                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                                    <div className="text-xs text-blue-200/80">
                                                                        <span className="font-bold text-blue-400">Unit Sync:</span> Trading in
                                                                        <span className="font-bold text-white"> {inputUnit === 'base' ? baseAsset : 'USD Value'} </span>
                                                                        mode. The unit flag will be sent to the bot correctly.
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {/* Base Order Amount */}
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs text-slate-400">{param.label}</label>
                                                                        {inputUnit === 'base' ? (
                                                                            <ParameterInput
                                                                                param={param}
                                                                                value={formData.parameters[param.name]}
                                                                                onChange={(val) => updateParameter(param.name, val)}
                                                                            />
                                                                        ) : (
                                                                            <div className="relative">
                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={formData.parameters[param.name]}
                                                                                    onChange={(e) => updateParameter(param.name, e.target.value)}
                                                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                    placeholder="Amount in USD"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Safety Order Amount */}
                                                                    {safetyParam && (
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs text-slate-400">{safetyParam.label}</label>
                                                                            {inputUnit === 'base' ? (
                                                                                <ParameterInput
                                                                                    param={safetyParam}
                                                                                    value={formData.parameters[safetyParam.name]}
                                                                                    onChange={(val) => updateParameter(safetyParam.name, val)}
                                                                                />
                                                                            ) : (
                                                                                <div className="relative">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={formData.parameters[safetyParam.name]}
                                                                                        onChange={(e) => updateParameter(safetyParam.name, e.target.value)}
                                                                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                        placeholder="Amount in USD"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Shared Price Estimator for USD mode */}
                                                                {inputUnit === 'quote' && (
                                                                    <div className="pt-2 border-t border-slate-800/50">
                                                                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block tracking-wider">Estimated {baseAsset} Price</label>
                                                                        <div className="relative max-w-[200px]">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                                            <input
                                                                                type="number"
                                                                                value={estimatedPrice}
                                                                                onChange={(e) => {
                                                                                    const price = e.target.value;
                                                                                    setEstimatedPrice(price);
                                                                                    const p = parseFloat(price) || 0;
                                                                                    if (p > 0) {
                                                                                        if (quoteAmount) updateParameter(param.name, (parseFloat(quoteAmount) / p).toString());
                                                                                        if (safetyParam && quoteAmountSafety) updateParameter(safetyParam.name, (parseFloat(quoteAmountSafety) / p).toString());
                                                                                    }
                                                                                }}
                                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-6 pr-3 text-xs text-slate-300 focus:outline-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    // ARBITRAGE SPECIAL HANDLING
                                                    if (formData.strategy === 'arbitrage') {
                                                        const holdingAsset = (formData.parameters.holding_asset as string) || 'USDT';
                                                        const amount = parseFloat(formData.parameters.order_amount as string) || 0;
                                                        const isInsufficient = availableBalance !== null && availableBalance < amount;

                                                        return (
                                                            <div key={param.name} className="col-span-1 md:col-span-2 space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                                                                <ParameterInput
                                                                    param={param}
                                                                    value={formData.parameters[param.name]}
                                                                    onChange={(val) => updateParameter(param.name, val)}
                                                                />
                                                                <div className="flex justify-between items-center text-xs px-1">
                                                                    <span className="text-slate-400">Available {holdingAsset}:</span>
                                                                    <span className={cn(
                                                                        "font-mono font-medium",
                                                                        isInsufficient ? "text-red-400" : "text-green-400"
                                                                    )}>
                                                                        {availableBalance !== null ? availableBalance.toFixed(4) : '---'}
                                                                    </span>
                                                                    {isPaperMode && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                toast.info("Paper Trading Balance Management", {
                                                                                    description: "To manage paper balances, please use the 'balance paper' command in the Hummingbot implementation."
                                                                                });
                                                                            }}
                                                                            className="ml-2 px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                                                                        >
                                                                            + Add
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {isInsufficient && (
                                                                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded flex items-center gap-2">
                                                                        <XCircle className="w-3 h-3" />
                                                                        Insufficient balance for trade size.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    // Generic PMM Handling
                                                    const baseAsset = formData.pair ? formData.pair.split('-')[0] : 'Base Asset';

                                                    return (
                                                        <div key={param.name} className="col-span-1 md:col-span-2 space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label className="text-sm font-medium text-slate-300">
                                                                    Order Amount
                                                                </label>

                                                                {/* Unit Toggle */}
                                                                <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
                                                                    <button
                                                                        onClick={() => setInputUnit('base')}
                                                                        className={cn(
                                                                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                                                            inputUnit === 'base'
                                                                                ? "bg-blue-600 text-white shadow-lg"
                                                                                : "text-slate-500 hover:text-slate-300"
                                                                        )}
                                                                    >
                                                                        {baseAsset} Units
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setInputUnit('quote')}
                                                                        className={cn(
                                                                            "px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                                                                            inputUnit === 'quote'
                                                                                ? "bg-blue-600 text-white shadow-lg"
                                                                                : "text-slate-500 hover:text-slate-300"
                                                                        )}
                                                                    >
                                                                        USD Value <ArrowRightLeft className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* WARNING ALERT */}
                                                            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                                <div className="text-xs text-amber-200/80">
                                                                    <span className="font-bold text-amber-400">Critical Warning:</span> The bot uses
                                                                    <span className="font-bold text-white"> {baseAsset} </span>
                                                                    units, NOT USD.
                                                                    {inputUnit === 'base' && (
                                                                        <div className="mt-1">
                                                                            Example: Entering <span className="font-mono bg-amber-500/20 px-1 rounded">100</span> means
                                                                            <span className="font-bold"> 100 {baseAsset}</span> (~${(100 * (parseFloat(estimatedPrice) || 0)).toLocaleString()}).
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {inputUnit === 'base' ? (
                                                                // Standard Input (Base Asset)
                                                                <ParameterInput
                                                                    param={param}
                                                                    value={formData.parameters[param.name]}
                                                                    onChange={(val) => updateParameter(param.name, val)}
                                                                />
                                                            ) : (
                                                                // Conversion UI (USD Input)
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-xs text-slate-500 mb-1 block">Amount in USD</label>
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                                            <input
                                                                                type="number"
                                                                                value={quoteAmount}
                                                                                onChange={(e) => {
                                                                                    const usd = e.target.value;
                                                                                    setQuoteAmount(usd);
                                                                                    const price = parseFloat(estimatedPrice) || 0;
                                                                                    if (price > 0) {
                                                                                        updateParameter(param.name, (parseFloat(usd) / price).toString());
                                                                                    }
                                                                                }}
                                                                                className="w-full bg-slate-950 border border-blue-500/50 rounded-lg py-2 pl-6 pr-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                placeholder="100"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-slate-500 mb-1 block">Est. {baseAsset} Price</label>
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                                            <input
                                                                                type="number"
                                                                                value={estimatedPrice}
                                                                                onChange={(e) => {
                                                                                    const price = e.target.value;
                                                                                    setEstimatedPrice(price);
                                                                                    const p = parseFloat(price) || 0;
                                                                                    if (p > 0 && quoteAmount) {
                                                                                        updateParameter(param.name, (parseFloat(quoteAmount) / p).toString());
                                                                                    }
                                                                                }}
                                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-slate-300 focus:outline-none"
                                                                                placeholder="90000"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Result Preview */}
                                                                    <div className="col-span-2 bg-slate-950 p-2 rounded-lg flex justify-between items-center border border-slate-800">
                                                                        <span className="text-xs text-slate-500">Bot Configuration:</span>
                                                                        <span className="font-mono text-sm font-bold text-green-400">
                                                                            {param.name}: {formData.parameters[param.name] ? Number(formData.parameters[param.name]).toFixed(6) : '0.000000'} {baseAsset}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Standard Parameter
                                                let warning: string | undefined;
                                                const val = formData.parameters[param.name];

                                                // PMM Warnings
                                                if (formData.strategy === 'pmm') {
                                                    if (param.name === 'bid_spread' && val < 0.5) warning = "Spread below 0.5% may result in net loss after fees.";
                                                    if (param.name === 'ask_spread' && val < 0.5) warning = "Spread below 0.5% may result in net loss after fees.";
                                                    if (param.name === 'order_refresh_time' && val < 15) {
                                                        warning = "Fast refresh rates (< 15s) may cause API rate limits.";
                                                    }
                                                }

                                                // Arbitrage Specific Logic
                                                let preInputContent = null;
                                                let postInputContent = null;

                                                if (formData.strategy === 'arbitrage') {
                                                    // Fee Warning
                                                    if (param.name === 'min_profitability') {
                                                        const tradingFeePercent = exchangeFees?.taker || 0.1;
                                                        const feeInfo = calculateFeeInfo(Number(val) || 0, tradingFeePercent);

                                                        postInputContent = (
                                                            <div className="mt-2 space-y-2">
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                                    <Info className="w-3 h-3" />
                                                                    <span>
                                                                        Current exchange fee: <span className="text-blue-400 font-medium">{tradingFeePercent}%</span>
                                                                        {exchangeFees?.source === 'config' && ' (estimated)'}
                                                                    </span>
                                                                </div>

                                                                <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-2 flex justify-between items-center">
                                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Break-even Threshold</span>
                                                                    <span className="text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded">
                                                                        {feeInfo.breakEvenProfit.toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );

                                                        if (!feeInfo.isProfitable) {
                                                            preInputContent = (
                                                                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-3 mb-2">
                                                                    <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                                                                    <div className="text-xs">
                                                                        <div className="text-amber-500 font-bold mb-1 uppercase tracking-wider">Estimated Fee Warning</div>
                                                                        <p className="text-slate-300 leading-relaxed">
                                                                            At <span className="text-amber-400 font-mono">{tradingFeePercent}%</span> fee per trade, the total combined fee for this triangle is <span className="text-amber-400 font-mono">{feeInfo.totalFees.toFixed(2)}%</span>.
                                                                        </p>
                                                                        <p className="text-amber-500/80 mt-1 font-medium">
                                                                            ⚠️ Target profit <span className="underline">{val}%</span> is below the break-even threshold.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                            warning = `Below break-even (${feeInfo.breakEvenProfit.toFixed(2)}%)`;
                                                        }
                                                    }

                                                    // Triangle Validation
                                                    if (param.name === 'holding_asset') {
                                                        const validation = validateTriangle(
                                                            formData.parameters.first_pair as string,
                                                            formData.parameters.second_pair as string,
                                                            formData.parameters.third_pair as string,
                                                            formData.parameters.holding_asset as string
                                                        );

                                                        postInputContent = validation.valid ? (
                                                            <div className="mt-2 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span>Valid Triangle: {validation.assets.join(' → ')}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20 space-y-1">
                                                                {validation.errors.map((err, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <XCircle className="w-3 h-3" />
                                                                        <span>{err}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                }

                                                return (
                                                    <div key={param.name}>
                                                        {preInputContent}
                                                        <ParameterInput
                                                            param={param}
                                                            value={formData.parameters[param.name]}
                                                            onChange={(val) => updateParameter(param.name, val)}
                                                            warning={warning}
                                                        />
                                                        {postInputContent}
                                                    </div>
                                                );
                                            })}

                                            {/* Guardian Section */}
                                            {formData.strategy === 'dca' && guardianParams.length > 0 && (
                                                <div className="col-span-1 md:col-span-2 mt-8 pt-8 border-t border-slate-800/50">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                                            <Shield className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white tracking-wide">Guardian Protection Features (GPP)</h4>
                                                            <p className="text-xs text-slate-500">Advanced risk management controls to protect your capital</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                        {guardianParams.map(param => (
                                                            <ParameterInput
                                                                key={param.name}
                                                                param={param}
                                                                value={formData.parameters[param.name]}
                                                                onChange={(val) => updateParameter(param.name, val)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Risk Management */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-lg font-medium text-white">Risk Management</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Configure protections to manage your trading risk
                            </p>
                        </div>
                        <RiskSettingsForm
                            settings={riskSettings}
                            onChange={setRiskSettings}
                            strategy={formData.strategy}
                        />
                    </div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-medium text-white">Review Deployment</h3>
                        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 space-y-4">
                            <div className="flex justify-between py-2 border-b border-slate-800">
                                <span className="text-slate-400">Bot Name</span>
                                <span className="text-white font-medium">
                                    {formData.name || `${formData.exchange}-${formData.pair}-${formData.strategy}`.toLowerCase()}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800">
                                <span className="text-slate-400">Strategy</span>
                                <span className="text-white font-medium">{strategies.find(s => s.id === formData.strategy)?.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800">
                                <span className="text-slate-400">Exchange</span>
                                <span className="text-white font-medium capitalize">
                                    {formData.exchange.replace(/_/g, ' ')}
                                    {isPaperMode && <span className="text-amber-400 ml-2">(Paper)</span>}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800">
                                <span className="text-slate-400">Connector</span>
                                <span className="font-mono text-sm text-blue-400">
                                    {getConnectorName(formData.exchange)}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-800">
                                <span className="text-slate-400">Trading Pair</span>
                                <span className="text-white font-medium">{formData.pair}</span>
                            </div>
                            {formData.strategy === 'dca' && requiredCapital !== null && (
                                <div className="flex justify-between py-2 border-b border-slate-800 bg-blue-500/5 -mx-6 px-6">
                                    <span className="text-blue-400 font-medium">Capital Commitment</span>
                                    <div className="text-right">
                                        <div className="text-white font-bold">${requiredCapital.toFixed(2)}</div>
                                        {availableBalance !== null && (
                                            <div className={cn(
                                                "text-[10px] font-bold",
                                                availableBalance >= requiredCapital ? "text-green-400" : "text-red-400"
                                            )}>
                                                Available: ${availableBalance.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-slate-800">
                                <span className="text-slate-400">Parameters</span>
                                <div className="text-right space-y-1">
                                    {Object.entries(formData.parameters)
                                        .filter(([_, val]) => val !== null && val !== undefined && val !== '')
                                        .slice(0, 6)
                                        .map(([key, val]) => (
                                            <div key={key} className="text-sm text-slate-300">
                                                <span className="text-slate-500 mr-2 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span className="font-medium">
                                                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                                                </span>
                                            </div>
                                        ))}
                                    {formData.strategy === 'dca' && (formData.parameters.total_amount === null || formData.parameters.total_amount === undefined) && (
                                        <div className="text-sm text-blue-400 font-medium italic">
                                            <span className="text-slate-500 mr-2 capitalize">Total Amount:</span>
                                            Auto-calculated (${requiredCapital?.toFixed(2)})
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Risk Settings Summary */}
                            <div className="flex justify-between py-2">
                                <span className="text-slate-400">Risk Controls</span>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {riskSettings.killSwitchEnabled && (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                                            Kill Switch: {riskSettings.killSwitchMaxLoss}{riskSettings.killSwitchMode === 'percent' ? '%' : '$'}
                                        </span>
                                    )}
                                    {riskSettings.maxDrawdownEnabled && (
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                            Max DD: {riskSettings.maxDrawdownPercent}%
                                        </span>
                                    )}
                                    {riskSettings.dailyLossLimitEnabled && (
                                        <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">
                                            Daily: ${riskSettings.dailyLossLimit}
                                        </span>
                                    )}
                                    {riskSettings.inventorySkewEnabled && (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                            Inv: {riskSettings.inventoryTargetBasePct}%
                                        </span>
                                    )}
                                    {!riskSettings.killSwitchEnabled && !riskSettings.maxDrawdownEnabled &&
                                        !riskSettings.dailyLossLimitEnabled && !riskSettings.inventorySkewEnabled && (
                                            <span className="text-slate-500 text-sm">None configured</span>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Mode Badge - Dynamic based on actual selection */}
                        <div className={cn(
                            "flex items-center gap-2 p-4 rounded-lg border-2",
                            isPaperMode
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-green-500/10 border-green-500/30"
                        )}>
                            <div className={cn(
                                "w-3 h-3 rounded-full animate-pulse",
                                isPaperMode ? "bg-amber-500" : "bg-green-500"
                            )}></div>
                            <div className="flex-1">
                                <span className={cn(
                                    "font-bold",
                                    isPaperMode ? "text-amber-400" : "text-green-400"
                                )}>
                                    {isPaperMode ? "📝 PAPER TRADING" : "⚡ LIVE TRADING"}
                                </span>
                                <p className="text-xs text-slate-400 mt-1">
                                    {isPaperMode
                                        ? "Simulated execution using real market data. No API keys required."
                                        : "Real orders will be placed. Ensure your API keys are configured."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-8 border-t border-slate-800/50 mt-8">
                    <button
                        onClick={handleBack}
                        disabled={step === 1 || isDeploying}
                        className="px-6 py-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                        <button
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            className={cn(
                                "px-8 py-2 rounded-lg font-medium flex items-center shadow-lg transition-all",
                                isDeploying
                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700 shadow-green-900/20"
                            )}
                        >
                            {isDeploying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deploying...
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-4 h-4 mr-2" />
                                    Deploy Bot
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
