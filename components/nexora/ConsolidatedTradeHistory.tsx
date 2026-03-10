'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    ArrowUpDown,
    TrendingUp,
    TrendingDown,
    Calendar,
    Hash,
    Briefcase,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { nexoraAPI } from '@/lib/nexora-api';

interface PastTrade {
    trade_id: string;
    symbol: string;
    strategy: string;
    regime: string;
    side: string;
    entry_time: string;
    exit_time: string;
    entry_price: number;
    exit_price: number;
    size_usd: number;
    pnl_usd: number;
    pnl_pct: number;
    win: boolean | number;
    exit_reason: string;
    metadata?: {
        exchange?: string;
        fee_open?: number;
        fee_close?: number;
        orders?: any[];
        is_open?: boolean;
    };
}

export default function ConsolidatedTradeHistory() {
    const [trades, setTrades] = useState<PastTrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSide, setFilterSide] = useState<string>('ALL');

    const fetchHistory = async () => {
        try {
            const data = await nexoraAPI.getRecentTrades(500);
            setTrades(data.trades || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch trade history:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredTrades = trades.filter(trade => {
        const matchesSearch =
            trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trade.trade_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trade.strategy.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSide = filterSide === 'ALL' || trade.side === filterSide;

        return matchesSearch && matchesSide;
    });

    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl_usd || 0), 0);
    const winRate = (filteredTrades.filter(t => t.win).length / filteredTrades.length * 100) || 0;

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-12 bg-white/5 rounded-2xl w-full"></div>
                <div className="h-[600px] bg-white/5 rounded-3xl w-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Tactical Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Outcomes</div>
                    <div className="text-2xl font-black text-white">{filteredTrades.length}</div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Realized P&L</div>
                    <div className={cn("text-2xl font-black", totalPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Probability</div>
                    <div className="text-2xl font-black text-white">{winRate.toFixed(1)}%</div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Efficiency</div>
                    <div className="text-2xl font-black text-cyan-400">88.4%</div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search via Symbol, ID, or Strategy..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 transition-all font-mono"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                    {['ALL', 'BUY', 'SELL'].map(side => (
                        <button
                            key={side}
                            onClick={() => setFilterSide(side)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filterSide === side ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {side}
                        </button>
                    ))}
                </div>
                <button aria-label="Download Trade History" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400">
                    <Download className="w-4 h-4" />
                </button>
            </div>

            {/* Main History Table */}
            <div className="bg-[#0b1120]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Timestamp
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-3 h-3" />
                                        Identity
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Executor</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Regime</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry/Exit</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fees</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Change</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Magnitude</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredTrades.map((trade) => (
                                <tr key={trade.trade_id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-[10px] font-black text-white mb-0.5">
                                            {new Date(trade.exit_time || trade.entry_time).toLocaleDateString()}
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-500">
                                            {new Date(trade.exit_time || trade.entry_time).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center border",
                                                trade.win ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                            )}>
                                                {trade.side === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                                                {trade.trade_id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-black text-cyan-400">Freqtrade</div>
                                        <div className="text-[9px] font-mono text-slate-500">{trade.metadata?.exchange || 'binance'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-black text-white">{trade.symbol}</div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{trade.strategy}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                            {trade.regime}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-bold text-white">${trade.entry_price.toFixed(2)}</div>
                                        <div className="text-[10px] font-bold text-cyan-400">${trade.exit_price.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-bold text-orange-400">
                                            ${((trade.metadata?.fee_open || 0) + (trade.metadata?.fee_close || 0)).toFixed(2)}
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-500">
                                            {((trade.metadata?.fee_open || 0) * 100).toFixed(2)}% + {((trade.metadata?.fee_close || 0) * 100).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn("text-xs font-black", trade.pnl_usd >= 0 ? "text-emerald-400" : "text-red-400")}>
                                            {trade.pnl_usd >= 0 ? '+' : ''}${trade.pnl_usd.toFixed(2)}
                                        </div>
                                        <div className={cn("text-[10px] font-bold opacity-60", trade.pnl_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                                            {trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xs font-black text-white">${trade.size_usd.toFixed(0)}</div>
                                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">{trade.exit_reason || 'NORMAL'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTrades.length === 0 && (
                    <div className="py-20 text-center">
                        <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">No Archived Outcomes Found</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
