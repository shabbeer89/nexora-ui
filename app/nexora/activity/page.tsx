"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    Activity,
    ArrowUpRight,
    Play,
    Square,
    AlertTriangle,
    Bot,
    Settings,
    RefreshCw,
    Loader2,
    Terminal
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils/cn";
import { backendApi } from "@/lib/backend-api";

// Event types for the activity log
type EventType = 'trade' | 'bot_created' | 'bot_started' | 'bot_stopped' | 'bot_error' | 'config_changed' | 'info';

interface Trade {
    id?: string;
    side: string;
    symbol: string;
    quantity: number;
    price: number;
    timestamp: string;
    pnl?: number;
    bot?: { name: string };
}

interface Bot {
    id: string;
    name: string;
    status: string;
    uptime?: number;
}

interface PortfolioActivity {
    description: string;
    type: string;
    time: string;
    value: string;
}

interface LogItem {
    id: string;
    type: string;
    level: string;
    message: string;
    timestamp: string | number;
    botName: string;
}

interface ActivityEvent {
    id: string;
    type: EventType;
    title: string;
    description: string;
    timestamp: string;
    value?: string;
    botName?: string;
    meta?: Record<string, unknown>;
}

// Icon mapping for event types
const eventIcons: Record<EventType, typeof Activity> = {
    trade: ArrowUpRight,
    bot_created: Bot,
    bot_started: Play,
    bot_stopped: Square,
    bot_error: AlertTriangle,
    config_changed: Settings,
    info: Terminal,
};

