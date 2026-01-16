'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiAlertTriangle, FiShield, FiActivity } from 'react-icons/fi';
import { backendApi } from '@/lib/backend-api';

// Raw API response format
interface GuardianStatusRaw {
    is_armed: boolean;
    circuit_breaker_open: boolean;
    circuit_breaker_until: number;
    global_drawdown: number;
    global_velocity: number;
    monitored_bots: number;
    bot_drawdowns: Record<string, number>; // {bot_id: drawdown_percentage}
}

// Normalized format for display
interface BotDrawdown {
    bot_name: string;
    drawdown: number;
    max_drawdown: number;
    breached: boolean;
}

interface GuardianStatus {
    enabled: boolean;
    global_drawdown: number;
    max_global_drawdown: number;
    circuit_breaker_active: boolean;
    bot_drawdowns: BotDrawdown[];
}

// Helper function to normalize API response to display format
function normalizeGuardianStatus(raw: GuardianStatusRaw): GuardianStatus {
    const DEFAULT_MAX_BOT_DRAWDOWN = 3.0; // From GuardianConfig default
    const DEFAULT_MAX_GLOBAL_DRAWDOWN = 5.0; // From GuardianConfig default

    // Convert bot_drawdowns dictionary to array
    const botDrawdownsArray: BotDrawdown[] = Object.entries(raw.bot_drawdowns || {}).map(
        ([bot_id, drawdown]) => ({
            bot_name: bot_id,
            drawdown: drawdown,
            max_drawdown: DEFAULT_MAX_BOT_DRAWDOWN,
            breached: drawdown >= DEFAULT_MAX_BOT_DRAWDOWN
        })
    );

    return {
        enabled: raw.is_armed,
        global_drawdown: raw.global_drawdown ?? 0,
        max_global_drawdown: DEFAULT_MAX_GLOBAL_DRAWDOWN,
        circuit_breaker_active: raw.circuit_breaker_open,
        bot_drawdowns: botDrawdownsArray
    };
}

export default function RiskPage() {
    const [status, setStatus] = useState<GuardianStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const fetchRiskStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await backendApi.get('/risk');
            // Normalize the raw API response to our display format
            const normalizedData = normalizeGuardianStatus(response.data);
            setStatus(normalizedData);
        } catch (err) {
            console.error('Error fetching risk status:', err);
            setError(err instanceof Error ? err.message : 'Failed to load risk status');
        } finally {
            setLoading(false);
        }
    };

    const handleResetCircuitBreaker = async () => {
        if (!confirm('Are you sure you want to reset the circuit breaker?')) return;

        try {
            setResetting(true);
            await backendApi.post('/risk/reset');
            await fetchRiskStatus();
        } catch (err) {
            console.error('Error resetting circuit breaker:', err);
            alert('Failed to reset circuit breaker');
        } finally {
            setResetting(false);
        }
    };

    useEffect(() => {
        fetchRiskStatus();
        const interval = setInterval(fetchRiskStatus, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const getDrawdownPercentage = (current: number, max: number) => {
        return (current / max) * 100;
    };

    const getDrawdownColor = (current: number, max: number) => {
        const percentage = (current / max) * 100;
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-orange-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Risk Management</h1>
                    <p className="text-slate-400 mt-1">
                        Monitor Guardian risk controls and circuit breaker status
                    </p>
                </div>
                <button
                    onClick={fetchRiskStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && !status && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Guardian Status */}
            {status && (
                <>
                    {/* Circuit Breaker Alert */}
                    {status.circuit_breaker_active && (
                        <div className="bg-red-900/20 border border-red-500 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <FiAlertTriangle className="text-red-500 text-2xl mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-red-400 font-semibold text-lg mb-2">
                                        Circuit Breaker Active
                                    </h3>
                                    <p className="text-red-300 mb-4">
                                        All trading has been stopped due to exceeded drawdown limits.
                                        Review the situation before resetting.
                                    </p>
                                    <button
                                        onClick={handleResetCircuitBreaker}
                                        disabled={resetting}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {resetting ? 'Resetting...' : 'Reset Circuit Breaker'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guardian Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Status Card */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FiShield className={`text-2xl ${status.enabled ? 'text-green-500' : 'text-gray-500'}`} />
                                <h3 className="text-white font-semibold">Guardian Status</h3>
                            </div>
                            <div className="text-3xl font-bold mb-2">
                                {status.enabled ? (
                                    <span className="text-green-400">Active</span>
                                ) : (
                                    <span className="text-gray-400">Inactive</span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">
                                {status.enabled ? 'Monitoring all bots' : 'Risk monitoring disabled'}
                            </p>
                        </div>

                        {/* Global Drawdown */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FiActivity className="text-2xl text-blue-500" />
                                <h3 className="text-white font-semibold">Global Drawdown</h3>
                            </div>
                            <div className="mb-4">
                                <div className="text-3xl font-bold text-white mb-1">
                                    {(status.global_drawdown ?? 0).toFixed(2)}%
                                </div>
                                <div className="text-sm text-gray-400">
                                    of {(status.max_global_drawdown ?? 100).toFixed(2)}% limit
                                </div>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getDrawdownColor(status.global_drawdown ?? 0, status.max_global_drawdown ?? 100)}`}
                                    style={{ width: `${Math.min(getDrawdownPercentage(status.global_drawdown ?? 0, status.max_global_drawdown ?? 100), 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Breached Bots */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FiAlertTriangle className="text-2xl text-orange-500" />
                                <h3 className="text-white font-semibold">Breached Bots</h3>
                            </div>
                            <div className="text-3xl font-bold text-white mb-2">
                                {(status.bot_drawdowns ?? []).filter(b => b.breached).length}
                            </div>
                            <p className="text-gray-400 text-sm">
                                of {(status.bot_drawdowns ?? []).length} bot{(status.bot_drawdowns ?? []).length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Bot Drawdowns Table */}
                    {(status.bot_drawdowns ?? []).length > 0 && (
                        <div className="bg-gray-900 rounded-xl border border-gray-800">
                            <div className="p-6 border-b border-gray-800">
                                <h3 className="text-white font-semibold">Per-Bot Drawdowns</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-800/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                                Bot Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                                Drawdown
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                                Limit
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                                Usage
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {(status.bot_drawdowns ?? []).map((bot) => (
                                            <tr key={bot.bot_name} className="hover:bg-gray-800/50">
                                                <td className="px-6 py-4 text-white font-medium">
                                                    {bot.bot_name}
                                                </td>
                                                <td className="px-6 py-4 text-white">
                                                    {(bot.drawdown ?? 0).toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">
                                                    {(bot.max_drawdown ?? 0).toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${getDrawdownColor(bot.drawdown ?? 0, bot.max_drawdown ?? 100)}`}
                                                                style={{ width: `${Math.min(getDrawdownPercentage(bot.drawdown ?? 0, bot.max_drawdown ?? 100), 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-400 w-12 text-right">
                                                            {getDrawdownPercentage(bot.drawdown ?? 0, bot.max_drawdown ?? 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {bot.breached ? (
                                                        <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded-full text-xs font-medium">
                                                            BREACHED
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded-full text-xs font-medium">
                                                            OK
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
