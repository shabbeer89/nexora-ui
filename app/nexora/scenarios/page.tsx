'use client';

import React, { useState, useEffect } from 'react';
import {
    Layers, Play, Square, AlertTriangle, RefreshCw, Loader2,
    TrendingUp, ArrowRightLeft, Shield, Zap, DollarSign, Clock,
    ChevronRight, Activity, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    is_auto: boolean;
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

    const fetchScenarios = async () => {
        try {
            const response = await fetch('http://localhost:8888/api/scenarios/available');
            if (!response.ok) throw new Error('Failed to fetch scenarios');
            const data: ScenariosResponse = await response.json();
            setScenarios(data.scenarios);
            setLastRefresh(new Date());
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load scenarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScenarios();
        const interval = setInterval(fetchScenarios, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleStart = async (scenarioId: string) => {
        setActionLoading(scenarioId);
        try {
            const response = await fetch(`http://localhost:8888/api/scenarios/${scenarioId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capital: 10000 })
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
            const response = await fetch(`http://localhost:8888/api/scenarios/${scenarioId}/stop`, {
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
            const response = await fetch('http://localhost:8888/api/scenarios/emergency', {
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryScenarios.map((scenario) => (
                                <ScenarioCard
                                    key={scenario.id}
                                    scenario={scenario}
                                    isLoading={actionLoading === scenario.id}
                                    onStart={() => handleStart(scenario.id)}
                                    onStop={() => handleStop(scenario.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))
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

interface ScenarioCardProps {
    scenario: Scenario;
    isLoading: boolean;
    onStart: () => void;
    onStop: () => void;
}

function ScenarioCard({ scenario, isLoading, onStart, onStop }: ScenarioCardProps) {
    const isActive = scenario.status === 'running' || scenario.status === 'active';
    const isEmergency = scenario.id === 'emergency';

    return (
        <div className={cn(
            "rounded-2xl border p-5 transition-all relative overflow-hidden",
            "bg-gradient-to-br",
            categoryColors[scenario.category] || 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
            isActive && "ring-2 ring-emerald-500/50"
        )}>
            {/* Status Indicator */}
            <div className="absolute top-4 right-4">
                <div className={cn(
                    "w-3 h-3 rounded-full",
                    isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                )} />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-white/5">
                    {categoryIcons[scenario.category]}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{scenario.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{scenario.description}</p>
                </div>
            </div>

            {/* Allocation */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-slate-900/40 rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">CEX</div>
                    <div className="text-sm font-black text-cyan-400">
                        {(scenario.allocation.cex * 100).toFixed(0)}%
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">{scenario.cex_strategy}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <div className="flex-1 bg-slate-900/40 rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">DEX</div>
                    <div className="text-sm font-black text-purple-400">
                        {(scenario.allocation.dex * 100).toFixed(0)}%
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">{scenario.dex_strategy}</div>
                </div>
            </div>

            {/* P&L (if active) */}
            {isActive && (
                <div className="mb-3 p-2 rounded-lg bg-slate-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">P&L</span>
                    <span className={cn(
                        "font-black text-sm",
                        scenario.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                        {scenario.pnl >= 0 ? '+' : ''}{scenario.pnl.toFixed(2)}
                    </span>
                </div>
            )}

            {/* Auto Badge */}
            {scenario.is_auto && (
                <div className="mb-3">
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        AUTO-TRIGGERED
                    </span>
                </div>
            )}

            {/* Action Button */}
            {isEmergency ? (
                <button
                    onClick={onStart}
                    disabled={isLoading}
                    className="w-full py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 
                               text-rose-400 font-black uppercase text-xs hover:bg-rose-500/30 
                               transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <AlertTriangle className="w-4 h-4" />
                            Trigger Emergency
                        </>
                    )}
                </button>
            ) : isActive ? (
                <button
                    onClick={onStop}
                    disabled={isLoading}
                    className="w-full py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 
                               text-rose-400 font-black uppercase text-xs hover:bg-rose-500/30 
                               transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Square className="w-3 h-3" />
                            Stop
                        </>
                    )}
                </button>
            ) : (
                <button
                    onClick={onStart}
                    disabled={isLoading}
                    className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 
                               text-emerald-400 font-black uppercase text-xs hover:bg-emerald-500/30 
                               transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Play className="w-3 h-3" />
                            Start
                        </>
                    )}
                </button>
            )}

            {/* Started At */}
            {scenario.started_at && (
                <div className="mt-2 text-[9px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Started: {new Date(scenario.started_at).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}
