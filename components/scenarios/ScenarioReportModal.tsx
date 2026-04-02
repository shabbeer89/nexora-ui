'use client';

import React, { useEffect, useState } from 'react';
import { 
    X, Loader2, TrendingUp, AlertTriangle, 
    Activity, Clock, DollarSign, List, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Use relative API path properly routed through Next.js rewrite
const API_BASE = '';

interface ScenarioReportModalProps {
    scenarioId: string;
    onClose: () => void;
}

export function ScenarioReportModal({ scenarioId, onClose }: ScenarioReportModalProps) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'orders'>('overview');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/report`);
                if (!response.ok) {
                    throw new Error('Failed to fetch report');
                }
                const data = await response.json();
                setReport(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
        const interval = setInterval(fetchReport, 15000);
        return () => clearInterval(interval);
    }, [scenarioId]);

    if (!scenarioId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-cyan-500" />
                            Scenario Report: <span className="text-cyan-400">{report?.scenario_info?.name || scenarioId}</span>
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-bold">
                            Detailed Orders, Trades, and Profit Analysis
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-900">
                    {loading && !report ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Gathering Intel...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center max-w-md">
                                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-rose-400 mb-2">Error Loading Report</h3>
                                <p className="text-sm text-rose-300 mb-6">{error}</p>
                                <button 
                                    onClick={onClose}
                                    className="px-6 py-2 bg-rose-500/20 text-rose-400 rounded-xl font-bold uppercase text-xs hover:bg-rose-500/30"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ) : report ? (
                        <>
                            {/* Tabs Navigation */}
                            <div className="flex items-center gap-1 p-3 bg-slate-900 border-b border-white/5">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Activity },
                                    { id: 'trades', label: 'Completed Trades', icon: TrendingUp },
                                    { id: 'orders', label: 'Active Orders', icon: List }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                            activeTab === tab.id 
                                                ? "bg-cyan-500 border border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content Panels */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                
                                {activeTab === 'overview' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                        {/* Financial Summary */}
                                        <div>
                                            <h3 className="text-sm border-b border-white/10 pb-2 mb-4 font-black uppercase tracking-widest text-slate-400">Financial Summary</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
                                                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Total Allocated</div>
                                                    <div className="text-2xl font-black text-white">${(report.scenario_info.capital || 0).toLocaleString()}</div>
                                                </div>
                                                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
                                                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">CEX P&amp;L</div>
                                                    <div className={cn("text-2xl font-black", report.scenario_info.cex_pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                        {report.scenario_info.cex_pnl >= 0 ? '+' : ''}${(report.scenario_info.cex_pnl || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
                                                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">DEX P&amp;L (LP Fees + Gains)</div>
                                                    <div className={cn("text-2xl font-black", report.scenario_info.dex_pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                        {report.scenario_info.dex_pnl >= 0 ? '+' : ''}${(report.scenario_info.dex_pnl || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-cyan-500/5 backdrop-blur-3xl" />
                                                    <div className="relative z-10">
                                                        <div className="text-[10px] text-cyan-500 uppercase font-black mb-1">Net Scenario P&amp;L</div>
                                                        <div className={cn("text-3xl font-black drop-shadow-lg", report.scenario_info.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                            {report.scenario_info.pnl >= 0 ? '+' : ''}${(report.scenario_info.pnl || 0).toFixed(2)}
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-400 mt-2">
                                                            Return: {report.scenario_info.capital ? ((report.scenario_info.pnl / report.scenario_info.capital) * 100).toFixed(2) : 0}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Timing */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
                                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Activity Status</h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                        <span className="text-sm text-slate-500">Status</span>
                                                        <span className={cn("text-xs font-black uppercase px-2 py-1 rounded bg-slate-950 border", 
                                                            report.scenario_info.status === 'running' ? "text-emerald-400 border-emerald-500/30" : "text-slate-400 border-white/10"
                                                        )}>{report.scenario_info.status}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                        <span className="text-sm text-slate-500">Started At</span>
                                                        <span className="text-sm text-white font-mono">{report.scenario_info.started_at ? new Date(report.scenario_info.started_at).toLocaleString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-500">Last Synced</span>
                                                        <span className="text-sm text-white font-mono">{new Date(report.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
                                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Capital Distribution</h3>
                                                <div className="flex items-center gap-4 h-full pb-4">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="text-xs text-slate-400 flex justify-between"><span>CEX ({report.scenario_info.cex_strategy})</span><span className="text-white font-bold">{report.scenario_info.allocation.cex * 100}%</span></div>
                                                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${report.scenario_info.allocation.cex * 100}%` }} /></div>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="text-xs text-slate-400 flex justify-between"><span>DEX ({report.scenario_info.dex_strategy})</span><span className="text-white font-bold">{report.scenario_info.allocation.dex * 100}%</span></div>
                                                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${report.scenario_info.allocation.dex * 100}%` }} /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'trades' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                        
                                        {/* CEX Trades */}
                                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                                            <div className="bg-slate-800/80 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase text-cyan-400 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-cyan-400" /> CEX Trades
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md">
                                                    {report.cex_data.recent_trades.length} trades
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-[10px] uppercase bg-slate-950/50 text-slate-500 font-black">
                                                        <tr>
                                                            <th className="px-4 py-3">ID / Pair</th>
                                                            <th className="px-4 py-3">Type</th>
                                                            <th className="px-4 py-3 text-right">Open Price</th>
                                                            <th className="px-4 py-3 text-right">Close Price</th>
                                                            <th className="px-4 py-3 text-right">Profit</th>
                                                            <th className="px-4 py-3 text-right">Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                                                        {report.cex_data.recent_trades.length > 0 ? report.cex_data.recent_trades.map((t: any, i: number) => (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-bold text-white">{t.pair}</div>
                                                                    <div className="text-[10px] text-slate-500">#{t.trade_id}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", t.is_short ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
                                                                        {t.is_short ? 'SHORT' : 'LONG'}
                                                                    </span>
                                                                    {!t.is_open && <span className="ml-2 text-slate-500 text-[9px] uppercase border px-1 rounded border-slate-700">Closed</span>}
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-400">{t.open_rate?.toFixed(4)}</td>
                                                                <td className="px-4 py-3 text-right text-slate-400">{t.close_rate ? t.close_rate.toFixed(4) : '-'}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className={cn("font-bold", t.profit_abs >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                        {t.profit_abs >= 0 ? '+' : ''}{t.profit_abs?.toFixed(2)}
                                                                    </div>
                                                                    <div className={cn("text-[10px]", t.profit_ratio >= 0 ? "text-emerald-500/70" : "text-rose-500/70")}>
                                                                        {t.profit_ratio >= 0 ? '+' : ''}{(t.profit_ratio * 100)?.toFixed(2)}%
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-500 text-[10px]">
                                                                    {t.close_date ? new Date(t.close_date).toLocaleString() : 'Open'}
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">No historical trades found on CEX</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* DEX Trades */}
                                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                                            <div className="bg-slate-800/80 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase text-purple-400 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-400" /> DEX Trades
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md">
                                                    {report.dex_data.recent_trades.length} trades
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-[10px] uppercase bg-slate-950/50 text-slate-500 font-black">
                                                        <tr>
                                                            <th className="px-4 py-3">Market / Exchange</th>
                                                            <th className="px-4 py-3">Type</th>
                                                            <th className="px-4 py-3 text-right">Price</th>
                                                            <th className="px-4 py-3 text-right">Amount</th>
                                                            <th className="px-4 py-3 text-right">Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                                                        {report.dex_data.recent_trades.length > 0 ? report.dex_data.recent_trades.map((t: any, i: number) => (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-bold text-white">{t.market || t.symbol || 'N/A'}</div>
                                                                    <div className="text-[10px] text-slate-500">{t.exchange || 'DEX'}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", String(t.trade_type).toUpperCase() === "SELL" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
                                                                        {t.trade_type || t.type || 'UNKNOWN'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-400">{Number(t.price || 0).toFixed(4)}</td>
                                                                <td className="px-4 py-3 text-right text-white font-bold">{Number(t.amount || 0).toFixed(4)}</td>
                                                                <td className="px-4 py-3 text-right text-slate-500 text-[10px]">
                                                                    {t.timestamp ? new Date(t.timestamp * 1000).toLocaleString() : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No historical trades found on DEX</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {activeTab === 'orders' && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                        
                                        {/* Hummingbot Open Orders */}
                                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                                            <div className="bg-slate-800/80 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                                                    <List className="w-4 h-4 text-slate-400" /> Active Open Orders (DEX)
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md">
                                                    {report.dex_data.active_orders.length} orders
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-[10px] uppercase bg-slate-950/50 text-slate-500 font-black">
                                                        <tr>
                                                            <th className="px-4 py-3">Order ID</th>
                                                            <th className="px-4 py-3">Market</th>
                                                            <th className="px-4 py-3">Type</th>
                                                            <th className="px-4 py-3 text-right">Price</th>
                                                            <th className="px-4 py-3 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                                                        {report.dex_data.active_orders.length > 0 ? report.dex_data.active_orders.map((o: any, i: number) => (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3 text-slate-500 text-[10px] truncate max-w-[150px]" title={o.order_id}>{o.order_id}</td>
                                                                <td className="px-4 py-3 font-bold text-white">{o.trading_pair}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", o.trade_type === "SELL" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
                                                                        {o.trade_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-400">{Number(o.price || 0).toFixed(4)}</td>
                                                                <td className="px-4 py-3 text-right text-white font-bold">{Number(o.amount || 0).toFixed(4)}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No active orders found on DEX</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* FreqTrade Open Trades */}
                                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                                            <div className="bg-slate-800/80 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                                <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                                                    <List className="w-4 h-4 text-slate-400" /> Active Trades (CEX)
                                                </h3>
                                                <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md">
                                                    {report.cex_data.open_trades.length} trades
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm text-slate-300">
                                                    <thead className="text-[10px] uppercase bg-slate-950/50 text-slate-500 font-black">
                                                        <tr>
                                                            <th className="px-4 py-3">Trade ID / Pair</th>
                                                            <th className="px-4 py-3">Side</th>
                                                            <th className="px-4 py-3 text-right">Open Rate</th>
                                                            <th className="px-4 py-3 text-right">Current Rate</th>
                                                            <th className="px-4 py-3 text-right">Unrealized P&amp;L</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                                                        {report.cex_data.open_trades.length > 0 ? report.cex_data.open_trades.map((t: any, i: number) => (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-bold text-white">{t.pair}</div>
                                                                    <div className="text-[10px] text-slate-500">#{t.trade_id}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", t.is_short ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400")}>
                                                                        {t.is_short ? 'SHORT' : 'LONG'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-400">{t.open_rate?.toFixed(4)}</td>
                                                                <td className="px-4 py-3 text-right text-white">{t.current_rate?.toFixed(4)}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className={cn("font-bold", t.profit_abs >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                        {t.profit_abs >= 0 ? '+' : ''}{t.profit_abs?.toFixed(2)}
                                                                    </div>
                                                                    <div className={cn("text-[10px]", t.profit_ratio >= 0 ? "text-emerald-500/70" : "text-rose-500/70")}>
                                                                        {t.profit_ratio >= 0 ? '+' : ''}{(t.profit_ratio * 100)?.toFixed(2)}%
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No active trades found on CEX</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
