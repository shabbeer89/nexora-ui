'use client';

import { useEffect, useState, useCallback } from 'react';
import { nexoraAPI, RiskStatus, RiskAlert } from '@/lib/nexora-api';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function RiskMonitoring() {
    const [riskStatus, setRiskStatus] = useState<RiskStatus | null>(null);
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        fetchRiskData();
    }, []);

    const fetchRiskData = async () => {
        try {
            const [status, alerts] = await Promise.all([
                nexoraAPI.getRiskStatus(),
                nexoraAPI.getRiskAlerts(),
            ]);
            setRiskStatus(status);
            setRiskAlerts(alerts.alerts);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch risk data');
        } finally {
            setLoading(false);
        }
    };

    // WebSocket for real-time updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws';
    const { onMessage } = useWebSocket(wsUrl);

    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === 'risk_update') {
                console.log('[RiskMonitoring] Risk Update:', message.data);
                setRiskStatus(message.data);
            }
        });

        return () => unsubscribe();
    }, [onMessage]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getAlertStyle = (level: string) => {
        const styles: Record<string, string> = {
            critical: 'bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
            warning: 'bg-amber-500/20 border-amber-500 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
            info: 'bg-cyan-500/20 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
        };
        return styles[level] || 'bg-slate-500/20 border-slate-500 text-slate-100';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 h-full">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-10 w-48 bg-white/5 rounded-full mb-4"></div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="h-24 bg-white/5 rounded-2xl"></div>
                        <div className="h-24 bg-white/5 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-6">
                <p className="text-red-400 font-medium tracking-tight">PROTECTION SUBSYSTEM OFFLINE: {error}</p>
                <button
                    onClick={fetchRiskData}
                    className="mt-4 px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
                >
                    REBOOT GUARDIAN
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Critical Kill Switch Override */}
            {riskStatus?.kill_switch_active && (
                <div className="relative group overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-red-600 animate-pulse"></div>
                    <div className="relative bg-black/40 backdrop-blur-xl p-8 flex items-center gap-6 border-4 border-red-600/50">
                        <div className="text-5xl animate-bounce">🚨</div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Vault Lockdown</h2>
                            <p className="text-red-200 font-mono text-xs mt-1 uppercase tracking-widest">Protocol: EMERGENCY_HALT | All trade execution suspended</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Core Risk Metrics Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                            <span className="text-xl">🛡️</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Risk Guardian</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-100 border border-red-500/50 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                            onClick={() => {
                                if (confirm('⚠️ CRITICAL: This will close ALL open positions on ALL platforms. Proceed?')) {
                                    alert('Panic Protocol Initiated... (API implementation pending)');
                                }
                            }}
                        >
                            FORCE LIQUIDATE ALL
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Active Protection</span>
                        </div>
                    </div>
                </div>

                {riskStatus && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Global Exposure Gauge */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Exposure</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">{riskStatus.global_exposure_pct.toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500 font-mono"> / {riskStatus.max_exposure_pct}% CAP</span>
                                </div>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/5 p-0.5">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ${riskStatus.global_exposure_pct >= riskStatus.max_exposure_pct * 0.8
                                        ? 'from-red-500 to-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                        : riskStatus.global_exposure_pct >= riskStatus.max_exposure_pct * 0.6
                                            ? 'from-amber-400 to-orange-500'
                                            : 'from-cyan-400 to-blue-500'
                                        }`}
                                    style={{ width: `${Math.min((riskStatus.global_exposure_pct / riskStatus.max_exposure_pct) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Drawdown Monitor */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Drawdown Depth</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">{riskStatus.current_drawdown_pct.toFixed(2)}%</span>
                                    <span className="text-xs text-gray-500 font-mono"> / {riskStatus.max_drawdown_pct}% LIMIT</span>
                                </div>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden border border-white/5 p-0.5">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ${riskStatus.current_drawdown_pct >= riskStatus.max_drawdown_pct * 0.8
                                        ? 'from-red-500 to-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                        : riskStatus.current_drawdown_pct >= riskStatus.max_drawdown_pct * 0.6
                                            ? 'from-amber-400 to-orange-500'
                                            : 'from-emerald-400 to-teal-500'
                                        }`}
                                    style={{ width: `${Math.min((riskStatus.current_drawdown_pct / riskStatus.max_drawdown_pct) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Position Limits and Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/30 backdrop-blur-lg rounded-3xl border border-white/5 p-6 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Channel Thresholds</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="text-[9px] text-gray-500 font-mono uppercase mb-1">Max Clip</div>
                            <div className="text-xl font-black text-white">{riskStatus ? formatCurrency(riskStatus.position_limits.max_position_usd) : '$0'}</div>
                        </div>
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="text-[9px] text-gray-500 font-mono uppercase mb-1">Peak Exposure</div>
                            <div className="text-xl font-black text-purple-400">{riskStatus ? formatCurrency(riskStatus.position_limits.current_largest_position_usd) : '$0'}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/30 backdrop-blur-lg rounded-3xl border border-white/5 p-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Live Alerts Feed</h3>
                    <div className="space-y-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                        {riskAlerts.length > 0 ? (
                            riskAlerts.map((alert, i) => (
                                <div key={i} className={`p-3 rounded-xl border-l-4 font-mono text-[10px] ${getAlertStyle(alert.level)}`}>
                                    <div className="flex justify-between uppercase">
                                        <span>{alert.message}</span>
                                        <span className="opacity-50">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-3 py-4 text-emerald-500/60 font-mono text-[10px] uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                                All Subsystems Nominal / No Anomalies Detected
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Telemetry Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Kill Switch', val: riskStatus?.kill_switch_active ? 'HALTED' : 'NOMINAL', icon: '⚡', color: riskStatus?.kill_switch_active ? 'text-red-500' : 'text-emerald-500' },
                    { label: 'Exposure', val: `${riskStatus?.global_exposure_pct.toFixed(1)}%`, icon: '📈', color: 'text-cyan-400' },
                    { label: 'Drawdown', val: `${riskStatus?.current_drawdown_pct.toFixed(2)}%`, icon: '📉', color: 'text-rose-400' },
                    { label: 'Safety Margin', val: `${(100 - (riskStatus?.global_exposure_pct || 0)).toFixed(0)}%`, icon: '🛡️', color: 'text-amber-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center">
                        <span className="text-2xl mb-2">{stat.icon}</span>
                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className={`text-sm font-black ${stat.color}`}>{stat.val}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
