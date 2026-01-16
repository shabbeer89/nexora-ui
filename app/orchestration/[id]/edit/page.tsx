"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save, Loader2, AlertCircle, TrendingDown, TrendingUp, DollarSign, Calculator, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { backendApi } from "@/lib/backend-api";
import Link from "next/link";

export default function EditBotPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [botInfo, setBotInfo] = useState<any>(null);

    // Form state - will be populated based on strategy
    const [formData, setFormData] = useState<any>({});
    const [strategy, setStrategy] = useState<string>('');

    // DCA Quick Setup state
    const [showQuickSetup, setShowQuickSetup] = useState(false);
    const [quickSetup, setQuickSetup] = useState({
        totalInvestment: '',
        targetProfit: '',
        stopLoss: ''
    });
    const [recommendedConfig, setRecommendedConfig] = useState<any>(null);

    // Fetch existing bot config
    useEffect(() => {
        async function fetchBotConfig() {
            try {
                // Fetch bot details
                const botResponse = await backendApi.get(`/bots/${botId}`);
                const bot = botResponse.data;
                setBotInfo(bot);

                // Fetch config
                const configName = bot.name || botId;
                const configResponse = await backendApi.get(`/scripts/configs/${configName}`);
                const data = configResponse.data;
                setConfig(data);

                // Detect strategy
                const detectedStrategy = data.script_file_name?.replace('.py', '') ||
                    data.strategy ||
                    bot.strategy ||
                    'production_dca_strategy';
                setStrategy(detectedStrategy);

                // Populate form based on strategy
                if (detectedStrategy.includes('dca')) {
                    setFormData({
                        side: data.side || 'buy', // Buy or Sell
                        base_order_amount: data.base_order_amount || 10,
                        safety_order_amount: data.safety_order_amount || 20,
                        max_safety_orders: data.max_safety_orders || 5,
                        price_deviation: data.price_deviation || 1.0,
                        safety_order_step_scale: data.safety_order_step_scale || 1.5,
                        safety_order_volume_scale: data.safety_order_volume_scale || 1.5,
                        take_profit: data.take_profit || 1.5,
                        stop_loss: data.stop_loss || 5.0,
                        trailing_stop_activation: data.trailing_stop_activation || 0.5,
                        trailing_stop_callback: data.trailing_stop_callback || 0.3,
                        base_order_unit: data.base_order_unit || 'usdt',
                        safety_order_unit: data.safety_order_unit || 'usdt',
                        total_investment_amount: data.total_investment_amount || 100,

                        // Advanced params
                        max_active_orders: data.max_active_orders || 6,
                        cooldown_time: data.cooldown_time || 0,
                        max_open_deals: data.max_open_deals || 1,
                    });
                } else {
                    // PMM or other strategies
                    setFormData({
                        bid_spread: data.bid_spread || 0.1,
                        ask_spread: data.ask_spread || 0.1,
                        order_amount: data.order_amount || 100,
                        order_refresh_time: data.order_refresh_time || 15,
                    });
                }

                setLoading(false);
            } catch (error: any) {
                console.error('[EditBot] Failed to fetch config:', error);
                toast.error('Failed to load bot configuration');
                router.push(`/orchestration/${botId}`);
            }
        }

        fetchBotConfig();
    }, [botId, router]);

    const updateParameter = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    // DCA Quick Setup Calculator
    const calculateRecommendedSettings = () => {
        const totalInvestment = parseFloat(quickSetup.totalInvestment);
        const targetProfit = parseFloat(quickSetup.targetProfit);
        const stopLoss = parseFloat(quickSetup.stopLoss);

        if (!totalInvestment || !targetProfit || !stopLoss) {
            toast.error('Please fill all Quick Setup fields');
            return;
        }

        // Smart calculation
        const baseOrder = totalInvestment * 0.15; // 15% for base
        const maxSafetyOrders = 5;
        const remainingCapital = totalInvestment - baseOrder;
        const safetyOrder = remainingCapital / (maxSafetyOrders * 1.5); // Account for volume scale

        setRecommendedConfig({
            base_order_amount: Number(baseOrder.toFixed(2)),
            safety_order_amount: Number(safetyOrder.toFixed(2)),
            max_safety_orders: maxSafetyOrders,
            take_profit: targetProfit,
            stop_loss: stopLoss,
            price_deviation: 1.0,
            safety_order_step_scale: 1.5,
            safety_order_volume_scale: 1.5,
            total_investment_amount: totalInvestment
        });

        toast.success('Recommended settings calculated!');
    };

    const applyRecommendedSettings = () => {
        if (!recommendedConfig) return;

        setFormData((prev: any) => ({
            ...prev,
            ...recommendedConfig
        }));

        setShowQuickSetup(false);
        setRecommendedConfig(null);
        toast.success('Settings applied! Review and save.');
    };

    const handleSave = useCallback(async () => {
        setSaving(true);
        const loadingToast = toast.loading('Saving configuration...');

        try {
            // Merge form data with existing config
            const updatedConfig = {
                ...config,
                ...formData
            };

            const configName = botInfo?.name || botId;
            await backendApi.post(`/scripts/configs/${configName}`, updatedConfig);

            toast.dismiss(loadingToast);
            toast.success('Configuration saved! ✅', {
                description: 'Restart the bot for changes to take effect'
            });

            setTimeout(() => {
                router.push(`/orchestration/${botId}`);
            }, 1000);

        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error('Failed to save configuration', {
                description: error.response?.data?.error || error.message
            });
            setSaving(false);
        }
    }, [formData, config, botId, botInfo, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const isDCA = strategy.includes('dca');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/orchestration/${botId}`}
                    className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-white">Edit Bot Configuration</h2>
                    <p className="text-slate-400 mt-1">{botInfo?.name || botId} • {strategy.toUpperCase()}</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-400">Important</p>
                        <p className="text-sm mt-1 text-blue-300">
                            The bot must be stopped to apply changes. After saving, restart the bot for changes to take effect.
                        </p>
                    </div>
                </div>
            </div>

            {isDCA && (
                <>
                    {/* DCA Quick Setup Wizard */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
                        <button
                            onClick={() => setShowQuickSetup(!showQuickSetup)}
                            className="w-full flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white">DCA Quick Setup Wizard</h3>
                                    <p className="text-sm text-purple-300">Let AI calculate optimal settings for you</p>
                                </div>
                            </div>
                            <Calculator className={cn("w-5 h-5 text-purple-400 transition-transform", showQuickSetup && "rotate-180")} />
                        </button>

                        {showQuickSetup && (
                            <div className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-purple-300 mb-2">Total Investment ($)</label>
                                        <input
                                            type="number"
                                            value={quickSetup.totalInvestment}
                                            onChange={(e) => setQuickSetup(prev => ({ ...prev, totalInvestment: e.target.value }))}
                                            className="w-full rounded-lg bg-slate-950 border border-purple-500/30 py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
                                            placeholder="e.g. 1000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-green-300 mb-2">Target Profit (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={quickSetup.targetProfit}
                                            onChange={(e) => setQuickSetup(prev => ({ ...prev, targetProfit: e.target.value }))}
                                            className="w-full rounded-lg bg-slate-950 border border-green-500/30 py-3 px-4 text-white focus:border-green-500 focus:outline-none"
                                            placeholder="e.g. 2.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-red-300 mb-2">Stop Loss (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={quickSetup.stopLoss}
                                            onChange={(e) => setQuickSetup(prev => ({ ...prev, stopLoss: e.target.value }))}
                                            className="w-full rounded-lg bg-slate-950 border border-red-500/30 py-3 px-4 text-white focus:border-red-500 focus:outline-none"
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={calculateRecommendedSettings}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Calculate Recommended Settings
                                </button>

                                {recommendedConfig && (
                                    <div className="bg-slate-950/50 border border-purple-500/30 rounded-lg p-4 space-y-3">
                                        <h4 className="font-bold text-purple-300">Recommended Configuration:</h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><span className="text-slate-400">Base Order:</span> <span className="text-white font-mono">${recommendedConfig.base_order_amount}</span></div>
                                            <div><span className="text-slate-400">Safety Order:</span> <span className="text-white font-mono">${recommendedConfig.safety_order_amount}</span></div>
                                            <div><span className="text-slate-400">Max Safety Orders:</span> <span className="text-white font-mono">{recommendedConfig.max_safety_orders}</span></div>
                                            <div><span className="text-slate-400">Take Profit:</span> <span className="text-green-400 font-mono">{recommendedConfig.take_profit}%</span></div>
                                            <div><span className="text-slate-400">Stop Loss:</span> <span className="text-red-400 font-mono">{recommendedConfig.stop_loss}%</span></div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={applyRecommendedSettings}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                                            >
                                                Apply Settings
                                            </button>
                                            <button
                                                onClick={() => setRecommendedConfig(null)}
                                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DCA Configuration */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-blue-500" />
                                DCA Strategy Parameters
                            </h3>

                            {/* Side Selector */}
                            <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-700">
                                <button
                                    onClick={() => updateParameter('side', 'buy')}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        formData.side === 'buy'
                                            ? "bg-green-600 text-white shadow-lg"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    🟢 Buy (Long)
                                </button>
                                <button
                                    onClick={() => updateParameter('side', 'sell')}
                                    className={cn(
                                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        formData.side === 'sell'
                                            ? "bg-red-600 text-white shadow-lg"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    🔴 Sell (Short)
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Base Order */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Base Order Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.base_order_amount}
                                    onChange={(e) => updateParameter('base_order_amount', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Safety Order */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Safety Order Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.safety_order_amount}
                                    onChange={(e) => updateParameter('safety_order_amount', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Max Safety Orders */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Max Safety Orders</label>
                                <input
                                    type="number"
                                    value={formData.max_safety_orders}
                                    onChange={(e) => updateParameter('max_safety_orders', parseInt(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Price Deviation */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Price Deviation (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.price_deviation}
                                    onChange={(e) => updateParameter('price_deviation', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Take Profit */}
                            <div>
                                <label className="block text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Take Profit (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.take_profit}
                                    onChange={(e) => updateParameter('take_profit', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-green-500/30 py-3 px-4 text-white focus:border-green-500 focus:outline-none"
                                />
                            </div>

                            {/* Stop Loss */}
                            <div>
                                <label className="block text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4" />
                                    Stop Loss (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.stop_loss}
                                    onChange={(e) => updateParameter('stop_loss', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-red-500/30 py-3 px-4 text-white focus:border-red-500 focus:outline-none"
                                />
                            </div>

                            {/* Step Scale */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Safety Order Step Scale</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.safety_order_step_scale}
                                    onChange={(e) => updateParameter('safety_order_step_scale', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Volume Scale */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Safety Order Volume Scale</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.safety_order_volume_scale}
                                    onChange={(e) => updateParameter('safety_order_volume_scale', parseFloat(e.target.value))}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!isDCA && (
                /* PMM Configuration */
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
                    <h3 className="text-lg font-medium text-white">PMM Strategy Parameters</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Bid Spread (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.bid_spread}
                                onChange={(e) => updateParameter('bid_spread', parseFloat(e.target.value))}
                                className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Ask Spread (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.ask_spread}
                                onChange={(e) => updateParameter('ask_spread', parseFloat(e.target.value))}
                                className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Order Amount (USDT)</label>
                            <input
                                type="number"
                                value={formData.order_amount}
                                onChange={(e) => updateParameter('order_amount', parseFloat(e.target.value))}
                                className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Refresh Time (seconds)</label>
                            <input
                                type="number"
                                value={formData.order_refresh_time}
                                onChange={(e) => updateParameter('order_refresh_time', parseInt(e.target.value))}
                                className="w-full rounded-lg bg-slate-950 border border-slate-800 py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-800">
                <Link
                    href={`/orchestration/${botId}`}
                    className="px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </Link>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "px-8 py-3 rounded-lg font-medium flex items-center transition-all",
                        saving
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    )}
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
