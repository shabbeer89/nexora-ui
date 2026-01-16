'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { backendApi } from '@/lib/backend-api';
import { PerformanceEngine } from '@/lib/performance-engine';
import { PerformanceCharts } from '@/components/analytics/PerformanceCharts';
import { TradeExecution } from '@/types/trading';

export default function PerformancePage() {
    const [trades, setTrades] = useState<TradeExecution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const response = await backendApi.get('/trades');
                setTrades(response.data);
            } catch (error) {
                console.error('Failed to fetch trades', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrades();

        // Poll for updates every 5 seconds
        const interval = setInterval(fetchTrades, 5000);
        return () => clearInterval(interval);
    }, []);

    const { equityCurve, monthlyReturns, metrics } = useMemo(() => {
        if (trades.length === 0) {
            return {
                equityCurve: [],
                monthlyReturns: [],
                metrics: new PerformanceEngine().getEmptyMetrics()
            };
        }

        const equityCurve = [];
        const monthlyReturns = [];
        let balance = 10000; // Starting capital

        // Sort trades by timestamp asc
        const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Generate equity curve
        equityCurve.push({ timestamp: sortedTrades[0].timestamp, value: balance }); // Initial point

        sortedTrades.forEach(trade => {
            if (trade.pnl) {
                balance += trade.pnl;
            }
            equityCurve.push({
                timestamp: trade.timestamp,
                value: balance
            });
        });

        // Calculate metrics
        const engine = new PerformanceEngine();
        const metrics = engine.calculateMetrics(sortedTrades, equityCurve.map(e => e.value));

        // Generate monthly returns (simplified)
        const returnsByMonth: Record<string, number> = {};
        sortedTrades.forEach(trade => {
            const date = new Date(trade.timestamp);
            const monthKey = `${date.toLocaleString('default', { month: 'short' })}`;
            if (!returnsByMonth[monthKey]) returnsByMonth[monthKey] = 0;
            if (trade.pnl) returnsByMonth[monthKey] += trade.pnl;
        });

        for (const [month, val] of Object.entries(returnsByMonth)) {
            monthlyReturns.push({
                month,
                return: (val / 10000) * 100 // ROI based on starting capital
            });
        }

        return { equityCurve, monthlyReturns, metrics };
    }, [trades]);

    if (loading) return <div className="text-white">Loading performance data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Performance Analytics</h2>
                    <p className="text-slate-400 mt-1">Real-time performance metrics from your active bots</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-3 py-1 rounded">Refresh</button>
                </div>
            </div>

            {/* Metrics Grid */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-sm">Total Return</div>
                        <div className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {metrics.totalReturn.toFixed(2)}%
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-sm">Win Rate</div>
                        <div className="text-2xl font-bold text-white">
                            {metrics.winRate.toFixed(2)}%
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-sm">Profit Factor</div>
                        <div className="text-2xl font-bold text-white">
                            {metrics.profitFactor.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-sm">Total Trades</div>
                        <div className="text-2xl font-bold text-white">
                            {metrics.tradesCount}
                        </div>
                    </div>
                </div>
            )}

            <PerformanceCharts
                equityCurve={equityCurve}
                monthlyReturns={monthlyReturns}
                metrics={metrics || undefined}
            />
        </div>
    );
}
