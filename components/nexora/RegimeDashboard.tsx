'use client';

import { useEffect, useState, useCallback } from 'react';
import { nexoraAPI, Regime, RegimeHistory } from '@/lib/nexora-api';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function RegimeDashboard() {
    const [currentRegime, setCurrentRegime] = useState<Regime | null>(null);
    const [regimeHistory, setRegimeHistory] = useState<RegimeHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        fetchRegimeData();
    }, []);

    const fetchRegimeData = async () => {
        try {
            const [regime, history] = await Promise.all([
                nexoraAPI.getCurrentRegime(),
                nexoraAPI.getRegimeHistory(20),
            ]);
            setCurrentRegime(regime);
            setRegimeHistory(history);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch regime data');
        } finally {
            setLoading(false);
        }
    };

    // WebSocket for real-time updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://64.227.151.249:8888/ws';
    const { onMessage } = useWebSocket(wsUrl);

    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === 'regime_update') {
                console.log('[RegimeDashboard] Received real-time update:', message.data);
                setCurrentRegime(message.data);

                // Prepend to history if it's a new timestamp
                setRegimeHistory(prev => {
                    if (!prev) return prev;
                    // Check if already in history to avoid duplicates
                    const isDuplicate = prev.history.some(h => h.timestamp === message.data.timestamp);
                    if (isDuplicate) return prev;

                    return {
                        ...prev,
                        history: [message.data, ...prev.history].slice(0, 20)
                    };
                });
            }
        });

        return () => unsubscribe();
    }, [onMessage]);

    const getRegimeColor = (regime: string) => {
        const colors: Record<string, string> = {
            MOMENTUM: 'from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
            MEAN_REVERSION: 'from-purple-500 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
            BREAKOUT: 'from-pink-500 to-rose-600 shadow-[0_0_15px_rgba(236,72,153,0.5)]',
            CONSOLIDATION: 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]',
        };
        return colors[regime] || 'from-gray-500 to-gray-700';
    };

    const getRegimeIcon = (regime: string) => {
        const icons: Record<string, string> = {
            MOMENTUM: '📈',
            MEAN_REVERSION: '↔️',
            BREAKOUT: '🚀',
            CONSOLIDATION: '📊',
        };
        return icons[regime] || '❓';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 h-full">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 bg-cyan-500/20 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-6">
                <p className="text-red-400 font-medium">System Error: {error}</p>
                <button
                    onClick={fetchRegimeData}
                    className="mt-4 px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                    Initialize Recovery
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Regime Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <span className="text-6xl">{currentRegime && getRegimeIcon(currentRegime.regime)}</span>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white/90 tracking-tight flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Market Intel
                        </h2>
                        <span className="text-xs font-mono text-cyan-400/70 bg-cyan-400/10 px-2 py-1 rounded">LIVE SYNC</span>
                    </div>

                    {currentRegime && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-6">
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${getRegimeColor(currentRegime.regime)} flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500`}>
                                    <span className="text-4xl filter drop-shadow-md">{getRegimeIcon(currentRegime.regime)}</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-widest uppercase">
                                        {currentRegime.regime}
                                    </h3>
                                    <p className="text-sm text-gray-400/80 mt-1 font-mono uppercase tracking-tighter">
                                        Engine: {currentRegime.source}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confidence Index</span>
                                    <span className="text-2xl font-black text-white">{(currentRegime.strength * 100).toFixed(0)}<span className="text-sm text-gray-500">%</span></span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 p-0.5">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${getRegimeColor(currentRegime.regime)} transition-all duration-1000 ease-out`}
                                        style={{ width: `${currentRegime.strength * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                                <p className="text-gray-300 leading-relaxed text-sm italic">
                                    &quot;{currentRegime.description}&quot;
                                </p>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase">
                                <span>Ref: NEX-OR-01</span>
                                <span>Updated: {new Date(currentRegime.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Regime History List */}
            <div className="bg-slate-900/30 backdrop-blur-lg rounded-3xl border border-white/5 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white/50 mb-4 uppercase tracking-[0.2em]">Temporal Evolution</h3>

                {regimeHistory && regimeHistory.history.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {regimeHistory.history.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all duration-300 group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRegimeColor(item.regime)} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                        <span className="text-lg">{getRegimeIcon(item.regime)}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{item.regime}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">
                                            {new Date(item.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {item.strength && (
                                        <div className="text-xs font-black text-white/60">
                                            {(item.strength * 100).toFixed(0)}%
                                        </div>
                                    )}
                                    {item.duration_minutes && (
                                        <div className="text-[10px] text-gray-600 font-mono">
                                            {item.duration_minutes}m
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-600 italic text-sm">
                        Waiting for historical data sync...
                    </div>
                )}
            </div>
        </div>
    );
}
