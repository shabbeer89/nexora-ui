"use client";

import { useState } from "react";
import { Play, RotateCcw, Settings2, TrendingUp, AlertTriangle, CheckCircle2, FlaskConical } from "lucide-react";
import { cn } from "@/utils/cn";
import { PnLChart } from "@/components/dashboard/PnLChart";
import { toast } from "sonner";

export default function BacktestingPage() {
    const [mode, setMode] = useState<'standard' | 'optimization'>('standard');
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<any>(null);

    // Form State
    const [strategy, setStrategy] = useState('pmm');
    const [exchange, setExchange] = useState('binance');
    const [pair, setPair] = useState('BTC-USDT');
    const [timeRange, setTimeRange] = useState('30d');

    // Params
    const [bidSpread, setBidSpread] = useState('0.1');
    const [askSpread, setAskSpread] = useState('0.1');
    const [refreshTime, setRefreshTime] = useState('30');

    // Optimization Params
    const [bidSpreadMin, setBidSpreadMin] = useState('0.05');
    const [bidSpreadMax, setBidSpreadMax] = useState('0.3');
    const [askSpreadMin, setAskSpreadMin] = useState('0.05');
    const [askSpreadMax, setAskSpreadMax] = useState('0.3');
    const [refreshTimeMin, setRefreshTimeMin] = useState('10');
    const [refreshTimeMax, setRefreshTimeMax] = useState('120');
    const [nTrials, setNTrials] = useState('20');

    // Optimization results
    const [optimizationResults, setOptimizationResults] = useState<any>(null);
    const [optimizationJobId, setOptimizationJobId] = useState<string | null>(null);

    const handleRun = async () => {
        setIsRunning(true);
        setProgress(10); // Initial progress
        setResults(null);

        try {
            // Calculate timestamps
            const end = Date.now() / 1000;
            let start = end - (30 * 24 * 60 * 60); // Default 30d
            if (timeRange === '90d') start = end - (90 * 24 * 60 * 60);
            if (timeRange === 'ytd') start = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;

            const payload = {
                start_time: Math.floor(start),
                end_time: Math.floor(end),
                backtesting_resolution: "1m",
                trade_cost: 0.0006,
                config: {
                    strategy: strategy,
                    exchange: exchange,
                    trading_pair: pair,
                    bid_spread: parseFloat(bidSpread),
                    ask_spread: parseFloat(askSpread),
                    order_refresh_time: parseFloat(refreshTime),
                    order_amount: 100
                }
            };

            setProgress(30);

            const response = await fetch('/api/backtesting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Backtest failed');
            }

            setProgress(90);
            const data = await response.json();

            setResults({
                totalPnL: `${(data.results?.total_pnl * 100).toFixed(2)}%`,
                sharpeRatio: data.results?.sharpe_ratio?.toFixed(2) || '0.00',
                maxDrawdown: `${(data.results?.max_drawdown * 100).toFixed(2)}%`,
                trades: data.results?.total_trades || 0,
                winRate: `${(data.results?.win_rate * 100).toFixed(0)}%`
            });

            toast.success("Backtest completed successfully");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsRunning(false);
            setProgress(100);
        }
    };

    const handleRunOptimization = async () => {
        setIsRunning(true);
        setProgress(10);
        setOptimizationResults(null);

        try {
            // Calculate timestamps
            const end = Date.now() / 1000;
            let start = end - (30 * 24 * 60 * 60);
            if (timeRange === '90d') start = end - (90 * 24 * 60 * 60);
            if (timeRange === 'ytd') start = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;

            const payload = {
                start_time: Math.floor(start),
                end_time: Math.floor(end),
                backtesting_resolution: "1m",
                trade_cost: 0.0006,
                n_trials: parseInt(nTrials),
                config: {
                    strategy: strategy,
                    exchange: exchange,
                    trading_pair: pair,
                    order_amount: 100
                },
                param_ranges: {
                    bid_spread: { min: parseFloat(bidSpreadMin), max: parseFloat(bidSpreadMax) },
                    ask_spread: { min: parseFloat(askSpreadMin), max: parseFloat(askSpreadMax) },
                    order_refresh_time: { min: parseFloat(refreshTimeMin), max: parseFloat(refreshTimeMax) }
                }
            };

            setProgress(30);

            const response = await fetch('/api/backtesting/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Optimization failed');
            }

            const data = await response.json();
            setProgress(90);

            if (data.job_id) {
                setOptimizationJobId(data.job_id);
                // Poll for results
                await pollOptimizationResults(data.job_id);
            } else if (data.results) {
                setOptimizationResults(data.results);
                toast.success("Optimization completed successfully");
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsRunning(false);
            setProgress(100);
        }
    };

    const pollOptimizationResults = async (jobId: string) => {
        let attempts = 0;
        const maxAttempts = 60; // Poll for up to 5 minutes

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`/api/backtesting/optimize/${jobId}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    setOptimizationResults(data.results);
                    toast.success("Optimization completed successfully");
                    break;
                } else if (data.status === 'failed') {
                    toast.error('Optimization failed');
                    break;
                }

                // Update progress
                setProgress(30 + Math.min(attempts * 1, 60));
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            } catch (err) {
                console.error('Polling error:', err);
                break;
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Backtesting & Optimization</h2>
                    <p className="text-slate-400 mt-1">Test strategies against historical data or optimize using AI</p>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setMode('standard')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            mode === 'standard' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Standard Backtest
                    </button>
                    <button
                        onClick={() => setMode('optimization')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center",
                            mode === 'optimization' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <FlaskConical className="w-4 h-4 mr-2" />
                        AI Optimization
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                            <Settings2 className="w-5 h-5 mr-2 text-blue-500" />
                            Configuration
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Strategy</label>
                                <select
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="pmm">Pure Market Making</option>
                                    <option value="xemm">Cross Exchange Mining</option>
                                    <option value="avellaneda">Avellaneda Market Making</option>
                                    <option value="dca">Dollar Cost Averaging</option>
                                    <option value="twap">TWAP</option>
                                    <option value="vwap">VWAP</option>
                                    <option value="arbitrage">Triangular Arbitrage</option>
                                    <option value="liquidity_mining">Liquidity Mining</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Exchange & Pair</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={exchange}
                                        onChange={(e) => setExchange(e.target.value)}
                                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="binance">Binance</option>
                                        <option value="kucoin">KuCoin</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={pair}
                                        onChange={(e) => setPair(e.target.value)}
                                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Time Range</label>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="30d">Last 30 Days</option>
                                    <option value="90d">Last 90 Days</option>
                                    <option value="ytd">Year to Date</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <h4 className="text-sm font-medium text-white mb-3">Strategy Parameters</h4>

                                {mode === 'standard' ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Bid Spread (%)</label>
                                            <input
                                                type="number"
                                                value={bidSpread}
                                                onChange={(e) => setBidSpread(e.target.value)}
                                                className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Ask Spread (%)</label>
                                            <input
                                                type="number"
                                                value={askSpread}
                                                onChange={(e) => setAskSpread(e.target.value)}
                                                className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Order Refresh Time (s)</label>
                                            <input
                                                type="number"
                                                value={refreshTime}
                                                onChange={(e) => setRefreshTime(e.target.value)}
                                                className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                                            <p className="text-xs text-purple-300 flex items-center">
                                                <FlaskConical className="w-3 h-3 mr-1.5" />
                                                Optuna will find the best values within these ranges.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Bid Spread Range (%)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={bidSpreadMin}
                                                    onChange={(e) => setBidSpreadMin(e.target.value)}
                                                    placeholder="Min"
                                                    className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                                />
                                                <input
                                                    type="number"
                                                    value={bidSpreadMax}
                                                    onChange={(e) => setBidSpreadMax(e.target.value)}
                                                    placeholder="Max"
                                                    className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Ask Spread Range (%)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={askSpreadMin}
                                                    onChange={(e) => setAskSpreadMin(e.target.value)}
                                                    placeholder="Min"
                                                    className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                                />
                                                <input
                                                    type="number"
                                                    value={askSpreadMax}
                                                    onChange={(e) => setAskSpreadMax(e.target.value)}
                                                    placeholder="Max"
                                                    className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Refresh Time Range (s)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={refreshTimeMin}
                                                    onChange={(e) => setRefreshTimeMin(e.target.value)}
                                                    placeholder="Min"
                                                    className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                                />
                                                <input
                                                    type="number"
                                                    value={refreshTimeMax}
                                                    onChange={(e) => setRefreshTimeMax(e.target.value)}
                                                    placeholder="Max"
                                                    className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Number of Trials</label>
                                            <input
                                                type="number"
                                                value={nTrials}
                                                onChange={(e) => setNTrials(e.target.value)}
                                                min="5"
                                                max="100"
                                                className="w-full rounded bg-slate-950 border border-slate-800 py-2 px-3 text-sm text-white"
                                            />
                                            <p className="text-xs text-slate-600 mt-1">More trials = better results, but longer time</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={mode === 'optimization' ? handleRunOptimization : handleRun}
                                disabled={isRunning}
                                className={cn(
                                    "w-full flex items-center justify-center py-3 rounded-lg font-medium transition-all mt-4",
                                    isRunning
                                        ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                                        : mode === 'optimization'
                                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                )}
                            >
                                {isRunning ? (
                                    <>
                                        <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                                        Running {mode === 'optimization' ? 'Optimization' : 'Backtest'}...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Run {mode === 'optimization' ? 'Optimization' : 'Backtest'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {isRunning && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 flex flex-col items-center justify-center text-center h-[400px]">
                            <div className="w-full max-w-md space-y-4">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Processing historical data...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className={cn("h-2 rounded-full transition-all duration-500", mode === 'optimization' ? 'bg-purple-500' : 'bg-blue-500')}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500">Backtesting strategy on {pair}...</p>
                            </div>
                        </div>
                    )}

                    {!isRunning && !results && (
                        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 flex flex-col items-center justify-center text-center h-[400px]">
                            <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                                <TrendingUp className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Ready to Backtest</h3>
                            <p className="text-slate-400 max-w-sm mt-2">
                                Configure your strategy parameters on the left and click Run to see performance results using real historical data.
                            </p>
                        </div>
                    )}

                    {results && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                    <p className="text-xs text-slate-400">Total PnL</p>
                                    <p className="text-xl font-bold text-green-500 mt-1">{results.totalPnL}</p>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                    <p className="text-xs text-slate-400">Sharpe Ratio</p>
                                    <p className="text-xl font-bold text-white mt-1">{results.sharpeRatio}</p>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                    <p className="text-xs text-slate-400">Max Drawdown</p>
                                    <p className="text-xl font-bold text-red-500 mt-1">{results.maxDrawdown}</p>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                    <p className="text-xs text-slate-400">Win Rate</p>
                                    <p className="text-xl font-bold text-blue-500 mt-1">{results.winRate}</p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                                <h3 className="text-lg font-medium text-white mb-6">Equity Curve</h3>
                                <PnLChart />
                            </div>

                            {/* Optimization Results */}
                            {mode === 'optimization' && optimizationResults && (
                                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
                                    <div className="flex items-center mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500 mr-2" />
                                        <h3 className="text-lg font-medium text-white">Best Parameters Found</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {optimizationResults.best_params && Object.entries(optimizationResults.best_params).map(([key, value]: [string, any]) => (
                                            <div key={key} className="bg-slate-900/50 rounded-lg p-3">
                                                <p className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                                                <p className="text-lg font-bold text-purple-400 mt-1">
                                                    {typeof value === 'number' ? value.toFixed(4) : value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    {optimizationResults.best_value && (
                                        <div className="mt-4 pt-4 border-t border-slate-800">
                                            <p className="text-sm text-slate-400">Best Score: <span className="text-green-500 font-bold">{optimizationResults.best_value.toFixed(4)}</span></p>
                                            <p className="text-xs text-slate-500 mt-1">Trials completed: {optimizationResults.n_trials || nTrials}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
