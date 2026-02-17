'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, X, Target, Clock, DollarSign } from 'lucide-react';

interface ActiveTrade {
    trade_id: string;
    symbol: string;
    side: string;
    entry_price: number;
    current_price: number;
    size: number;
    pnl: number;
    pnl_pct: number;
    entry_time: string;
    duration_hours: number;
    scale_out_levels: Array<{ price: number; size_pct: number; hit: boolean }>;
    trailing_stop: { enabled: boolean; distance: number; current_stop: number };
    time_exit: { enabled: boolean; max_hours: number };
}

export default function TradeManagerUI() {
    const [trades, setTrades] = useState<ActiveTrade[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrades = async () => {
        try {
            // Fetch real open positions from Nexora API
            const response = await fetch(`${process.env.NEXT_PUBLIC_NEXORA_API_URL || 'http://localhost:8888'}/portfolio/positions`);

            if (!response.ok) {
                console.error('Failed to fetch positions:', response.status, response.statusText);
                setTrades([]);
                setLoading(false);
                return;
            }

            const data = await response.json();

            // Check if data is valid
            if (!data || typeof data !== 'object') {
                console.error('Invalid response data:', data);
                setTrades([]);
                setLoading(false);
                return;
            }

            // Transform positions to trade format
            const cexPositions = data.cex_positions || [];
            const dexPositions = data.dex_positions || [];

            const transformedTrades: ActiveTrade[] = [];

            // Add CEX positions (Freqtrade)
            cexPositions.forEach((pos: any) => {
                transformedTrades.push({
                    trade_id: `cex-${pos.symbol}-${Date.now()}`,
                    symbol: pos.symbol,
                    side: pos.size > 0 ? 'LONG' : 'SHORT',
                    entry_price: pos.entry_price,
                    current_price: pos.current_price,
                    size: Math.abs(pos.size),
                    pnl: pos.pnl_usd,
                    pnl_pct: pos.pnl_pct,
                    entry_time: new Date().toISOString(),
                    duration_hours: 0,
                    scale_out_levels: [],
                    trailing_stop: {
                        enabled: false,
                        distance: 0,
                        current_stop: 0
                    },
                    time_exit: {
                        enabled: false,
                        max_hours: 0
                    }
                });
            });

            // Add DEX positions (Hummingbot)
            dexPositions.forEach((pos: any) => {
                transformedTrades.push({
                    trade_id: `dex-${pos.symbol}-${Date.now()}`,
                    symbol: `${pos.symbol} (DEX)`,
                    side: pos.size > 0 ? 'LONG' : 'SHORT',
                    entry_price: pos.entry_price,
                    current_price: pos.current_price,
                    size: Math.abs(pos.size),
                    pnl: pos.pnl_usd,
                    pnl_pct: pos.pnl_pct,
                    entry_time: new Date().toISOString(),
                    duration_hours: 0,
                    scale_out_levels: [],
                    trailing_stop: {
                        enabled: false,
                        distance: 0,
                        current_stop: 0
                    },
                    time_exit: {
                        enabled: false,
                        max_hours: 0
                    }
                });
            });

            setTrades(transformedTrades);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch trades:', error);
            setTrades([]);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrades();
        const interval = setInterval(fetchTrades, 5000); // Update every 5s
        return () => clearInterval(interval);
    }, []);

    const forceExit = async (tradeId: string) => {
        if (!confirm('Force exit this trade?')) return;

        try {
            await fetch(`http://localhost:8888/api/trades/${tradeId}/exit`, {
                method: 'POST',
            });
            fetchTrades();
        } catch (error) {
            alert('Failed to exit trade');
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-slate-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1">
                        📊 Active Trades
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Professional Trade Management
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Active Positions</div>
                        <div className="text-2xl font-black text-cyan-400">{trades.length}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Total P&L</div>
                        <div className={`text-2xl font-black ${trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trades List */}
            {trades.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📭</div>
                    <div className="text-xl font-bold text-slate-400">No Active Trades</div>
                    <div className="text-sm text-slate-500 mt-2">Waiting for entry signals...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {trades.map((trade) => (
                        <div
                            key={trade.trade_id}
                            className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
                        >
                            {/* Trade Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl ${trade.side === 'LONG' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'} flex items-center justify-center`}>
                                        {trade.side === 'LONG' ? (
                                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-6 h-6 text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-white">{trade.symbol}</div>
                                        <div className="text-xs text-slate-400 font-mono">ID: {trade.trade_id}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className={`text-2xl font-black ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                        </div>
                                        <div className={`text-sm font-bold ${trade.pnl_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => forceExit(trade.trade_id)}
                                        className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5 text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Trade Details Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Entry Price</div>
                                    <div className="text-sm font-bold text-white">${trade.entry_price.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Current Price</div>
                                    <div className="text-sm font-bold text-cyan-400">${trade.current_price.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Size</div>
                                    <div className="text-sm font-bold text-white">${trade.size.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Duration
                                    </div>
                                    <div className="text-sm font-bold text-white">{trade.duration_hours.toFixed(1)}h</div>
                                </div>
                            </div>

                            {/* Scale-Out Levels */}
                            {trade.scale_out_levels.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        Scale-Out Levels
                                    </div>
                                    <div className="flex gap-2">
                                        {trade.scale_out_levels.map((level, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex-1 px-3 py-2 rounded-lg border ${level.hit ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-slate-700/50 border-slate-600/30'}`}
                                            >
                                                <div className="text-xs text-slate-400">Level {idx + 1}</div>
                                                <div className={`text-sm font-bold ${level.hit ? 'text-emerald-400' : 'text-white'}`}>
                                                    ${level.price.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-slate-400">{level.size_pct}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trailing Stop */}
                            {trade.trailing_stop.enabled && (
                                <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Trailing Stop
                                        </div>
                                        <div className="text-sm font-bold text-yellow-400">
                                            ${trade.trailing_stop.current_stop.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Distance: {(trade.trailing_stop.distance * 100).toFixed(1)}%
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
