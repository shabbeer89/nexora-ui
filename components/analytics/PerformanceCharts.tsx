'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { PerformanceMetrics } from '@/lib/performance-engine';

interface PerformanceChartsProps {
    equityCurve: { timestamp: number; value: number }[];
    monthlyReturns: { month: string; return: number }[];
    metrics: PerformanceMetrics;
}

export function PerformanceCharts({ equityCurve, monthlyReturns, metrics }: PerformanceChartsProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-900 p-4 rounded-xl border border-gray-800 h-24" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 h-[300px]" />
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 h-[300px]" />
            </div>
        </div>;
    }

    return (
        <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Sharpe Ratio"
                    value={metrics.sharpeRatio.toFixed(2)}
                    color={metrics.sharpeRatio > 1 ? 'text-green-500' : 'text-yellow-500'}
                />
                <MetricCard
                    label="Profit Factor"
                    value={metrics.profitFactor.toFixed(2)}
                    color={metrics.profitFactor > 1.5 ? 'text-green-500' : 'text-gray-200'}
                />
                <MetricCard
                    label="Win Rate"
                    value={`${metrics.winRate.toFixed(1)}%`}
                    color={metrics.winRate > 50 ? 'text-green-500' : 'text-red-500'}
                />
                <MetricCard
                    label="Max Drawdown"
                    value={`-${metrics.maxDrawdown.toFixed(2)}%`}
                    color="text-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Equity Curve */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Equity Curve</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={equityCurve}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                    stroke="#9ca3af"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorEquity)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Returns */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Monthly Returns</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyReturns}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                                    formatter={(value: any) => [`${Number(value || 0)}%`, 'Return']}
                                />
                                <Bar dataKey="return">
                                    {monthlyReturns.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#22c55e' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
    );
}
