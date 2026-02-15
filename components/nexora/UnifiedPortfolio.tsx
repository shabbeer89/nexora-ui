'use client';

import { useEffect, useState, useCallback } from 'react';
import { nexoraAPI, Portfolio, Positions } from '@/lib/nexora-api';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function UnifiedPortfolio() {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [positions, setPositions] = useState<Positions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        fetchPortfolioData();
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const [portfolioData, positionsData] = await Promise.all([
                nexoraAPI.getPortfolio(),
                nexoraAPI.getPositions(),
            ]);
            setPortfolio(portfolioData);
            setPositions(positionsData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
        } finally {
            setLoading(false);
        }
    };

    // WebSocket for real-time updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws';
    const { onMessage } = useWebSocket(wsUrl);

    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === 'portfolio_update') {
                console.log('[UnifiedPortfolio] Portfolio Update:', message.data);
                setPortfolio(message.data);
            }
            if (message.type === 'positions_update') {
                console.log('[UnifiedPortfolio] Positions Update:', message.data);
                setPositions(message.data);
            }
        });

        return () => unsubscribe();
    }, [onMessage]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number) => {
        const formatted = value.toFixed(2);
        return value >= 0 ? `+${formatted}%` : `${formatted}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-black/20 backdrop-blur-md rounded-3xl border border-white/10 min-h-[400px]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl rotate-45 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
                    <div className="h-4 w-32 bg-white/10 rounded-full mb-2"></div>
                    <div className="h-3 w-24 bg-white/5 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-3xl p-8 text-center">
                <div className="text-red-400 font-bold text-lg mb-2">Portfolio Sync Failed</div>
                <p className="text-red-400/70 mb-6">{error}</p>
                <button
                    onClick={fetchPortfolioData}
                    className="px-8 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-100 border border-red-500/50 rounded-2xl transition-all"
                >
                    Reconnect to Vault
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Main Wallet Display */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-[2.2rem] border border-white/10 p-10 overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                                <h2 className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em]">Institutional Custody</h2>
                            </div>
                            <div className="text-gray-400 text-sm mb-1 font-medium">Aggregate Liquidation Value</div>
                            <div className="text-6xl md:text-7xl font-black text-white tracking-tighter">
                                {portfolio ? formatCurrency(portfolio.total_value_usd) : '$0.00'}
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">CEX</div>
                                    <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">DEX</div>
                                </div>
                                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                    Last Sync: {portfolio ? new Date(portfolio.timestamp).toLocaleTimeString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {portfolio?.orchestrator && (
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex-grow max-w-md">
                                <div className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest">Orchestrator Meta</div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Spread</div>
                                        <div className="text-lg font-black text-white font-mono">
                                            {formatCurrency(portfolio.orchestrator.spread)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">Venues</div>
                                        <div className="text-lg font-black text-cyan-400 font-mono">
                                            {portfolio.orchestrator.venues?.length || 0}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {portfolio.orchestrator.venues?.map(v => (
                                                <span key={v} className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-mono text-gray-400 border border-white/5">{v}</span>
                                            )) || <span className="text-[9px] text-gray-500">No venues configured</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Platform Balances */}
                <div className="space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col justify-between h-[180px] group transition-all hover:bg-slate-900/60">
                        <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">CEX Liquidity</h3>
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono">FREQTRADE</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">{portfolio ? formatCurrency(portfolio.cex.total_usd) : '$0.00'}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-1">{positions ? positions.cex_positions.length : 0} Active Channels</div>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[65%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col justify-between h-[180px] group transition-all hover:bg-slate-900/60">
                        <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest">DEX Liquidity</h3>
                            <span className="text-[8px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded font-mono">HUMMINGBOT</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">{portfolio ? formatCurrency(portfolio.dex.total_usd) : '$0.00'}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-1">{positions ? positions.dex_positions.length : 0} Active Pools</div>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[35%] shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                        </div>
                    </div>
                </div>

                {/* Positions Feed */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black text-white/90 tracking-tight">Active Operations</h3>
                            <button
                                className="group flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-mono text-gray-400 hover:text-cyan-400 transition-all"
                                onClick={fetchPortfolioData}
                            >
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full group-hover:animate-ping"></span>
                                SYNC STATE
                            </button>
                        </div>
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-gray-400 uppercase">
                            {positions ? positions.total_positions : 0} TRADES
                        </div>
                    </div>

                    {positions && positions.total_positions > 0 ? (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {[...positions.cex_positions, ...positions.dex_positions].map((pos, i) => (
                                <div key={i} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl transition-all group-hover:bg-white/[0.05]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-black text-xs text-white shadow-lg">
                                                {pos.symbol.substring(0, 3)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{pos.symbol}</div>
                                                <div className="text-[10px] font-mono text-gray-500">
                                                    Size: {pos.size.toFixed(4)} @ {formatCurrency(pos.entry_price)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-black text-sm ${pos.pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {pos.pnl_usd >= 0 ? '+' : ''}{formatCurrency(pos.pnl_usd)}
                                            </div>
                                            <div className={`text-[10px] font-black font-mono ${pos.pnl_pct >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                                {formatPercent(pos.pnl_pct)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <div className="w-16 h-16 border-2 border-dashed border-gray-500 rounded-full mb-4"></div>
                            <div className="text-sm font-medium">No live exposure detected</div>
                            <div className="text-[10px] uppercase mt-1">Ready for deployment</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
