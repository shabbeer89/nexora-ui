'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity, Server, Database, Zap, RefreshCw, CheckCircle2, XCircle,
    AlertTriangle, Loader2, TrendingUp, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceStatus {
    status: 'connected' | 'disconnected' | 'error' | 'not_configured' | 'unknown';
    url?: string;
    is_critical?: boolean;
}

interface ConnectionsResponse {
    overall: 'healthy' | 'degraded';
    services: {
        freqtrade: ServiceStatus;
        hummingbot: ServiceStatus;
        database: ServiceStatus & { type: string };
    };
    exchanges: Record<string, string>;
    timestamp: string;
}

interface TradeCountResponse {
    freqtrade: {
        total: number;
        wins: number;
        losses: number;
        win_rate?: number;
        source: string;
        is_mock: boolean;
    };
    nexora: {
        total: number;
        wins: number;
        losses: number;
        source: string;
        is_mock: boolean;
    };
    combined: {
        total: number;
        wins: number;
        losses: number;
    };
    verified: boolean;
    timestamp: string;
}

export default function SystemHealthPage() {
    const [connections, setConnections] = useState<ConnectionsResponse | null>(null);
    const [tradeCounts, setTradeCounts] = useState<TradeCountResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [connRes, tradeRes] = await Promise.all([
                fetch('http://localhost:8888/api/system/connections'),
                fetch('http://localhost:8888/api/system/trade-count')
            ]);

            if (!connRes.ok || !tradeRes.ok) {
                throw new Error('API request failed');
            }

            const connData = await connRes.json();
            const tradeData = await tradeRes.json();

            setConnections(connData);
            setTradeCounts(tradeData);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Failed to fetch health data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
                return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'disconnected':
                return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'error':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default:
                return <Wifi className="w-5 h-5 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
                return 'border-emerald-500/30 bg-emerald-500/5';
            case 'disconnected':
                return 'border-rose-500/30 bg-rose-500/5';
            case 'error':
                return 'border-amber-500/30 bg-amber-500/5';
            default:
                return 'border-slate-500/30 bg-slate-500/5';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Activity className="w-8 h-8 text-cyan-500" />
                        System Health <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// LIVE STATUS</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Real-time connectivity and verified trade counts from production databases
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {connections && (
                        <div className={cn(
                            "px-4 py-2 rounded-xl border",
                            connections.overall === 'healthy'
                                ? 'border-emerald-500/30 bg-emerald-500/10'
                                : 'border-amber-500/30 bg-amber-500/10'
                        )}>
                            <span className={cn(
                                "text-xs font-black uppercase",
                                connections.overall === 'healthy' ? 'text-emerald-400' : 'text-amber-400'
                            )}>
                                {connections.overall === 'healthy' ? '● All Systems Operational' : '⚠ Degraded'}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-slate-900/40 border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-rose-500" />
                    <div>
                        <div className="text-sm font-bold text-rose-400">Connection Failed</div>
                        <div className="text-xs text-rose-300/70">{error}</div>
                    </div>
                </div>
            )}

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 animate-pulse">
                            <div className="h-4 bg-slate-700 rounded w-24 mb-4"></div>
                            <div className="h-8 bg-slate-700 rounded w-20"></div>
                        </div>
                    ))
                ) : connections && (
                    <>
                        {/* FreqTrade */}
                        <div className={cn(
                            "border rounded-2xl p-6 transition-all",
                            getStatusColor(connections.services.freqtrade.status)
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Server className="w-5 h-5 text-slate-400" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">FreqTrade</span>
                                </div>
                                {getStatusIcon(connections.services.freqtrade.status)}
                            </div>
                            <div className="text-lg font-black text-white uppercase mb-1">
                                {connections.services.freqtrade.status}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                {connections.services.freqtrade.url}
                            </div>
                            {connections.services.freqtrade.is_critical && (
                                <div className="mt-3 text-[9px] font-black text-amber-500 uppercase">● Critical Service</div>
                            )}
                        </div>

                        {/* Hummingbot */}
                        <div className={cn(
                            "border rounded-2xl p-6 transition-all",
                            getStatusColor(connections.services.hummingbot.status)
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-slate-400" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hummingbot</span>
                                </div>
                                {getStatusIcon(connections.services.hummingbot.status)}
                            </div>
                            <div className="text-lg font-black text-white uppercase mb-1">
                                {connections.services.hummingbot.status}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                {connections.services.hummingbot.url}
                            </div>
                        </div>

                        {/* Database */}
                        <div className={cn(
                            "border rounded-2xl p-6 transition-all",
                            getStatusColor(connections.services.database.status)
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Database className="w-5 h-5 text-slate-400" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Database</span>
                                </div>
                                {getStatusIcon(connections.services.database.status)}
                            </div>
                            <div className="text-lg font-black text-white uppercase mb-1">
                                {connections.services.database.status}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase">
                                Type: {connections.services.database.type}
                            </div>
                            {connections.services.database.is_critical && (
                                <div className="mt-3 text-[9px] font-black text-amber-500 uppercase">● Critical Service</div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Verified Trade Counts */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] -mr-24 -mt-24"></div>

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-500" />
                        Verified Trade Counts
                    </h3>
                    {tradeCounts && (
                        <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-1 rounded",
                            tradeCounts.verified
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-amber-400 bg-amber-500/10"
                        )}>
                            {tradeCounts.verified ? '✓ Verified from DB' : '⚠ Mock Data'}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                    </div>
                ) : tradeCounts && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* FreqTrade Trades */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">FreqTrade Engine</div>
                            <div className="text-3xl font-black text-white mb-2">{tradeCounts.freqtrade.total}</div>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="text-emerald-400">{tradeCounts.freqtrade.wins} Wins</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-rose-400">{tradeCounts.freqtrade.losses} Losses</span>
                            </div>
                            {tradeCounts.freqtrade.win_rate !== undefined && (
                                <div className="mt-2 text-xs text-cyan-400 font-bold">{tradeCounts.freqtrade.win_rate}% Win Rate</div>
                            )}
                            <div className="mt-3 text-[8px] text-slate-600 font-mono truncate" title={tradeCounts.freqtrade.source}>
                                {tradeCounts.freqtrade.source.split('/').pop()}
                            </div>
                        </div>

                        {/* Nexora Trades */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nexora Orchestrator</div>
                            <div className="text-3xl font-black text-white mb-2">{tradeCounts.nexora.total}</div>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="text-emerald-400">{tradeCounts.nexora.wins} Wins</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-rose-400">{tradeCounts.nexora.losses} Losses</span>
                            </div>
                            <div className="mt-3 text-[8px] text-slate-600 font-mono">
                                {tradeCounts.nexora.source}
                            </div>
                        </div>

                        {/* Combined */}
                        <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-5">
                            <div className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2">Combined Total</div>
                            <div className="text-3xl font-black text-white mb-2">{tradeCounts.combined.total}</div>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="text-emerald-400">{tradeCounts.combined.wins} Wins</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-rose-400">{tradeCounts.combined.losses} Losses</span>
                            </div>
                            {tradeCounts.combined.total > 0 && (
                                <div className="mt-2 text-xs text-cyan-400 font-bold">
                                    {((tradeCounts.combined.wins / tradeCounts.combined.total) * 100).toFixed(1)}% Win Rate
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono">
                        {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
                    </span>
                    <span className="font-black uppercase tracking-widest">Auto-refresh: 15s</span>
                </div>
            </div>
        </div>
    );
}
