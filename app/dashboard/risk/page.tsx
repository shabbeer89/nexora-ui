// Risk Monitoring Dashboard Component
// app/dashboard/risk/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { nexoraAPI } from '@/lib/nexora-api';

export default function RiskDashboard() {
    const [risk, setRisk] = useState<any>(null);
    const [alerts, setAlerts] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [riskData, alertsData] = await Promise.all([
                    nexoraAPI.getRisk(),
                    nexoraAPI.getRiskAlerts()
                ]);

                setRisk(riskData);
                setAlerts(alertsData);
            } catch (error) {
                console.error('Failed to fetch risk data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000); // Update every 3s

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading risk data...</div>
            </div>
        );
    }

    const killSwitchActive = risk?.kill_switch_active;
    const drawdownDanger = risk?.current_drawdown_pct > risk?.max_drawdown_pct * 0.8;
    const exposureDanger = risk?.global_exposure_pct > risk?.max_exposure_pct * 0.8;

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-4xl font-bold">Risk Monitoring</h1>

            {/* Kill Switch Status */}
            <div className={`rounded-2xl p-8 shadow-2xl ${killSwitchActive
                    ? 'bg-gradient-to-br from-red-500 to-red-700 text-white'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-80 mb-2">System Status</p>
                        <h2 className="text-5xl font-bold mb-4">
                            {killSwitchActive ? '🔴 KILL SWITCH ACTIVE' : '✅ OPERATIONAL'}
                        </h2>
                        <p className="text-lg opacity-90">
                            {killSwitchActive
                                ? 'All trading halted - Maximum drawdown exceeded'
                                : 'All systems normal - Trading active'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Risk Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Drawdown Card */}
                <div className={`rounded-2xl p-6 shadow-xl ${drawdownDanger
                        ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
                        : 'bg-white dark:bg-gray-800'
                    }`}>
                    <h3 className="text-xl font-bold mb-4">Drawdown</h3>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">Current</span>
                            <span className={`text-3xl font-bold ${drawdownDanger ? 'text-red-600' : 'text-gray-900 dark:text-white'
                                }`}>
                                {risk?.current_drawdown_pct?.toFixed(2)}%
                            </span>
                        </div>

                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${drawdownDanger ? 'bg-red-600' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${(risk?.current_drawdown_pct / risk?.max_drawdown_pct) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Maximum Allowed</span>
                        <span className="font-semibold">{risk?.max_drawdown_pct?.toFixed(2)}%</span>
                    </div>

                    {drawdownDanger && (
                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                                ⚠️ Warning: Approaching maximum drawdown limit
                            </p>
                        </div>
                    )}
                </div>

                {/* Exposure Card */}
                <div className={`rounded-2xl p-6 shadow-xl ${exposureDanger
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500'
                        : 'bg-white dark:bg-gray-800'
                    }`}>
                    <h3 className="text-xl font-bold mb-4">Portfolio Exposure</h3>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">Current</span>
                            <span className={`text-3xl font-bold ${exposureDanger ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                                }`}>
                                {risk?.global_exposure_pct?.toFixed(1)}%
                            </span>
                        </div>

                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${exposureDanger ? 'bg-yellow-600' : 'bg-green-500'
                                    }`}
                                style={{ width: `${(risk?.global_exposure_pct / risk?.max_exposure_pct) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Maximum Allowed</span>
                        <span className="font-semibold">{risk?.max_exposure_pct?.toFixed(1)}%</span>
                    </div>

                    {exposureDanger && (
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold">
                                ⚠️ Warning: High portfolio exposure
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Position Limits */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold mb-6">Position Limits</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Maximum Position Size</p>
                        <p className="text-3xl font-bold">
                            ${risk?.position_limits?.max_position_usd?.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-2">Current Largest Position</p>
                        <p className="text-3xl font-bold">
                            ${risk?.position_limits?.current_largest_position_usd?.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{
                                width: `${(risk?.position_limits?.current_largest_position_usd / risk?.position_limits?.max_position_usd) * 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold mb-6">Active Risk Alerts</h3>

                {alerts?.alerts?.length > 0 ? (
                    <div className="space-y-3">
                        {alerts.alerts.map((alert: any, index: number) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border-l-4 ${alert.level === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                                        alert.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                                            'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold mb-1">{alert.message}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${alert.level === 'critical' ? 'bg-red-200 text-red-800' :
                                            alert.level === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-blue-200 text-blue-800'
                                        }`}>
                                        {alert.level.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No active alerts</p>
                )}
            </div>

            {/* Data Source */}
            <div className="text-center text-sm text-gray-500">
                Data Source: {risk?.source || 'GlobalRiskManager'}
            </div>
        </div>
    );
}
