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

export default function ActivityPage() {
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
    }, [fetchPortfolio, fetchTrades, fetchBots, fetchDetailedLogs, filter]); // Added filter to re-trigger if needed, though setInterval covers it


    // Build events list from various sources
    // Derived state - no need for useEffect/useState
    const events = useMemo(() => {
        const allEvents: ActivityEvent[] = [];
        const now = Date.now(); // eslint-disable-line react-hooks/purity

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

        // Add bot creation/status events (simulated from bot list for demo)
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
                    <h2 className="text-2xl font-bold tracking-tight text-white">Activity Log</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Bot events, trades, and system activity
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'trades', 'bots', 'logs'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filter === tab
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                    >
                        {tab === 'all' && 'All Events'}
                        {tab === 'trades' && 'Trades'}
                        {tab === 'bots' && 'Status'}
                        {tab === 'logs' && 'Logs'}
                    </button>
                ))}
                <div className="ml-auto text-sm text-slate-500">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Activity List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                {isLoading && events.length === 0 ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-400">Loading activity...</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="space-y-3">
                        {filteredEvents.map((event) => {
                            const Icon = eventIcons[event.type] || Activity;
                            const colorClass = eventColors[event.type] || "bg-slate-500/10 text-slate-500";
                            // Dense mode for log entries
                            const isLog = event.type === 'info' || event.type === 'bot_error';

                            return (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "flex items-center gap-4 rounded-lg bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors group",
                                        isLog ? "p-2.5" : "p-4"
                                    )}
                                >
                                    <div className={cn("rounded-full border flex-shrink-0", colorClass, isLog ? "p-1.5" : "p-2.5")}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className={cn("font-medium text-white truncate", isLog ? "text-xs" : "text-sm")}>
                                                {event.title}
                                            </h3>
                                            {event.value && !isLog && (
                                                <span className={cn(
                                                    "font-mono text-sm font-medium ml-4",
                                                    event.value.startsWith('+')
                                                        ? "text-green-400"
                                                        : event.value.startsWith('-')
                                                            ? "text-red-400"
                                                            : "text-white"
                                                )}>
                                                    {event.value}
                                                </span>
                                            )}
                                        </div>
                                        <div className={cn("flex items-center justify-between text-slate-500", isLog ? "text-[11px]" : "text-xs")}>
                                            <span className="truncate break-all pr-2 font-mono">{event.description}</span>
                                            <span className="flex-shrink-0 whitespace-nowrap">
                                                {formatTimestamp(event.timestamp)}
                                            </span>
                                        </div>
                                        {event.botName && !isLog && (
                                            <div className="mt-2">
                                                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                                                    {event.botName}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400">
                        <div className="rounded-full bg-slate-800 p-4 mb-4">
                            <Activity className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No Activity Found</h3>
                        <p className="text-center max-w-md">
                            {filter === 'trades' && "No trades recorded yet. Start a bot to begin trading."}
                            {filter === 'bots' && "No bot status events recorded yet."}
                            {filter === 'logs' && "No logs available. Ensure bots are running."}
                            {filter === 'all' && "Bot activity, trades, and logs will appear here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
