// Regime Dashboard Component
// app/dashboard/regime/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { nexoraAPI } from '@/lib/nexora-api';

export default function RegimeDashboard() {
    const [regime, setRegime] = useState<any>(null);
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [regimeData, historyData] = await Promise.all([
                    nexoraAPI.getRegime(),
                    nexoraAPI.getRegimeHistory(100)
                ]);

                setRegime(regimeData);
                setHistory(historyData);
            } catch (error) {
                console.error('Failed to fetch regime data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Update every 10s

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading regime data...</div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-4xl font-bold">Market Regime Dashboard</h1>

            {/* Current Regime Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-80 mb-2">Current Regime</p>
                        <h2 className="text-5xl font-bold mb-4">{regime?.regime}</h2>
                        <p className="text-lg opacity-90">{regime?.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-80 mb-2">Strength</p>
                        <div className="text-6xl font-bold">{(regime?.strength * 100).toFixed(0)}%</div>
                        <div className="mt-4 w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-500"
                                style={{ width: `${regime?.strength * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-sm opacity-80">
                        Last Updated: {new Date(regime?.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                        Source: {regime?.source || 'Orchestrator'}
                    </p>
                </div>
            </div>

            {/* Regime History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold mb-6">Regime History</h3>

                <div className="space-y-4">
                    {history?.history?.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-3 h-3 rounded-full ${item.regime === 'MOMENTUM' ? 'bg-green-500' :
                                        item.regime === 'MEAN_REVERSION' ? 'bg-blue-500' :
                                            item.regime === 'BREAKOUT' ? 'bg-purple-500' :
                                                'bg-gray-500'
                                    }`} />
                                <div>
                                    <p className="font-semibold">{item.regime}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="font-semibold">{item.duration_minutes} min</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trading Implications */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <span className="text-2xl mr-2">💡</span>
                    Trading Implications
                </h3>
                <div className="space-y-2">
                    {regime?.regime === 'MOMENTUM' && (
                        <>
                            <p>✅ Trend following strategies active</p>
                            <p>✅ Look for breakout opportunities</p>
                            <p>⚠️ Avoid mean reversion trades</p>
                        </>
                    )}
                    {regime?.regime === 'MEAN_REVERSION' && (
                        <>
                            <p>✅ Range-bound strategies active</p>
                            <p>✅ Buy support, sell resistance</p>
                            <p>⚠️ Avoid trend following</p>
                        </>
                    )}
                    {regime?.regime === 'BREAKOUT' && (
                        <>
                            <p>✅ Volatility expansion detected</p>
                            <p>✅ Breakout strategies active</p>
                            <p>⚠️ Use wider stops</p>
                        </>
                    )}
                    {regime?.regime === 'CONSOLIDATION' && (
                        <>
                            <p>✅ Market making strategies active</p>
                            <p>✅ Low volatility environment</p>
                            <p>⚠️ Wait for clearer signals</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
