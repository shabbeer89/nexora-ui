'use client';

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, BarChart3, Clock, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    timestamp: string;
    is_mock?: boolean;
}

export default function NexoraPerformancePage() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8888/api/analytics/performance');
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            const data = await response.json();
            setMetrics(data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch performance metrics:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        // Refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatValue = (value: number, type: 'ratio' | 'percent' | 'currency' | 'number') => {
        if (value === null || value === undefined || isNaN(value)) return '—';
        switch (type) {
            case 'ratio':
                return value.toFixed(2);
            case 'percent':
                return `${(value * 100).toFixed(1)}%`;
            case 'currency':
                return `$${value.toFixed(2)}`;
            case 'number':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    };

    const getMetricsDisplay = () => {
        if (!metrics) return [];
        return [
            {
                label: 'Sharpe Ratio',
                value: formatValue(metrics.sharpe_ratio, 'ratio'),
                trend: metrics.sharpe_ratio > 1 ? '+' : '',
                color: 'text-blue-400',
                tooltip: 'Risk-adjusted return. >1 is good, >2 is excellent.'
            },
            {
                label: 'Sortino Ratio',
                value: formatValue(metrics.sortino_ratio, 'ratio'),
                trend: metrics.sortino_ratio > 1 ? '+' : '',
                color: 'text-purple-400',
                tooltip: 'Downside risk-adjusted return. Higher is better.'
            },
            {
                label: 'Max Drawdown',
                value: formatValue(metrics.max_drawdown, 'percent'),
                trend: metrics.max_drawdown < 0.1 ? 'Low' : 'High',
                color: 'text-rose-400',
                tooltip: 'Largest peak-to-trough decline.'
            },
            {
                label: 'Profit Factor',
                value: formatValue(metrics.profit_factor, 'ratio'),
                trend: metrics.profit_factor > 1.5 ? '+' : '',
                color: 'text-emerald-400',
                tooltip: 'Gross profit / Gross loss. >1.5 is good.'
            }
        ];
    };

    return (
        <div className="space-y-8">
            {/* Performance Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Activity className="w-8 h-8 text-emerald-500" />
                        Alpha Performance <span className="text-emerald-500 font-mono text-sm not-italic ml-2">// REAL-TIME ANALYTICS</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-resolution performance tracking and alpha decay monitoring for active strategies
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {metrics?.is_mock && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-500 uppercase">Mock Data</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5">
                        <Zap className="w-4 h-4 text-cyan-500" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Total Return</span>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest mt-1",
                                loading ? "text-slate-500" : (metrics?.total_return ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {loading ? '...' : formatValue(metrics?.total_return ?? 0, 'percent')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <div>
                        <div className="text-sm font-bold text-rose-400">Failed to load metrics</div>
                        <div className="text-xs text-rose-300/70">{error}</div>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        className="ml-auto px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-bold text-rose-400 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Metrics Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {loading ? (
                    // Loading skeleton
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 animate-pulse">
                            <div className="h-3 bg-slate-700 rounded w-20 mb-3"></div>
                            <div className="h-8 bg-slate-700 rounded w-16 mb-4"></div>
                            <div className="h-2 bg-slate-800 rounded w-24"></div>
                        </div>
                    ))
                ) : (
                    getMetricsDisplay().map((metric, i) => (
                        <div
                            key={i}
                            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-white/20 transition-all"
                            title={metric.tooltip}
                        >
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{metric.label}</div>
                            <div className={cn("text-2xl font-black", metric.color)}>{metric.value}</div>
                            <div className={cn(
                                "mt-4 text-[9px] font-black uppercase tracking-widest",
                                metric.trend.startsWith('+') || metric.trend === 'Low' ? 'text-emerald-500' : 'text-slate-600'
                            )}>
                                {metric.trend} <span className="text-slate-600">Status</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Extended Metrics */}
            {metrics && !loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Rate</div>
                        <div className="text-lg font-black text-white">{formatValue(metrics.win_rate, 'percent')}</div>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Trades</div>
                        <div className="text-lg font-black text-white">{formatValue(metrics.total_trades, 'number')}</div>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Win</div>
                        <div className="text-lg font-black text-emerald-400">{formatValue(metrics.avg_win, 'currency')}</div>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Loss</div>
                        <div className="text-lg font-black text-rose-400">{formatValue(metrics.avg_loss, 'currency')}</div>
                    </div>
                </div>
            )}

            {/* Performance Analytics Integration */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group/container">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>

                <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Equity Curve Telemetry
                    </h4>
                    <div className="flex items-center gap-3">
                        {lastRefresh && (
                            <span className="text-[9px] font-mono text-slate-600">
                                Updated: {lastRefresh.toLocaleTimeString()}
                            </span>
                        )}
                        <span className="text-[9px] font-mono text-emerald-500">LIVE</span>
                    </div>
                </div>

                {/* Analysis UI */}
                <div className="min-h-[300px] flex flex-col items-center justify-center p-12 text-center group">
                    <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:border-emerald-500/30 transition-all duration-700">
                        {loading ? (
                            <Loader2 className="h-10 w-10 text-slate-700 animate-spin" />
                        ) : (
                            <TrendingUp className="h-10 w-10 text-emerald-500" />
                        )}
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">
                        {loading ? 'Loading Performance Data...' : 'Performance Data Loaded'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                        {loading
                            ? 'Fetching real-time analytics from the trading engine...'
                            : `Displaying metrics from ${metrics?.total_trades ?? 0} trades. Equity curve visualization coming soon.`
                        }
                    </p>
                </div>

                {/* Footer Telemetry */}
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-cyan-500" />
                            <span>Refresh: 30s</span>
                        </div>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        disabled={loading}
                        className="flex items-center gap-2 text-cyan-500/80 hover:text-cyan-400 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                        <span className="font-mono tracking-widest uppercase">Force Refresh</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
