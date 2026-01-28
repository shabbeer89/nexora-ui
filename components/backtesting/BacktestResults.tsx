'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3 } from 'lucide-react';

interface BacktestResultsProps {
    results: any;
}

export function BacktestResults({ results }: BacktestResultsProps) {
    if (!results) {
        return (
            <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-12 text-center">
                <BarChart3 className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Run a backtest to see results here
                </p>
            </div>
        );
    }

    // Parse FreqTrade results
    const strategy = results.strategy || {};
    const strategyName = Object.keys(strategy)[0] || 'Unknown';
    const metrics = strategy[strategyName] || {};

    const totalReturn = metrics.profit_total_pct || 0;
    const totalTrades = metrics.total_trades || 0;
    const winRate = metrics.wins ? (metrics.wins / totalTrades * 100) : 0;
    const maxDrawdown = metrics.max_drawdown_pct || 0;
    const sharpeRatio = metrics.sharpe || 0;

    return (
        <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Total Return"
                    value={`${totalReturn.toFixed(2)}%`}
                    positive={totalReturn > 0}
                />
                <MetricCard
                    icon={<Percent className="w-5 h-5" />}
                    label="Win Rate"
                    value={`${winRate.toFixed(1)}%`}
                    positive={winRate > 50}
                />
                <MetricCard
                    icon={<TrendingDown className="w-5 h-5" />}
                    label="Max Drawdown"
                    value={`${maxDrawdown.toFixed(2)}%`}
                    positive={false}
                />
                <MetricCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Sharpe Ratio"
                    value={sharpeRatio.toFixed(2)}
                    positive={sharpeRatio > 1}
                />
            </div>

            {/* Detailed Stats */}
            <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    Detailed Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <StatRow label="Total Trades" value={totalTrades} />
                    <StatRow label="Winning Trades" value={metrics.wins || 0} />
                    <StatRow label="Losing Trades" value={metrics.losses || 0} />
                    <StatRow label="Avg Profit %" value={`${(metrics.profit_mean_pct || 0).toFixed(2)}%`} />
                    <StatRow label="Best Trade %" value={`${(metrics.profit_max_pct || 0).toFixed(2)}%`} />
                    <StatRow label="Worst Trade %" value={`${(metrics.profit_min_pct || 0).toFixed(2)}%`} />
                    <StatRow label="Profit Factor" value={(metrics.profit_factor || 0).toFixed(2)} />
                    <StatRow label="Expectancy" value={(metrics.expectancy || 0).toFixed(2)} />
                </div>
            </div>

            {/* Export Button */}
            <button
                onClick={() => {
                    const dataStr = JSON.stringify(results, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `backtest_results_${Date.now()}.json`;
                    link.click();
                }}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[10px]"
            >
                Export Results (JSON)
            </button>
        </div>
    );
}

function MetricCard({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive: boolean }) {
    return (
        <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-2xl p-4">
            <div className={`mb-2 ${positive ? 'text-green-500' : 'text-red-500'}`}>
                {icon}
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                {label}
            </div>
            <div className={`text-lg font-black ${positive ? 'text-green-500' : 'text-red-500'}`}>
                {value}
            </div>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-slate-500 font-bold">{label}</span>
            <span className="text-white font-black">{value}</span>
        </div>
    );
}
