'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Server, Cpu, Zap, RefreshCw, CheckCircle2, XCircle,
    AlertTriangle, Loader2, TrendingUp, TrendingDown, Radio, Shield,
    BarChart3, ArrowUpDown, Clock, Play, Pause, CircleDot, Eye
} from 'lucide-react';

/* ────────────────────────────────────────────────────────── Types */
interface BotStatus {
    status: string;
    paper_trading?: boolean;
    strategy?: string;
    timeframe?: string;
    exchange?: string;
    open_trade_count?: number;
    total_pnl?: number;
    win_rate?: number;
    trade_count?: number;
    stoploss?: number;
    trailing_stop?: boolean;
    max_open_trades?: number;
    stake_currency?: string;
    active_instances?: number;
    instance_names?: string[];
    model?: string;
    last_prediction?: string;
    confidence?: number;
}

interface ScenarioItem {
    id: string;
    name: string;
    status: string;
    category: string;
    pnl: number;
    cex_pnl: number;
    dex_pnl: number;
    started_at?: string;
    capital: number;
    cex_strategy: string;
    dex_strategy: string;
    dex_bot: string;
    dex_bot_live: boolean;
    log_count: number;
    last_log?: string;
}

interface TradeItem {
    source: string;
    trade_id: number;
    pair: string;
    side: string;
    stake_amount?: number;
    profit_abs: number;
    profit_pct: number;
    open_date?: string;
    open_rate?: number;
    current_rate?: number;
    close_date?: string;
    exit_reason?: string;
}

interface CommandCenterData {
    system?: {
        status: string;
        api_version?: string;
        timestamp?: string;
        response_time_ms?: number;
        error?: string;
    };
    bots?: {
        freqtrade?: BotStatus;
        hummingbot?: BotStatus;
        freqai?: BotStatus;
    };
    paper_trading?: {
        mode: string;
        controlled_by_nexora: boolean;
        dry_run?: boolean;
        exchange?: string;
        stake_currency?: string;
        strategy?: string;
        stoploss?: number;
        trailing_stop?: boolean;
        max_open_trades?: number;
    };
    scenarios?: {
        total_defined: number;
        active_count: number;
        scenarios?: ScenarioItem[];
    };
    orders_and_trades?: {
        open_trades?: TradeItem[];
        recent_closed_trades?: TradeItem[];
        total_open: number;
        total_closed: number;
        aggregate_open_pnl: number;
        aggregate_closed_pnl: number;
    };
}

/* ────────────────────────────────────────────────────────── Helpers */
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

function StatusDot({ status }: { status: string }) {
    const color = {
        operational: 'bg-emerald-500 shadow-emerald-500/50',
        degraded: 'bg-amber-500 shadow-amber-500/50',
        down: 'bg-rose-500 shadow-rose-500/50',
        connected: 'bg-emerald-500 shadow-emerald-500/50',
        running: 'bg-emerald-500 shadow-emerald-500/50',
        active: 'bg-emerald-500 shadow-emerald-500/50',
        disconnected: 'bg-rose-500 shadow-rose-500/50',
        error: 'bg-rose-500 shadow-rose-500/50',
        inactive: 'bg-slate-600 shadow-none',
        unknown: 'bg-slate-600 shadow-none',
    }[status] || 'bg-slate-600';

    return (
        <span className={cn(
            'inline-block w-2.5 h-2.5 rounded-full shadow-[0_0_8px]',
            color
        )} />
    );
}

function PnlBadge({ value }: { value: number }) {
    if (value === 0) return <span className="text-slate-500 font-mono text-xs">$0.00</span>;
    const positive = value > 0;
    return (
        <span className={cn(
            'font-mono text-xs font-bold',
            positive ? 'text-emerald-400' : 'text-rose-400'
        )}>
            {positive ? '+' : ''}{value < 0.01 && value > -0.01 ? value.toFixed(4) : `$${value.toFixed(2)}`}
        </span>
    );
}

