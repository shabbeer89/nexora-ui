'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Layers, Play, Square, AlertTriangle, RefreshCw, Loader2,
    TrendingUp, ArrowRightLeft, Shield, Zap, DollarSign, Clock,
    ChevronRight, Activity, Target, X, ChevronDown, ChevronUp,
    Terminal, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Use relative /api/ paths — routed through Next.js proxy to the droplet
const API_BASE = '';

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

interface Scenario {
    id: string;
    name: string;
    description: string;
    category: string;
    allocation: { cex: number; dex: number };
    cex_strategy: string;
    dex_strategy: string;
    status: 'inactive' | 'active' | 'running' | 'paused' | 'error';
    started_at?: string;
    pnl: number;
    cex_pnl: number;
    dex_pnl: number;
    is_auto: boolean;
    execution_log: LogEntry[];
}

interface ScenariosResponse {
    count: number;
    scenarios: Scenario[];
    timestamp: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
    momentum: <TrendingUp className="w-4 h-4" />,
    range: <Activity className="w-4 h-4" />,
    arbitrage: <ArrowRightLeft className="w-4 h-4" />,
    hedge: <Shield className="w-4 h-4" />,
    yield: <DollarSign className="w-4 h-4" />,
    emergency: <AlertTriangle className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
    momentum: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    range: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    arbitrage: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    hedge: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    yield: 'from-yellow-500/20 to-lime-500/20 border-yellow-500/30',
    emergency: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
};

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [startModal, setStartModal] = useState<string | null>(null);
    const [capital, setCapital] = useState<number>(1000);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchScenarios = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/scenarios/available`);
            if (!response.ok) throw new Error('Failed to fetch scenarios');
            const raw = await response.json();
            // Handle both {scenarios: [...]} and direct array responses
            const list = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.scenarios)
                    ? raw.scenarios
                    : [];
            setScenarios(list);
            setLastRefresh(new Date());
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load scenarios');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScenarios();
        const interval = setInterval(fetchScenarios, 10000);
        return () => clearInterval(interval);
    }, [fetchScenarios]);

    const handleStart = async (scenarioId: string) => {
        setActionLoading(scenarioId);
        setStartModal(null);
        try {
            const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capital })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to start scenario');
            }
            await fetchScenarios();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to start scenario');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStop = async (scenarioId: string) => {
        setActionLoading(scenarioId);
        try {
            const response = await fetch(`${API_BASE}/api/scenarios/${scenarioId}/stop`, {
                method: 'POST'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to stop scenario');
            }
            await fetchScenarios();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to stop scenario');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEmergency = async () => {
        if (!confirm('⚠️ EMERGENCY SHUTDOWN\n\nThis will stop ALL active scenarios and close ALL positions.\n\nAre you sure?')) {
            return;
        }
        setActionLoading('emergency');
        try {
            const response = await fetch(`${API_BASE}/api/scenarios/emergency`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to trigger emergency');
            await fetchScenarios();
            alert('🚨 Emergency shutdown executed. All positions closed.');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to trigger emergency');
        } finally {
            setActionLoading(null);
        }
    };

    const activeCount = scenarios.filter(s => s.status === 'running' || s.status === 'active').length;
    const totalPnl = scenarios.reduce((sum, s) => sum + (s.pnl || 0), 0);

    const groupedScenarios = scenarios.reduce((acc, scenario) => {
        if (!acc[scenario.category]) acc[scenario.category] = [];
        acc[scenario.category].push(scenario);
        return acc;
    }, {} as Record<string, Scenario[]>);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Layers className="w-8 h-8 text-cyan-500" />
                        Multi-Bot Scenarios <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// ORCHESTRATOR</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        CEX + DEX collaboration strategies • {scenarios.length} scenarios available
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Total P&L */}
                    {activeCount > 0 && (
                        <div className="px-4 py-2 rounded-xl border border-white/10 bg-slate-900/50">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Total P&L</span>
                            <span className={cn(
                                "text-sm font-black",
                                totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Active Count */}
                    <div className={cn(
                        "px-4 py-2 rounded-xl border",
                        activeCount > 0
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-slate-500/30 bg-slate-500/10'
                    )}>
                        <span className={cn(
                            "text-xs font-black uppercase",
                            activeCount > 0 ? 'text-emerald-400' : 'text-slate-400'
                        )}>
                            {activeCount} Active
                        </span>
                    </div>

                    {/* Emergency Button */}
                    <button
                        onClick={handleEmergency}
                        disabled={actionLoading === 'emergency'}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 
                                   font-black uppercase text-xs hover:bg-rose-500/30 transition-all
                                   disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading === 'emergency' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <AlertTriangle className="w-4 h-4" />
                        )}
                        Emergency Stop
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={fetchScenarios}
                        disabled={loading}
                        aria-label="Refresh Scenarios"
                        className="p-2 rounded-lg bg-slate-900/40 border border-white/5 hover:border-white/20 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <div>
                        <div className="text-sm font-bold text-rose-400">Connection Failed</div>
                        <div className="text-xs text-rose-300/70">{error}</div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && scenarios.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
            ) : (
                /* Scenarios by Category */
                Object.entries(groupedScenarios).map(([category, categoryScenarios]) => (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">{categoryIcons[category]}</span>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {category}
                            </h3>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            {categoryScenarios.map((scenario) => (
                                <ScenarioCard
                                    key={scenario.id}
                                    scenario={scenario}
                                    isLoading={actionLoading === scenario.id}
                                    isExpanded={expandedCards.has(scenario.id)}
                                    onToggleExpand={() => toggleExpand(scenario.id)}
                                    onStart={() => {
                                        setStartModal(scenario.id);
                                        setCapital(1000);
                                    }}
                                    onStop={() => handleStop(scenario.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Start Modal */}
            {startModal && (
                <StartScenarioModal
                    scenario={scenarios.find(s => s.id === startModal)!}
                    capital={capital}
                    onCapitalChange={setCapital}
                    onConfirm={() => handleStart(startModal)}
                    onCancel={() => setStartModal(null)}
                />
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">
                    {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
                </span>
                <span className="font-black uppercase tracking-widest">Auto-refresh: 10s</span>
            </div>
        </div>
    );
}

// ============================================
// Start Scenario Modal
// ============================================

interface StartModalProps {
    scenario: Scenario;
    capital: number;
    onCapitalChange: (v: number) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

function StartScenarioModal({ scenario, capital, onCapitalChange, onConfirm, onCancel }: StartModalProps) {
    const cexAmount = capital * scenario.allocation.cex;
    const dexAmount = capital * scenario.allocation.dex;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Play className="w-5 h-5 text-emerald-400" />
                        Start Scenario
                    </h3>
                    <button onClick={onCancel} aria-label="Close modal" className="p-1 rounded-lg hover:bg-white/5">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 space-y-1">
                    <div className="text-sm font-black text-white">{scenario.name}</div>
                    <div className="text-xs text-slate-400">{scenario.description}</div>
                </div>

                {/* Capital Input */}
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> Total Capital (USD)
                    </label>
                    <input
                        type="number"
                        value={capital}
                        onChange={(e) => onCapitalChange(Number(e.target.value))}
                        min={100}
                        step={100}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white 
                                   font-mono text-sm focus:border-cyan-500/50 focus:outline-none focus:ring-1 
                                   focus:ring-cyan-500/30 transition-all"
                    />
                    <div className="grid grid-cols-4 gap-2">
                        {[1000, 5000, 10000, 25000].map(v => (
                            <button
                                key={v}
                                onClick={() => onCapitalChange(v)}
                                className={cn(
                                    "text-[10px] font-bold py-1.5 rounded-lg border transition-all",
                                    capital === v
                                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                                        : "border-white/5 bg-slate-800/50 text-slate-500 hover:border-white/20"
                                )}
                            >
                                ${v.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Allocation Preview */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">CEX Allocation</div>
                        <div className="text-sm font-black text-cyan-400">${cexAmount.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500">{scenario.cex_strategy}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                        <div className="text-[9px] text-slate-500 uppercase font-bold">DEX Allocation</div>
                        <div className="text-sm font-black text-purple-400">${dexAmount.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500">{scenario.dex_strategy}</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 
                                   font-bold text-xs uppercase hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 
                                   text-emerald-400 font-black text-xs uppercase hover:bg-emerald-500/30 
                                   transition-all flex items-center justify-center gap-2"
                    >
                        <Play className="w-3.5 h-3.5" />
                        Start with ${capital.toLocaleString()}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Scenario Card
// ============================================

interface ScenarioCardProps {
    scenario: Scenario;
    isLoading: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onStart: () => void;
    onStop: () => void;
}

const timeAgo = (date?: string) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
};

function ScenarioCard({ scenario, isLoading, isExpanded, onToggleExpand, onStart, onStop }: ScenarioCardProps) {
    const isActive = scenario.status === 'running' || scenario.status === 'active';
    const isEmergency = scenario.id === 'emergency';

    // Derived metadata
    const stopLoss = (scenario as any).risk_params?.stop_loss || 0.05;
    const pair = (scenario as any).pair || 'BTC/USDT';

    return (
        <div className={cn(
            "rounded-2xl border p-5 transition-all relative overflow-hidden flex flex-col h-full",
            "bg-gradient-to-br",
            categoryColors[scenario.category] || 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
            isActive && "ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
        )}>
            {/* Status Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                {isActive && (
                    <span className="text-[9px] font-black text-emerald-400 animate-pulse uppercase">LIVE</span>
                )}
                <div className={cn(
                    "w-3 h-3 rounded-full",
                    isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-600"
                )} />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
                    {categoryIcons[scenario.category]}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{scenario.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {pair}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                            SL: {(stopLoss * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Stats / Allocation */}
            <div className="space-y-3 flex-1">
                {/* Allocation row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl p-2.5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-slate-500 uppercase font-black">CEX</span>
                            <span className="text-[10px] font-black text-cyan-400">{(scenario.allocation.cex * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-300 truncate">{scenario.cex_strategy}</div>
                    </div>
                    <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl p-2.5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-slate-500 uppercase font-black">DEX</span>
                            <span className="text-[10px] font-black text-purple-400">{(scenario.allocation.dex * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-300 truncate">{scenario.dex_strategy}</div>
                    </div>
                </div>

                {/* Performance row (if active) */}
                {isActive ? (
                    <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 uppercase font-bold">Trading Capital</span>
                                <span className="text-xs font-black text-white">${(scenario as any).capital?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block">Profit (P&L)</span>
                                <span className={cn(
                                    "font-black text-sm",
                                    scenario.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {scenario.pnl >= 0 ? '+' : ''}${scenario.pnl.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all", scenario.pnl >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                                style={{ width: `${Math.min(100, Math.abs(scenario.pnl / (scenario as any).capital * 1000))}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                CEX: <span className={cn("font-bold", scenario.cex_pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>${scenario.cex_pnl.toFixed(2)}</span>
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                DEX: <span className={cn("font-bold", scenario.dex_pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>${scenario.dex_pnl.toFixed(2)}</span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-950/20 border border-dashed border-white/5 rounded-xl flex items-center justify-center p-6 grayscale">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Waiting for Signal</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 space-y-2">
                {isEmergency ? (
                    <button
                        onClick={onStart}
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 
                                   text-rose-400 font-black uppercase text-xs hover:bg-rose-500/40 
                                   transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><AlertTriangle className="w-4 h-4" /> Trigger Emergency</>}
                    </button>
                ) : isActive ? (
                    <button
                        onClick={onStop}
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30 
                                   text-orange-400 font-black uppercase text-xs hover:bg-orange-500/40 
                                   transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Square className="w-3.5 h-3.5" /> Stop Strategy</>}
                    </button>
                ) : (
                    <button
                        onClick={onStart}
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 
                                   text-emerald-400 font-black uppercase text-xs hover:bg-emerald-500/40 
                                   transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3.5 h-3.5" /> Deploy Scenario</>}
                    </button>
                )}

                {/* Footer Metadata */}
                <div className="flex items-center justify-between">
                    <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {isActive ? `Uptime: ${timeAgo(scenario.started_at)}` : 'READY'}
                    </div>
                    {isActive && scenario.execution_log?.length > 0 && (
                        <button
                            onClick={onToggleExpand}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all flex items-center gap-1",
                                isExpanded ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                            )}
                        >
                            <Terminal className="w-3 h-3" />
                            Log
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Execution Log */}
            {isExpanded && isActive && scenario.execution_log?.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-white/10 shadow-inner max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] text-cyan-400 uppercase font-black flex items-center gap-1.5">
                            <Terminal className="w-3 h-3" /> Real-time Execution
                        </div>
                        <span className="text-[8px] font-mono text-slate-600 uppercase">Live Feed</span>
                    </div>
                    <div className="space-y-1.5">
                        {scenario.execution_log.slice(-20).map((entry, i) => (
                            <div key={i} className="text-[9px] font-mono leading-tight flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-slate-600 shrink-0">
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={cn(
                                    "break-words",
                                    entry.level === 'error' ? 'text-rose-400' : 'text-slate-300'
                                )}>
                                    {typeof entry.message === 'string'
                                        ? entry.message
                                        : JSON.stringify(entry.message)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
