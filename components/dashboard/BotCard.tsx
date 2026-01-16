"use client";

import { useState, useEffect } from "react";
import { Play, Square, Loader2, Clock, TrendingUp, Activity, Trash2, FlaskConical, Pencil, BarChart3, Receipt, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Bot } from "@/types/bot";
import { cn } from "@/utils/cn";
import { useStore } from "@/store/useStore";
import { backendApi } from "@/lib/backend-api";
import { toast } from "sonner";
import { DeleteBotModal } from "@/components/ui/DeleteBotModal";
import { formatStrategyName, formatExchangeName } from "@/utils/format";

interface BotCardProps {
    bot: Bot;
}

// Helper to detect if bot is using paper trading
const isPaperTradingBot = (exchange?: string): boolean => {
    return exchange?.endsWith('_paper_trade') ?? false;
};

const useUptime = (deployedAt?: string, isRunning?: boolean): string => {
    const [uptime, setUptime] = useState<string>('<1m');

    useEffect(() => {
        if (!deployedAt || !isRunning) {
            setUptime('Offline');
            return;
        }

        const calculateUptime = () => {
            const start = new Date(deployedAt).getTime();
            const now = Date.now();
            const diff = Math.floor((now - start) / 1000);

            if (diff < 60) return '<1m';
            if (diff < 3600) return `${Math.floor(diff / 60)}m`;
            const hours = Math.floor(diff / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            return `${hours}h ${mins}m`;
        };

        // Calculate immediately
        setUptime(calculateUptime());

        // Update every 30 seconds
        const interval = setInterval(() => {
            setUptime(calculateUptime());
        }, 30000);

        return () => clearInterval(interval);
    }, [deployedAt, isRunning]);

    return uptime;
};

// Helper to get group color for a bot
const getBotGroupColor = (botId: string, groups: any[]) => {
    const group = groups.find(g => g.bots?.some((b: any) => b.id === botId));
    return group?.color;
};

export function BotCard({ bot }: BotCardProps) {
    const { updateBotStatus, fetchBots, selectedBotIds, toggleBotSelection, groups } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const uptime = useUptime(bot.startedAt || bot.deployedAt, bot.status === 'running');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isSelected = selectedBotIds.includes(bot.id);
    const groupColor = getBotGroupColor(bot.id, groups);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click/selection
        e.preventDefault();
        if (isLoading) return; // Prevent double-clicks

        setIsLoading(true);
        const action = bot.status === 'running' ? 'stop' : 'start';
        const targetStatus = bot.status === 'running' ? 'stopped' : 'running';

        // Optimistic UI update - show transitioning state immediately
        updateBotStatus(bot.id, bot.status === 'running' ? 'stopping' : 'starting');

        // Show loading toast
        const loadingId = toast.loading(
            action === 'stop' ? 'Stopping bot...' : 'Starting bot...',
            { description: bot.name }
        );

        try {
            const endpoint = bot.status === 'running'
                ? `/bots/${bot.id}/stop`
                : `/bots/${bot.id}/start`;

            await backendApi.post(endpoint);

            // After API call, update to final state
            updateBotStatus(bot.id, targetStatus);

            // Dismiss loading and show success
            toast.dismiss(loadingId);
            toast.success(
                action === 'stop' ? 'Bot Stopped' : 'Bot Started',
                {
                    description: bot.name,
                    duration: 3000,
                }
            );

            // Refresh bot list to get latest state from server
            await fetchBots();
        } catch (error: any) {
            console.error(`Failed to ${action} bot:`, error);

            // Revert to previous state on error
            updateBotStatus(bot.id, bot.status);

            // Dismiss loading and show error
            toast.dismiss(loadingId);
            toast.error(
                `Failed to ${action} bot`,
                {
                    description: error.response?.data?.error || error.message || 'Unknown error',
                    duration: 5000,
                }
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        const loadingId = toast.loading('Deleting bot...', { description: bot.name });

        try {
            await backendApi.delete(`/bots/${bot.id}`);

            toast.dismiss(loadingId);
            toast.success('Bot Deleted', { description: bot.name });

            await fetchBots();
        } catch (error: any) {
            toast.dismiss(loadingId);
            toast.error('Failed to delete bot', {
                description: error.response?.data?.error || error.message
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const statusConfig = {
        running: {
            color: "text-green-500 bg-green-500/10 border-green-500/20",
            label: "RUNNING",
            dot: "bg-green-500",
        },
        stopped: {
            color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
            label: "STOPPED",
            dot: "bg-slate-500",
        },
        stopping: {
            color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
            label: "STOPPING",
            dot: "bg-yellow-500 animate-pulse",
        },
        starting: {
            color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            label: "STARTING",
            dot: "bg-blue-500 animate-pulse",
        },
        error: {
            color: "text-red-500 bg-red-500/10 border-red-500/20",
            label: "ERROR",
            dot: "bg-red-500",
        },
    }[bot.status] || {
        color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
        label: bot.status?.toUpperCase() || "UNKNOWN",
        dot: "bg-slate-500",
    };

    const isTransitioning = bot.status === 'stopping' || bot.status === 'starting' || isLoading;

    // Extract quote currency from trading pair (e.g. BTC-USDT -> USDT)
    const getQuoteCurrency = (pair?: string) => {
        if (!pair) return '';
        const parts = pair.split('-');
        return parts.length > 1 ? parts[1] : '';
    };

    const quoteCurrency = getQuoteCurrency(bot.tradingPair || bot.config?.tradingPair);

    const formatCurrencyValue = (value: number | undefined, quote: string) => {
        if (value === undefined) return '--';

        const q = quote.toUpperCase();
        let prefix = '';
        let suffix = '';

        if (['USDT', 'USDC', 'USD', 'DAI', 'BUSD', 'FDUSD'].includes(q)) prefix = '$';
        else if (q === 'BTC' || q === 'WBTC') prefix = '₿';
        else if (q === 'ETH' || q === 'WETH') prefix = 'Ξ';
        else if (q === 'EUR') prefix = '€';
        else if (q === 'GBP') prefix = '£';
        else suffix = ` ${quote}`;

        // Format number with commas
        const formattedNum = value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: prefix ? 2 : 4 // More precision for crypto
        });

        return `${prefix}${formattedNum}${suffix}`;
    };

    return (
        <>
            <div
                className={cn(
                    "relative rounded-2xl border bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-900/60 group cursor-pointer shadow-lg hover:shadow-blue-500/10",
                    isPaperTradingBot(bot.config?.exchange)
                        ? "border-amber-500/20 shadow-amber-500/5"
                        : "border-slate-800/50 shadow-black/20",
                    isSelected && "ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10 shadow-blue-500/20"
                )}
                onClick={() => toggleBotSelection(bot.id)}
            >
                {/* Visual Accent Gradient */}
                <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-gradient-to-br",
                    (bot.performance?.total_pnl || 0) >= 0 ? "from-green-500 to-transparent" : "from-red-500 to-transparent"
                )} />
                {/* Log Status Indicators - Top Right (above checkbox) */}
                {/* Log Status Indicators - Moving Log Queue Animation */}
                <div className="absolute top-3 right-12 z-0 pointer-events-none overflow-hidden w-16 h-4 flex items-center justify-end">
                    {bot.performance?.log_counts && bot.status === 'running' && (
                        <>
                            {/* Moving dot representing log activity */}
                            <div className="absolute right-0 w-2 h-2 rounded-full bg-blue-500 animate-move-left opacity-0" />

                            {/* Static indicators for issues */}
                            <div className="flex gap-1 relative z-10 bg-slate-900/50 pl-2 backdrop-blur-[2px]">
                                {bot.performance.log_counts.errors > 0 && (
                                    <div
                                        className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                                        title={`${bot.performance.log_counts.errors} errors`}
                                    />
                                )}
                                {bot.performance.log_counts.warnings > 0 && (
                                    <div
                                        className="w-2 h-2 rounded-full bg-yellow-500"
                                        title={`${bot.performance.log_counts.warnings} warnings`}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Selection Overlay Checkbox - Moved down to avoid overlap */}
                <div className={cn(
                    "absolute top-2 right-2 z-30 transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "bg-slate-900/80 border-slate-600 hover:border-slate-400"
                    )}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                </div>

                {/* Group Indicator Line */}
                {groupColor && (
                    <div
                        className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full"
                        style={{ backgroundColor: groupColor }}
                    />
                )}

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1 pr-8">
                        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                            <Link
                                href={`/orchestration/${bot.id}`}
                                className="font-bold text-white hover:text-blue-400 transition-colors z-20 relative text-base tracking-tight truncate max-w-[140px]"
                                onClick={(e) => e.stopPropagation()}
                                title={bot.name}
                            >
                                {bot.name}
                            </Link>
                            {isPaperTradingBot(bot.config?.exchange) && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black border flex items-center gap-1 bg-amber-500/10 border-amber-500/30 text-amber-400 uppercase tracking-tighter">
                                    <FlaskConical className="w-2.5 h-2.5" />
                                    Paper
                                </span>
                            )}
                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5", statusConfig.color)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot)}></span>
                                {isTransitioning && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                {statusConfig.label}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 font-medium truncate">{formatStrategyName(bot.strategy || bot.config?.strategy)}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit Button (shown on hover when stopped) */}
                        {bot.status !== 'running' && (
                            <Link
                                href={`/orchestration/${bot.id}/edit`}
                                className={cn(
                                    "p-2 rounded-lg transition-all duration-200",
                                    "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                                    // Always visible on mobile, hover to show on desktop
                                    "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                )}
                                title="Edit bot configuration"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Pencil className="h-4 w-4" />
                            </Link>
                        )}

                        {/* Delete Button (shown on hover when stopped) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                            disabled={isDeleting || bot.status === 'running'}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-200",
                                "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                // Always visible on mobile, hover to show on desktop
                                "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                                bot.status === 'running' && "hidden"
                            )}
                            title={bot.status === 'running' ? 'Stop bot before deleting' : 'Delete bot'}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </button>

                        {/* Start/Stop Button */}
                        <button
                            onClick={handleToggle}
                            disabled={isTransitioning}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-200 flex items-center justify-center min-w-[40px] min-h-[40px]",
                                // Always visible on mobile or when selected, hover to show on desktop
                                isSelected
                                    ? "opacity-100"
                                    : "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                                bot.status === 'running' && !isTransitioning
                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    : !isTransitioning
                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                        : "bg-slate-700/50 text-slate-500",
                                isTransitioning && "opacity-70 cursor-not-allowed"
                            )}
                            title={bot.status === 'running' ? 'Stop bot' : 'Start bot'}
                        >
                            {isTransitioning ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : bot.status === 'running' ? (
                                <Square className="h-5 w-5 fill-current" />
                            ) : (
                                <Play className="h-5 w-5 fill-current" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    {/* Total P&L */}
                    <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800/30">
                        <div className="flex items-center text-slate-500 mb-1.5">
                            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Total P&L</span>
                        </div>
                        <p className={cn("text-base font-mono font-bold leading-none", (bot.performance?.total_pnl || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                            {bot.performance?.total_pnl !== undefined
                                ? `${bot.performance.total_pnl > 0 ? '+' : ''}${formatCurrencyValue(Math.abs(bot.performance.total_pnl), quoteCurrency)}`
                                : '--'}
                        </p>
                    </div>

                    {/* Logs Info */}
                    <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800/30">
                        <div className="flex items-center text-slate-500 mb-1.5">
                            <Activity className={cn("h-3.5 w-3.5 mr-1.5",
                                bot.performance?.log_counts?.errors && bot.performance.log_counts.errors > 0 ? "text-red-500" :
                                    bot.performance?.log_counts?.warnings && bot.performance.log_counts.warnings > 0 ? "text-amber-500" :
                                        bot.performance?.log_counts?.infos && bot.performance.log_counts.infos > 10 ? "text-blue-500" :
                                            "text-slate-500"
                            )} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Health</span>
                        </div>
                        <div className="font-mono flex items-center gap-2">
                            {bot.performance?.log_counts
                                ? (
                                    <div className="flex gap-1.5 text-[10px] font-bold">
                                        <span className={bot.performance.log_counts.errors > 0 ? "text-red-400" : "text-slate-700"}>E:{bot.performance.log_counts.errors}</span>
                                        <span className={bot.performance.log_counts.warnings > 0 ? "text-amber-400" : "text-slate-700"}>W:{bot.performance.log_counts.warnings}</span>
                                        <span className={bot.performance.log_counts.infos > 10 ? "text-blue-400" : "text-slate-700"}>I:{bot.performance.log_counts.infos}</span>
                                    </div>
                                )
                                : '--'}
                        </div>
                    </div>

                    {/* Total Fees */}
                    <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800/30">
                        <div className="flex items-center text-slate-500 mb-1.5">
                            <Receipt className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Fees</span>
                        </div>
                        <p className="text-base font-mono font-bold leading-none text-amber-500/90">
                            {formatCurrencyValue(bot.performance?.total_fees, quoteCurrency)}
                        </p>
                    </div>

                    {/* Total Trades */}
                    <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-800/30">
                        <div className="flex items-center text-slate-500 mb-1.5">
                            <Activity className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Trades</span>
                        </div>
                        <p className="text-base font-mono font-bold leading-none text-white">
                            {bot.performance?.total_trades || 0}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/50 pt-3 font-medium">
                    <div className="flex items-center bg-slate-950/30 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3 mr-1.5 text-slate-600" />
                        <span>{uptime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-400 border border-slate-700/30">{formatExchangeName(bot.exchange || bot.config?.exchange)}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-400 border border-slate-700/30">{bot.tradingPair || bot.config?.pairs?.[0] || 'No pair'}</span>
                    </div>
                </div>
            </div >

            {/* Delete Confirmation Modal */}
            < DeleteBotModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)
                }
                onConfirm={handleDelete}
                botName={bot.name}
                botId={bot.id}
            />
        </>
    );
}
