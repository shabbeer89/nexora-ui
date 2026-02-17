'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import {
    Plus,
    Search,
    Zap,
    Cpu,
    Globe,
    Activity,
    CheckCircle2,
    Database,
    Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NexoraBotCard from './NexoraBotCard';

interface FleetOrchestrationProps {
    onSelectBot: (botId: string) => void;
    onCreateNew: () => void;
}

export default function FleetOrchestration({ onSelectBot, onCreateNew }: FleetOrchestrationProps) {
    const { bots, groups, fetchBots, fetchGroups } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'error'>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    useEffect(() => {
        fetchBots();
        fetchGroups();
    }, [fetchBots, fetchGroups]);

    // 1. FILTERING
    const filteredBots = bots.filter(bot => {
        const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.strategy?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;

        let matchesGroup = true;
        if (selectedGroupId) {
            const group = groups.find(g => g.id === selectedGroupId);
            matchesGroup = group?.bots?.some((b: any) => b.id === bot.id) ?? false;
        }

        return matchesSearch && matchesStatus && matchesGroup;
    });

    // 2. SEGMENTATION
    // Strategy Bots: Normal user bots (not internal, not infra)
    const strategyBots = filteredBots.filter(b =>
        !b.isNexoraInternal && !b.name.startsWith('hummingbot-')
    );

    // Infrastructure: Core services (API, DB, MQTT)
    const infraBots = filteredBots.filter(b =>
        b.name.startsWith('hummingbot-')
    );

    // Internal Threads: connectors/bg tasks
    const internalBots = filteredBots.filter(b =>
        b.isNexoraInternal
    );

    const activeCount = bots.filter(b => b.status === 'running').length;
    const stoppedCount = bots.filter(b => b.status === 'stopped').length;
    const orphanedCount = (bots as any[]).filter(b => b.isOrphaned).length;
    const internalCount = (bots as any[]).filter(b => b.isNexoraInternal).length;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-32">

            {/* --- HEADER STATS (UNCHANGED) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatusCard
                    icon={Cpu} color="blue" label="Fleet Repository" value={bots.length}
                    subText={<><span className="text-emerald-400">{activeCount} Up</span> <span className="text-slate-500">{stoppedCount} Down</span></>}
                />
                <StatusCard
                    icon={Activity} color="emerald" label="Operational" value={activeCount}
                    subText={`${activeCount} engines active in cluster`}
                />
                {orphanedCount > 0 && (
                    <StatusCard
                        icon={CheckCircle2} color="rose" label="Ghost / Orphaned" value={orphanedCount}
                        subText="Active containers without configuration files"
                    />
                )}
                <StatusCard
                    icon={Globe} color="amber" label="Nexora Threads" value={internalCount}
                    subText="Active process threads managing engine communications"
                />
            </div>

            {/* --- CONTROLS --- */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-4 flex flex-col lg:row gap-4 items-center flex-wrap lg:flex-nowrap">
                {/* Search */}
                <div className="relative flex-1 w-full lg:w-auto">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Scan Fleet..."
                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all font-mono"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full lg:w-auto">
                    {(['all', 'running', 'stopped', 'error'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                statusFilter === status ? "bg-white/10 text-white shadow-xl" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Deploy Button */}
                <button
                    onClick={onCreateNew}
                    className="w-full lg:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                >
                    <Plus className="w-4 h-4" />
                    Deploy New Mission
                </button>
            </div>

            {/* --- SECTORS --- */}

            {/* 1. ACTIVE STRATEGIES */}
            <BotSector
                title="Active Strategies"
                icon={Zap}
                count={strategyBots.length}
                bots={strategyBots}
                onSelect={onSelectBot}
                color="emerald"
            />

            {/* 2. GLOBAL INFRASTRUCTURE */}
            {infraBots.length > 0 && (
                <BotSector
                    title="Global Infrastructure"
                    icon={Database}
                    count={infraBots.length}
                    bots={infraBots}
                    onSelect={onSelectBot}
                    color="slate"
                />
            )}

            {/* 3. INTERNAL CONNECTORS */}
            {internalBots.length > 0 && (
                <BotSector
                    title="Internal Connectors"
                    icon={Network}
                    count={internalBots.length}
                    bots={internalBots}
                    onSelect={onSelectBot}
                    color="blue"
                />
            )}

            {filteredBots.length === 0 && (
                <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-8 h-8 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.3em]">No Signal Detected</h3>
                    <p className="text-slate-600 mt-2 text-sm font-mono">No bots match filters</p>
                </div>
            )}
        </div>
    );
}

// Sub-components
function StatusCard({ icon: Icon, color, label, value, subText }: any) {
    const colors = {
        blue: "text-blue-400 opacity-10 group-hover:opacity-20",
        emerald: "text-emerald-400 opacity-10 group-hover:opacity-20",
        rose: "text-rose-400 opacity-10 group-hover:opacity-20",
        amber: "text-amber-400 opacity-10 group-hover:opacity-20"
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 transition-opacity ${colors[color as keyof typeof colors]}`}>
                <Icon className="w-12 h-12" />
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-3xl font-black text-${color}-400`}>{value}</div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 flex gap-2 items-center">
                {subText}
            </div>
        </div>
    );
}

function BotSector({ title, icon: Icon, count, bots, onSelect, color }: any) {
    if (bots.length === 0) return null;

    const headerColor = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        slate: "text-slate-400 bg-slate-500/10 border-slate-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    }[color as string] || "text-white";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg border", headerColor)}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
                <div className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-mono text-slate-400">
                    {count} NODES
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {bots.map((bot: any) => (
                    <NexoraBotCard
                        key={bot.id}
                        bot={bot}
                        onClick={() => onSelect(bot.id)}
                    />
                ))}
            </div>
        </div>
    );
}
