'use client';

import { useState, useEffect } from 'react';
import {
    Play,
    Square,
    Activity,
    Cpu,
    TrendingUp,
    Clock,
    AlertTriangle,
    Zap,
    ExternalLink,
    Ghost,
    ShieldAlert,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bot } from '@/types/bot';
import { useStore } from '@/store/useStore';
import { backendApi } from '@/lib/backend-api';
import { toast } from 'sonner';

interface NexoraBotCardProps {
    bot: Bot;
    onClick: () => void;
}

export default function NexoraBotCard({ bot, onClick }: NexoraBotCardProps) {
    const { updateBotStatus, fetchBots, groups } = useStore();
    const [isLoading, setIsLoading] = useState(false);

    // Group Color
    const group = groups.find(g => g.bots?.some((b: any) => b.id === bot.id));
    const groupColor = group?.color || '#475569';

    // Transitioning state
    const isTransitioning = bot.status === 'starting' || bot.status === 'stopping' || isLoading;

    // Toggle logic
    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoading) return;

        setIsLoading(true);
        const action = bot.status === 'running' ? 'stop' : 'start';
        const targetStatus = bot.status === 'running' ? 'stopped' : 'running';

        updateBotStatus(bot.id, bot.status === 'running' ? 'stopping' : 'starting');
        const loadingId = toast.loading(`${action === 'stop' ? 'Stopping' : 'Starting'} ${bot.name}...`);

        try {
            await backendApi.post(`/bots/${bot.id}/${action}`);
            updateBotStatus(bot.id, targetStatus);
            toast.dismiss(loadingId);
            toast.success(`Bot ${action === 'stop' ? 'Stopped' : 'Started'}`);
            await fetchBots();
        } catch (error: any) {
            updateBotStatus(bot.id, bot.status);
            toast.dismiss(loadingId);
            toast.error(`Execution Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Uptime calculation (shorter version)
    const [uptime, setUptime] = useState('<1m');
    useEffect(() => {
        if (bot.status !== 'running' || !bot.startedAt) {
            setUptime('Offline');
            return;
        }
        const interval = setInterval(() => {
            const diff = Math.floor((Date.now() - new Date(bot.startedAt!).getTime()) / 1000);
            if (diff < 60) setUptime('<1m');
            else if (diff < 3600) setUptime(`${Math.floor(diff / 60)}m`);
            else setUptime(`${Math.floor(diff / 3600)}h`);
        }, 10000);
        return () => clearInterval(interval);
    }, [bot.status, bot.startedAt]);

    const statusConfig = {
        running: {
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            iconColor: 'bg-emerald-500'
        },
        stopped: {
            color: 'text-slate-500',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20',
            iconColor: 'bg-slate-500'
        },
        error: {
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            iconColor: 'bg-rose-500'
        },
        starting: {
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            iconColor: 'bg-blue-500 animate-pulse'
        },
        stopping: {
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            iconColor: 'bg-amber-500 animate-pulse'
        }
    }[bot.status] || {
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        iconColor: 'bg-yellow-500'
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#0b1120]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-white/10 hover:bg-[#0b1120]/80 transition-all duration-500 cursor-pointer shadow-xl overflow-hidden"
        >
            {/* Group Accent */}
            <div
                className="absolute top-0 left-0 w-full h-1 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: groupColor }}
            />

            {/* Heartbeat Background Pulse */}
            {bot.status === 'running' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 duration-500",
                        bot.status === 'running' ? "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/5 border-white/5 text-slate-600",
                        bot.isOrphaned && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                        bot.isNexoraInternal && "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}>
                        {bot.isOrphaned ? <Ghost className="w-5 h-5" /> : bot.isNexoraInternal ? <Activity className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                    </div>
                    {bot.isOrphaned && (
                        <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-500 border border-rose-500/30">
                            Orphaned
                        </div>
                    )}
                    {bot.isNexoraInternal && (
                        <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Internal
                        </div>
                    )}
                </div>
                {!bot.isNexoraInternal && (
                    <button
                        onClick={handleToggle}
                        disabled={isTransitioning}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                            bot.status === 'running'
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                        )}
                    >
                        {isTransitioning ? (
                            <Zap className="w-4 h-4 animate-spin" />
                        ) : bot.status === 'running' ? (
                            <Square className="w-4 h-4 fill-current" />
                        ) : (
                            <Play className="w-4 h-4 fill-current ml-1" />
                        )}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                        {bot.name}
                    </h3>
                    <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.iconColor, bot.status === 'running' && "animate-pulse")} />
                </div>
                <p className="text-[10px] font-mono text-slate-500 uppercase truncate">
                    {bot.strategy}
                </p>
            </div>

            {/* PnL Indicator */}
            <div className="mb-6 py-4 border-y border-white/5">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Session Profit</div>
                        <div className={cn(
                            "text-xl font-black font-mono",
                            (bot.performance?.total_pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-500"
                        )}>
                            {(bot.performance?.total_pnl || 0) >= 0 ? '+' : ''}${Math.abs(bot.performance?.total_pnl || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{uptime}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {bot.exchange?.replace('_paper_trade', '')}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Dynamic Interactive Glow */}
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors pointer-events-none" />
        </div>
    );
}
