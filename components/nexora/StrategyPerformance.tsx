'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { nexoraAPI, Strategies } from '@/lib/nexora-api';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function StrategyPerformance() {
    const [strategies, setStrategies] = useState<Strategies | null>(null);
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        fetchStrategyData();
    }, []);

    const fetchStrategyData = async () => {
        try {
            const [strategiesData, performance] = await Promise.all([
                nexoraAPI.getStrategies(),
                nexoraAPI.getStrategyPerformance(),
            ]);
            setStrategies(strategiesData);
            setPerformanceData(performance);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch strategy data');
        } finally {
            setLoading(false);
        }
    };

    // WebSocket for real-time updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws';
    const { onMessage } = useWebSocket(wsUrl);

    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === 'strategies_update') {
                console.log('[StrategyPerformance] Strategies Update:', message.data);
                setStrategies(message.data);
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
        return `${(value * 100).toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-black/20 backdrop-blur-md rounded-3xl border border-white/10 h-[500px]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="mt-4 text-xs font-black text-cyan-400 uppercase tracking-widest">Compiling Analytics</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-3xl p-8 text-center">
                <div className="text-red-400 font-bold mb-2">TELEMETRY LINK SEVERED</div>
                <button
                    onClick={fetchStrategyData}
                    className="mt-4 px-6 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-100 border border-red-500/50 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
                >
                    RE-ESTABLISH HANDSHAKE
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Master Performance Overview */}
            {performanceData?.aggregated && (
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[2rem] blur opacity-20"></div>
                    <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-[1.8rem] border border-white/10 p-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Executive Alpha Summary</h2>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 transition-all uppercase tracking-widest group">
                                <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                                Export Analytics
                                <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Realized Alpha</div>
                                <div className={`text-4xl font-black tracking-tighter ${performanceData.aggregated.total_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(performanceData.aggregated.total_pnl_usd)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hit Probability</div>
                                <div className="text-4xl font-black tracking-tighter text-blue-400">
                                    {formatPercent(performanceData.aggregated.win_rate)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Risk/Reward (Sharpe)</div>
                                <div className="text-4xl font-black tracking-tighter text-purple-400">
                                    {performanceData.aggregated.sharpe_ratio.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CEX Node */}
                {strategies?.cex && (
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 hover:bg-slate-900/50 transition-all group">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">CEX Engine</h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Provider: FREQTRADE</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <div className={`w-1.5 h-1.5 rounded-full ${strategies.cex.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{strategies.cex.status === 'running' ? 'LIVE' : 'STANDBY'}</span>
                            </div>
                        </div>

                        <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-black text-blue-400 uppercase mb-8 tracking-widest">
                            {strategies.cex.strategy}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Net Profit', val: formatCurrency(strategies.cex.performance.profit_usd), color: strategies.cex.performance.profit_usd >= 0 ? 'text-green-400' : 'text-red-400' },
                                { label: 'Efficiency', val: formatPercent(strategies.cex.performance.win_rate), color: 'text-white' },
                                { label: 'Volume', val: strategies.cex.performance.total_trades || 0, color: 'text-white' },
                                { label: 'Alpha Score', val: strategies.cex.performance.sharpe_ratio?.toFixed(2) || '0.00', color: 'text-purple-400' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">{s.label}</div>
                                    <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DEX Node */}
                {strategies?.dex && (
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 hover:bg-slate-900/50 transition-all group">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">DEX Protocol</h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Provider: HUMMINGBOT</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <div className={`w-1.5 h-1.5 rounded-full ${strategies.dex.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{strategies.dex.status === 'running' ? 'LIVE' : 'STANDBY'}</span>
                            </div>
                        </div>

                        <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs font-black text-purple-400 uppercase mb-8 tracking-widest">
                            {strategies.dex.strategy}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Net Profit', val: formatCurrency(strategies.dex.performance.profit_usd), color: strategies.dex.performance.profit_usd >= 0 ? 'text-green-400' : 'text-red-400' },
                                { label: 'Efficiency', val: formatPercent(strategies.dex.performance.win_rate), color: 'text-white' },
                                { label: 'Volume', val: strategies.dex.performance.total_trades || 0, color: 'text-white' },
                                { label: 'Alpha Score', val: strategies.dex.performance.sharpe_ratio?.toFixed(2) || '0.00', color: 'text-blue-400' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">{s.label}</div>
                                    <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Multi-Timeframe Equity Visualization */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 flex gap-4">
                    {['1H', '4H', '1D', '1W'].map(t => (
                        <button key={t} className={`px-3 py-1 rounded text-[10px] font-black ${t === '1D' ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                    ))}
                </div>
                <h3 className="text-xl font-black text-white/90 tracking-tight mb-8">Equity Trajectory</h3>
                <div className="h-[200px] flex items-end gap-2 px-4 border-b border-l border-white/10">
                    {/* Simulated Chart Bars */}
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            style={{ height: `${Math.random() * 60 + 20}%` }}
                            className={`flex-1 rounded-t-sm transition-all duration-500 hover:opacity-100 opacity-40 ${i > 30 ? 'bg-cyan-500/40' : 'bg-blue-500/20'}`}
                        ></div>
                    ))}
                </div>
                <div className="mt-4 text-[9px] font-mono text-gray-500 uppercase flex justify-between tracking-widest">
                    <span>Alpha Inception</span>
                    <span>T+ 742 Operations</span>
                    <span>Live Convergence</span>
                </div>
            </div>
        </div>
    );
}
