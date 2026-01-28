'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Award, BarChart3 } from 'lucide-react';
import { nexoraAPI } from '@/lib/nexora-api';

interface PerformanceMetrics {
    total_return: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
    max_drawdown: number;
    win_rate: number;
    profit_factor: number;
    total_trades: number;
    avg_win: number;
    avg_loss: number;
    largest_win: number;
    largest_loss: number;
    avg_trade_duration_hours: number;
}

export default function PerformanceAnalytics() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const data = await nexoraAPI.getAnalyticsPerformance();
            setMetrics(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch performance metrics:', error);
            // Fallback metrics to avoid UI crash
            setMetrics({
                total_return: 0,
                sharpe_ratio: 0,
                sortino_ratio: 0,
                calmar_ratio: 0,
                max_drawdown: 0,
                win_rate: 0,
                profit_factor: 0,
                total_trades: 0,
                avg_win: 0,
                avg_loss: 0,
                largest_win: 0,
                largest_loss: 0,
                avg_trade_duration_hours: 0
            });
            setLoading(false);
        }
    };

    const getRatioColor = (ratio: number, threshold: number = 1.0) => {
        if (ratio >= threshold * 1.5) return 'text-emerald-400';
        if (ratio >= threshold) return 'text-cyan-400';
        if (ratio >= threshold * 0.5) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-24 bg-slate-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-cyan-400" />
                        Performance Analytics
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Institutional-Grade Metrics
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400">Total Trades</div>
                    <div className="text-2xl font-black text-white">{metrics.total_trades}</div>
                </div>
            </div>

            {/* Key Ratios */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Sharpe Ratio */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase">Sharpe Ratio</span>
                        <Award className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className={`text-3xl font-black ${getRatioColor(metrics?.sharpe_ratio || 0, 1.0)}`}>
                        {(metrics?.sharpe_ratio || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {(metrics?.sharpe_ratio || 0) >= 2.0 ? 'Excellent' : (metrics?.sharpe_ratio || 0) >= 1.0 ? 'Good' : 'Poor'}
                    </div>
                </div>

                {/* Sortino Ratio */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-cyan-400 uppercase">Sortino Ratio</span>
                        <Target className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className={`text-3xl font-black ${getRatioColor(metrics?.sortino_ratio || 0, 1.5)}`}>
                        {(metrics?.sortino_ratio || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Downside Risk Adjusted
                    </div>
                </div>

                {/* Calmar Ratio */}
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase">Calmar Ratio</span>
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className={`text-3xl font-black ${getRatioColor(metrics?.calmar_ratio || 0, 3.0)}`}>
                        {(metrics?.calmar_ratio || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Return / Max DD
                    </div>
                </div>

                {/* Max Drawdown */}
                <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-400 uppercase">Max Drawdown</span>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-3xl font-black text-red-400">
                        -{((metrics?.max_drawdown || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        Peak to Trough
                    </div>
                </div>
            </div>

            {/* Win Rate & Profit Factor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Win Rate */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Win Rate</h3>
                        <span className={`text-2xl font-black ${(metrics?.win_rate || 0) >= 0.6 ? 'text-emerald-400' : (metrics?.win_rate || 0) >= 0.5 ? 'text-cyan-400' : 'text-yellow-400'}`}>
                            {((metrics?.win_rate || 0) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-600 transition-all duration-500"
                            style={{ width: `${(metrics?.win_rate || 0) * 100}%` }}
                        ></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-slate-400">Avg Win</div>
                            <div className="text-emerald-400 font-bold">${(metrics?.avg_win || 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-slate-400">Avg Loss</div>
                            <div className="text-red-400 font-bold">${Math.abs(metrics?.avg_loss || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Profit Factor */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Profit Factor</h3>
                        <span className={`text-2xl font-black ${getRatioColor(metrics?.profit_factor || 0, 1.5)}`}>
                            {(metrics?.profit_factor || 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-4">
                        Gross Profit / Gross Loss
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-slate-400">Best Trade</div>
                            <div className="text-emerald-400 font-bold">${(metrics?.largest_win || 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-slate-400">Worst Trade</div>
                            <div className="text-red-400 font-bold">${Math.abs(metrics?.largest_loss || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Total Return</div>
                    <div className={`text-2xl font-black ${metrics.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {metrics.total_return >= 0 ? '+' : ''}{(metrics.total_return * 100).toFixed(2)}%
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Avg Trade Duration</div>
                    <div className="text-2xl font-black text-cyan-400">
                        {(metrics?.avg_trade_duration_hours || 0).toFixed(1)}h
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Total Trades</div>
                    <div className="text-2xl font-black text-white">
                        {metrics.total_trades}
                    </div>
                </div>
            </div>
        </div>
    );
}