/* ────────────────────────────────────────────────────────── Page */
export default function CommandCenterPage() {
    const [data, setData] = useState<CommandCenterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/command-center');
            const json = await res.json();
            // Accept both 200 and error responses — always set data
            setData(json);
            setError(res.ok ? null : (json?.system?.error || `HTTP ${res.status}`));
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Safe accessors — never crash on missing data
    const sys = data?.system;
    const ft = data?.bots?.freqtrade;
    const hb = data?.bots?.hummingbot;
    const ai = data?.bots?.freqai;
    const pt = data?.paper_trading;
    const sc = data?.scenarios;
    const scenarios = sc?.scenarios ?? [];
    const ot = data?.orders_and_trades;
    const openTrades = ot?.open_trades ?? [];
    const closedTrades = ot?.recent_closed_trades ?? [];

    /* ──────────────── Render ──────────────── */
    return (
        <div className="space-y-6 pb-12">
            {/* ═══════════════ HEADER ═══════════════ */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Radio className="w-8 h-8 text-cyan-500" />
                        Command Center
                        <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// LIVE</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Unified real-time view of all bots, paper trading, scenarios & trades
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {sys && (
                        <div className={cn(
                            'px-4 py-2 rounded-xl border flex items-center gap-2',
                            sys.status === 'operational' ? 'border-emerald-500/30 bg-emerald-500/10' :
                                sys.status === 'degraded' ? 'border-amber-500/30 bg-amber-500/10' :
                                    'border-rose-500/30 bg-rose-500/10'
                        )}>
                            <StatusDot status={sys.status} />
                            <span className={cn(
                                'text-xs font-black uppercase',
                                sys.status === 'operational' ? 'text-emerald-400' :
                                    sys.status === 'degraded' ? 'text-amber-400' : 'text-rose-400'
                            )}>
                                {sys.status === 'operational' ? 'All Systems GO' :
                                    sys.status === 'degraded' ? 'Degraded' : 'Systems Down'}
                            </span>
                        </div>
                    )}
                    {sys?.response_time_ms !== undefined && (
                        <span className="text-[9px] font-mono text-slate-600">
                            {sys.response_time_ms}ms
                        </span>
                    )}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-slate-900/40 border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn('w-4 h-4 text-slate-400', loading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* ═══════════════ ERROR STATE ═══════════════ */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-rose-400">Backend Unreachable</div>
                        <div className="text-xs text-rose-300/70">{error}</div>
                    </div>
                </div>
            )}

            {loading && !data ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* ═══════════════ 1. BOT FLEET ═══════════════ */}
                    <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Server className="w-4 h-4" /> Bot Fleet Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* FreqTrade */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] -mr-8 -mt-8" />
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Server className="w-4 h-4 text-blue-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FreqTrade</span>
                                    </div>
                                    <StatusDot status={ft?.status ?? 'unknown'} />
                                </div>
                                <div className="text-lg font-black text-white uppercase mb-1">{ft?.status ?? 'unknown'}</div>
                                <div className="space-y-1 mt-3">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Strategy</span>
                                        <span className="text-slate-300 font-mono">{ft?.strategy || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Timeframe</span>
                                        <span className="text-slate-300 font-mono">{ft?.timeframe || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Open Trades</span>
                                        <span className="text-white font-black">{ft?.open_trade_count ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Total P&L</span>
                                        <PnlBadge value={ft?.total_pnl ?? 0} />
                                    </div>
                                </div>
                            </div>

                            {/* Hummingbot */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[60px] -mr-8 -mt-8" />
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-purple-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hummingbot</span>
                                    </div>
                                    <StatusDot status={hb?.status ?? 'unknown'} />
                                </div>
                                <div className="text-lg font-black text-white uppercase mb-1">{hb?.status ?? 'unknown'}</div>
                                <div className="space-y-1 mt-3">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Active Instances</span>
                                        <span className="text-white font-black">{hb?.active_instances ?? 0}</span>
                                    </div>
                                    {hb?.instance_names && hb.instance_names.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {hb.instance_names.slice(0, 6).map(name => (
                                                <span key={name} className="text-[8px] px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded font-mono">
                                                    {name.replace('nexora_', '')}
                                                </span>
                                            ))}
                                            {hb.instance_names.length > 6 && (
                                                <span className="text-[8px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">
                                                    +{hb.instance_names.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FreqAI */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] -mr-8 -mt-8" />
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-4 h-4 text-cyan-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FreqAI</span>
                                    </div>
                                    <StatusDot status={ai?.status ?? 'unknown'} />
                                </div>
                                <div className="text-lg font-black text-white uppercase mb-1">{ai?.status ?? 'unknown'}</div>
                                <div className="space-y-1 mt-3">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Model</span>
                                        <span className="text-slate-300 font-mono text-[9px]">{ai?.model || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Prediction</span>
                                        <span className="text-cyan-400 font-black text-[9px]">{ai?.last_prediction || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Confidence</span>
                                        <span className="text-white font-mono">{((ai?.confidence ?? 0) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════ 2. PAPER TRADING CONTROL ═══════════════ */}
                    <section>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Paper Trading Control
                        </h3>
                        <div className={cn(
                            'border rounded-2xl p-6 relative overflow-hidden',
                            (pt?.mode ?? 'unknown') === 'paper'
                                ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5'
                                : pt?.mode === 'live'
                                    ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5'
                                    : 'border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-slate-500/5'
                        )}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] -mr-16 -mt-16" />
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        'px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider',
                                        (pt?.mode ?? 'unknown') === 'paper'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : pt?.mode === 'live'
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-slate-700/20 text-slate-400 border border-slate-500/30'
                                    )}>
                                        {(pt?.mode ?? 'unknown') === 'paper' ? '⚠ PAPER TRADING' :
                                            pt?.mode === 'live' ? '🟢 LIVE TRADING' : '? MODE UNKNOWN'}
                                    </div>
                                    <div className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase',
                                        pt?.controlled_by_nexora
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    )}>
                                        {pt?.controlled_by_nexora ? '✓ Controlled by Nexora' : '✗ NOT Controlled'}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                                {[
                                    { label: 'Exchange', value: pt?.exchange ?? '—' },
                                    { label: 'Strategy', value: pt?.strategy ?? '—' },
                                    { label: 'Stoploss', value: pt?.stoploss ? `${(pt.stoploss * 100).toFixed(1)}%` : 'Not Set' },
                                    { label: 'Max Trades', value: pt?.max_open_trades ?? 'Unlimited' },
                                ].map(item => (
                                    <div key={item.label} className="bg-black/20 rounded-xl p-3">
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.label}</div>
                                        <div className="text-sm text-white font-bold mt-1 font-mono">{String(item.value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════ 3. SCENARIOS ═══════════════ */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" /> Scenario Execution
                            </h3>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-emerald-400 font-black">{sc?.active_count ?? 0} active</span>
                                <span className="text-slate-600">/</span>
                                <span className="text-slate-500">{sc?.total_defined ?? 0} total</span>
                            </div>
                        </div>
                        <div className="bg-slate-950/40 border border-white/5 rounded-2xl overflow-hidden">
                            {scenarios.length === 0 ? (
                                <div className="text-center py-12 text-slate-600 text-xs">
                                    No scenarios available — backend may be offline
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="text-left px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Scenario</th>
                                                <th className="text-center px-3 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                                <th className="text-right px-3 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">P&L</th>
                                                <th className="text-center px-3 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">DEX Bot</th>
                                                <th className="text-center px-3 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest hidden md:table-cell">Logs</th>
                                                <th className="text-left px-3 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest hidden lg:table-cell">Last Activity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scenarios.map((s) => (
                                                <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-white">{s.name}</div>
                                                        <div className="text-[9px] text-slate-500 font-mono">{s.id}</div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={cn(
                                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase',
                                                            s.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                s.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                                                                    s.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                                                                        'bg-slate-700/30 text-slate-500'
                                                        )}>
                                                            <StatusDot status={s.status} />
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right">
                                                        <PnlBadge value={s.pnl} />
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <StatusDot status={s.dex_bot_live ? 'connected' : 'disconnected'} />
                                                            <span className="text-[9px] font-mono text-slate-400">
                                                                {s.dex_bot?.replace('nexora_', '') || '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center hidden md:table-cell">
                                                        <span className="text-slate-500 font-mono">{s.log_count}</span>
                                                    </td>
                                                    <td className="px-3 py-3 hidden lg:table-cell">
                                                        <span className="text-[9px] text-slate-500 truncate block max-w-[200px]" title={s.last_log || ''}>
                                                            {s.last_log || '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ═══════════════ 4. ORDERS & TRADES ═══════════════ */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <ArrowUpDown className="w-4 h-4" /> Orders & Trades
                            </h3>
                            <div className="flex items-center gap-3 text-[10px]">
                                <span className="text-blue-400 font-black">{ot?.total_open ?? 0} open</span>
                                <span className="text-slate-600">|</span>
                                <span className="text-slate-400">{ot?.total_closed ?? 0} closed</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Open Trades */}
                            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Play className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Open Positions</span>
                                </div>
                                {openTrades.length === 0 ? (
                                    <div className="text-center py-8 text-slate-600 text-xs">No open trades</div>
                                ) : (
                                    <div className="space-y-2">
                                        {openTrades.map((t, i) => (
                                            <div key={i} className="bg-black/20 rounded-xl p-3 flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-xs">{t.pair}</span>
                                                        <span className={cn(
                                                            'text-[8px] font-black uppercase px-1.5 py-0.5 rounded',
                                                            t.side === 'long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                        )}>
                                                            {t.side}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 mt-1">
                                                        #{t.trade_id} · ${t.stake_amount?.toFixed(0)} · {t.source}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <PnlBadge value={t.profit_abs} />
                                                    <div className="text-[9px] text-slate-500 mt-0.5">
                                                        {t.profit_pct?.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(ot?.total_open ?? 0) > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px]">
                                        <span className="text-slate-500">Aggregate Open P&L</span>
                                        <PnlBadge value={ot?.aggregate_open_pnl ?? 0} />
                                    </div>
                                )}
                            </div>

                            {/* Recent Closed Trades */}
                            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Closed</span>
                                </div>
                                {closedTrades.length === 0 ? (
                                    <div className="text-center py-8 text-slate-600 text-xs">No closed trades yet</div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {closedTrades.map((t, i) => (
                                            <div key={i} className="bg-black/20 rounded-xl p-3 flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-xs">{t.pair}</span>
                                                        {t.exit_reason && (
                                                            <span className="text-[8px] text-slate-500 font-mono">{t.exit_reason}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 mt-1">
                                                        #{t.trade_id} · {t.close_date?.slice(0, 16)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <PnlBadge value={t.profit_abs} />
                                                    <div className="text-[9px] text-slate-500 mt-0.5">
                                                        {t.profit_pct?.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(ot?.total_closed ?? 0) > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px]">
                                        <span className="text-slate-500">Aggregate Closed P&L</span>
                                        <PnlBadge value={ot?.aggregate_closed_pnl ?? 0} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════ FOOTER ═══════════════ */}
                    <div className="flex items-center justify-between text-[10px] text-slate-600 pt-2 border-t border-white/5">
                        <span className="font-mono">
                            {lastRefresh && `Last refresh: ${lastRefresh.toLocaleTimeString()}`}
                        </span>
                        <span className="font-black uppercase tracking-widest">Auto-refresh: 10s</span>
                    </div>
                </>
            )}
        </div>
    );
}