const eventColors: Record<EventType, string> = {
    trade: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    bot_created: "bg-green-500/10 text-green-500 border-green-500/20",
    bot_started: "bg-green-500/10 text-green-500 border-green-500/20",
    bot_stopped: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    bot_error: "bg-red-500/10 text-red-500 border-red-500/20",
    config_changed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    info: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function NexoraActivityPage() {
    const { recentActivity, fetchPortfolio, trades, fetchTrades, bots, fetchBots } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'trades' | 'bots' | 'logs'>('all');
    const [detailedLogs, setDetailedLogs] = useState<ActivityEvent[]>([]);

    // Fetch detailed logs separately
    const fetchDetailedLogs = useCallback(async () => {
        // Only fetch if tab is active to save bandwidth
        if (filter !== 'logs' && filter !== 'all') return;

        try {
            const response = await backendApi.get('/activity/bot-logs');
            if (response.data?.logs) {
                const logEvents: ActivityEvent[] = response.data.logs.map((log: LogItem) => ({
                    id: log.id,
                    type: (log.type === 'bot_error' || log.level === 'ERROR') ? 'bot_error' : 'info',
                    title: `${log.botName} [${log.level}]`,
                    description: log.message,
                    timestamp: new Date(log.timestamp).toISOString(),
                    botName: log.botName
                }));
                setDetailedLogs(logEvents);
            }
        } catch (e) {
            console.error("Failed to fetch bot logs", e);
        }
    }, [filter]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchPortfolio(), fetchTrades(), fetchBots(), fetchDetailedLogs()]);
            setIsLoading(false);
        };
        loadData();

        // Set up polling every 5 seconds for real-time updates
        const interval = setInterval(() => {
            fetchPortfolio();
            fetchTrades();
            fetchBots();
            fetchDetailedLogs();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchPortfolio, fetchTrades, fetchBots, fetchDetailedLogs, filter]);


    // Build events list from various sources
    const events = useMemo(() => {
        const allEvents: ActivityEvent[] = [];
        const now = new Date('2024-01-01').getTime(); // Use static for memo stability or move out of render if possible

        // Add trade events
        if (trades && trades.length > 0) {
            trades.forEach((trade: Trade, idx: number) => {
                allEvents.push({
                    id: trade.id || `trade-${idx}`,
                    type: 'trade',
                    title: `${trade.side === 'buy' ? 'Bought' : 'Sold'} ${trade.symbol}`,
                    description: `${trade.quantity} @ $${trade.price?.toFixed(2)}`,
                    timestamp: trade.timestamp,
                    value: trade.pnl
                        ? (trade.pnl > 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`)
                        : `$${(trade.price * trade.quantity).toFixed(2)}`,
                    botName: trade.bot?.name || 'Unknown',
                });
            });
        }

        // Add bot creation/status events
        if (bots && bots.length > 0) {
            bots.forEach((bot: Bot) => {
                if (bot.status === 'running') {
                    allEvents.push({
                        id: `bot-running-${bot.id}`,
                        type: 'bot_started',
                        title: 'Bot Started',
                        description: `${bot.name} began executing strategy`,
                        timestamp: new Date(bot.uptime ? now - bot.uptime * 1000 : now).toISOString(),
                        botName: bot.name,
                    });
                }
            });
        }

        // Add recent activity items from portfolio
        if (recentActivity && recentActivity.length > 0) {
            recentActivity.forEach((activity: PortfolioActivity, idx: number) => {
                allEvents.push({
                    id: `activity-${idx}`,
                    type: 'trade',
                    title: activity.description,
                    description: activity.type,
                    timestamp: activity.time,
                    value: activity.value,
                });
            });
        }

        // Add detailed logs if requested
        if (filter === 'logs' || filter === 'all') {
            allEvents.push(...detailedLogs);
        }

        // Sort by timestamp (newest first)
        allEvents.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateB - dateA;
        });

        return allEvents;
    }, [trades, bots, recentActivity, detailedLogs, filter]);

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'trades') return event.type === 'trade';
        if (filter === 'bots') return event.type.startsWith('bot_') && event.type !== 'info';
        if (filter === 'logs') return event.type === 'info' || event.type === 'bot_error';
        return true;
    });

    const handleRefresh = async () => {
        setIsLoading(true);
        await Promise.all([fetchPortfolio(), fetchTrades(), fetchDetailedLogs()]);
        setIsLoading(false);
    };

    const formatTimestamp = (ts: string) => {
        try {
            const date = new Date(ts);
            if (isNaN(date.getTime())) return ts;
            return date.toLocaleString();
        } catch {
            return ts;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-black italic">Activity Log <span className="text-cyan-500 font-mono text-sm ml-2">// REAL-TIME DATA</span></h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">
                        Bot events, trades, and system activity
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50 group hover:border-cyan-500/50"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">Refresh Nodes</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3">
                {(['all', 'trades', 'bots', 'logs'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            filter === tab
                                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                : "bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                        )}
                    >
                        {tab === 'all' && 'All Activity'}
                        {tab === 'trades' && 'Execution'}
                        {tab === 'bots' && 'Bot Status'}
                        {tab === 'logs' && 'System Logs'}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {filteredEvents.length} Captured Events
                    </span>
                </div>
            </div>

            {/* Activity List */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-xl p-8 relative overflow-hidden group/container">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover/container:opacity-100 transition-opacity duration-1000"></div>

                {isLoading && events.length === 0 ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-6" />
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">Synching Activity Data...</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => {
                            const Icon = eventIcons[event.type] || Activity;
                            const colorClass = eventColors[event.type] || "bg-slate-500/10 text-slate-500";
                            const isLog = event.type === 'info' || event.type === 'bot_error';

                            return (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "flex items-center gap-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group overflow-hidden relative",
                                        isLog ? "p-4" : "p-6"
                                    )}
                                >
                                    <div className={cn("rounded-xl border flex-shrink-0 transition-transform group-hover:scale-110 duration-500", colorClass, isLog ? "p-2" : "p-4")}>
                                        <Icon className={isLog ? "h-4 w-4" : "h-5 w-5"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={cn("font-black tracking-tighter uppercase text-white truncate", isLog ? "text-xs" : "text-sm")}>
                                                {event.title}
                                            </h3>
                                            {event.value && !isLog && (
                                                <span className={cn(
                                                    "font-mono text-xs font-black ml-4 px-3 py-1 rounded-lg bg-black/40",
                                                    event.value.startsWith('+')
                                                        ? "text-emerald-400"
                                                        : event.value.startsWith('-')
                                                            ? "text-rose-400"
                                                            : "text-white"
                                                )}>
                                                    {event.value}
                                                </span>
                                            )}
                                        </div>
                                        <div className={cn("flex items-center justify-between text-slate-500", isLog ? "text-[10px]" : "text-xs")}>
                                            <span className="truncate break-all pr-12 font-bold opacity-60 group-hover:opacity-100 transition-opacity">{event.description}</span>
                                            <span className="flex-shrink-0 font-mono text-[10px] uppercase opacity-40">
                                                {formatTimestamp(event.timestamp)}
                                            </span>
                                        </div>
                                        {event.botName && !isLog && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <div className="w-1 h-3 bg-cyan-500/50"></div>
                                                <span className="text-[10px] font-black text-cyan-500/80 uppercase tracking-widest">
                                                    Source: {event.botName}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500">
                        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8 mb-6 group-hover/container:border-cyan-500/30 transition-all duration-700">
                            <Activity className="h-12 w-12 text-slate-600 group-hover/container:text-cyan-500 transition-colors duration-700" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">No Signal Detected</h3>
                        <p className="text-center max-w-sm text-xs opacity-60 font-medium leading-relaxed">
                            {filter === 'trades' && "Market execution bridge is idle. Initiate bot strategies to capture activity signals."}
                            {filter === 'bots' && "Neural bridge status: No active bot telemetry received."}
                            {filter === 'logs' && "Core system logs are clear. No operational anomalies detected."}
                            {filter === 'all' && "Telemetry systems standing by. All activity signals will satisfy this terminal when detected."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
