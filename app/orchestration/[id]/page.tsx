"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import {
    ArrowLeft, Activity, Terminal, Settings, TrendingUp, Clock,
    Play, Square, RotateCcw, RefreshCw, DollarSign, BarChart3,
    Zap, Target, AlertCircle, CheckCircle2, XCircle, Loader2, Pencil
} from "lucide-react";
import Link from "next/link";
import { PnLChart } from "@/components/dashboard/PnLChart";
import { useEffect, useState, useCallback, useMemo } from "react";
import { backendApi } from "@/lib/backend-api";
import { DataTableFilters, TimeRange } from "@/components/ui/DataTableFilters";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import StreamingTerminal from "@/components/dashboard/StreamingTerminal";
import DynamicConfigEditor from "@/components/dashboard/DynamicConfigEditor";

// Types
interface BotStatus {
    status: string;
    performance: Record<string, any>;
    error_logs: Array<{ timestamp: string | number; level: string; level_name?: string; message?: string; msg?: string }>;
    general_logs: Array<{ timestamp: string | number; level: string; level_name?: string; message?: string; msg?: string }>;
    recently_active: boolean;
    container_running: boolean;
    config?: Record<string, any>;
    botRun?: {
        deployedAt?: string;
        stoppedAt?: string;
        strategyType?: string;
        strategyName?: string;
        imageVersion?: string;
        runStatus?: string;
        deploymentStatus?: string;
    };
    runtime?: {
        hours: number;
        minutes: number;
        totalMs: number;
    };
    strategy?: string;
    exchange?: string;
    tradingPair?: string;
    controllers?: string[];
}

interface Trade {
    id: string;
    symbol: string;
    side: string;
    price: number;
    quantity: number;
    total: number;
    pnl: number;
    timestamp: string;
    exchange: string;
}

interface Order {
    id: string;
    symbol: string;
    side: string;
    type: string;
    price: number;
    amount: number;
    filled: number;
    status: string;
    createdAt: string;
    isActive: boolean;
}

interface TradesData {
    trades: Trade[];
    chartData: { date: string; value: number }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
        showing: { from: number; to: number };
    };
    stats: {
        totalTrades: number;
        totalPnL: number;
        winRate: number | null;
        winRateStatus?: 'pending' | 'good' | 'needs_improvement';
        winningTrades?: number;
        losingTrades?: number;
        totalVolume: number;
        avgTradeSize: number;
        totalFees?: number;
        buyTrades?: number;
        sellTrades?: number;
        hasCompletedTrades?: boolean;
        inventoryImbalance?: number;
        avgWinAmount?: number;
        avgLossAmount?: number;
    };
    filters: {
        timeRange: string;
        side: string;
    };
}

interface OrdersData {
    orders: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
        showing: { from: number; to: number };
    };
    stats: {
        totalOrders: number;
        activeOrders: number;
        filledOrders: number;
    };
    filters: {
        timeRange: string;
        status: string;
        side: string;
    };
}

// Tab definitions
type TabId = 'overview' | 'orders' | 'trades' | 'logs' | 'about';
const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: Target },
    { id: 'trades', label: 'Trades', icon: Zap },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'about', label: 'About', icon: Settings },
];

export default function BotDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { bots, fetchBots } = useStore();
    const bot = bots.find(b => b.id === params.id);

    // State
    const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
    const [tradesData, setTradesData] = useState<TradesData | null>(null);
    const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tradesLoading, setTradesLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch bot status
    const fetchBotStatus = useCallback(async () => {
        if (!params.id) return;
        try {
            const response = await backendApi.get(`/bots/${params.id}`);
            if (response.data?.data) {
                setBotStatus(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch bot status:", error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    // Fetch trades
    const fetchTrades = useCallback(async () => {
        if (!params.id) return;
        try {
            const response = await backendApi.get(`/bots/${params.id}/trades?limit=100`);
            if (response.data) {
                setTradesData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch trades:", error);
        } finally {
            setTradesLoading(false);
        }
    }, [params.id]);

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        if (!params.id) return;
        try {
            const response = await backendApi.get(`/bots/${params.id}/orders?limit=50`);
            if (response.data) {
                setOrdersData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setOrdersLoading(false);
        }
    }, [params.id]);

    // Initial fetch and polling
    useEffect(() => {
        fetchBotStatus();
        fetchTrades();
        fetchOrders();

        const interval = setInterval(() => {
            fetchBotStatus();
            fetchTrades();
            fetchOrders();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchBotStatus, fetchTrades, fetchOrders]);

    // Bot actions
    const handleStartBot = async () => {
        if (!params.id) return;
        setActionLoading('start');
        try {
            await backendApi.post(`/bots/${params.id}/start`);
            await fetchBotStatus();
            fetchBots();
        } catch (error) {
            console.error("Failed to start bot:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleStopBot = async () => {
        if (!params.id) return;
        setActionLoading('stop');
        try {
            await backendApi.post(`/bots/${params.id}/stop`);
            await fetchBotStatus();
            fetchBots();
        } catch (error) {
            console.error("Failed to stop bot:", error);
        } finally {
            setActionLoading(null);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p>Loading bot details...</p>
            </div>
        );
    }

    // Not found state
    if (!bot && !botStatus) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-lg font-medium">Bot not found</p>
                <Link href="/orchestration" className="mt-4 text-blue-500 hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orchestration
                </Link>
            </div>
        );
    }

    // Merge bot data
    const botData = {
        id: params.id as string,
        name: bot?.name || params.id as string,
        status: botStatus?.status || bot?.status || 'unknown',
        config: botStatus?.config || bot?.config || {},
        performance: bot?.performance || {}
    };

    const isRunning = botStatus?.status === 'running' || botStatus?.container_running;
    const currentStatus = botStatus?.status || 'unknown';

    // Format runtime
    const formatRuntime = () => {
        if (!botStatus?.runtime) return 'N/A';
        const { hours, minutes } = botStatus.runtime;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'stopping': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'stopped': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    // Normalize logs
    const allLogs = [
        ...(botStatus?.error_logs || []),
        ...(botStatus?.general_logs || [])
    ].map(log => ({
        timestamp: typeof log.timestamp === 'number' ? log.timestamp * 1000 : Date.parse(log.timestamp as string) || Date.now(),
        level: (log as any).level_name || log.level || 'INFO',
        message: (log as any).msg || log.message || ''
    })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/orchestration" className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">{botData.name}</h2>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus)}`}>
                                {currentStatus.toUpperCase()}
                            </span>
                            {botStatus?.recently_active && (
                                <span className="flex items-center gap-1 text-xs text-green-500">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Live
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span>{botStatus?.strategy || 'PMM'}</span>
                            <span>•</span>
                            <span>{botStatus?.exchange || 'paper'}</span>
                            <span>•</span>
                            <span>{botStatus?.tradingPair || 'N/A'}</span>
                            {botStatus?.runtime && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatRuntime()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={fetchBotStatus}
                        className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Edit button - only show when bot is stopped */}
                    {!isRunning && currentStatus === 'stopped' && (
                        <Link
                            href={`/orchestration/${params.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit Configuration
                        </Link>
                    )}

                    {isRunning ? (
                        <button
                            onClick={handleStopBot}
                            disabled={actionLoading === 'stop'}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'stop' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            Stop Bot
                        </button>
                    ) : (
                        <button
                            onClick={handleStartBot}
                            disabled={actionLoading === 'start'}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'start' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Start Bot
                        </button>
                    )}
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={DollarSign}
                    label="Total PnL"
                    value={tradesData?.stats?.totalPnL !== undefined && tradesData?.stats?.totalPnL !== null ?
                        `${tradesData.stats.totalPnL >= 0 ? '+' : ''}$${tradesData.stats.totalPnL.toFixed(2)}` :
                        '$0.00'}
                    trend={tradesData?.stats?.totalPnL && tradesData.stats.totalPnL > 0 ? 'up' : tradesData?.stats?.totalPnL && tradesData.stats.totalPnL < 0 ? 'down' : undefined}
                    loading={tradesLoading}
                />
                <MetricCard
                    icon={Target}
                    label="Win Rate"
                    value={tradesData?.stats?.winRate !== null && tradesData?.stats?.winRate !== undefined
                        ? `${tradesData.stats.winRate}%`
                        : tradesData?.stats?.hasCompletedTrades === false
                            ? 'Pending'
                            : 'N/A'}
                    subtext={tradesData?.stats?.winRateStatus === 'pending'
                        ? 'Awaiting first sell'
                        : tradesData?.stats?.winningTrades !== undefined
                            ? `${tradesData.stats.winningTrades}W / ${tradesData.stats.losingTrades}L`
                            : undefined}
                    loading={tradesLoading}
                />
                <MetricCard
                    icon={Zap}
                    label="Total Trades"
                    value={tradesData?.stats?.totalTrades?.toString() || '0'}
                    loading={tradesLoading}
                />
                <MetricCard
                    icon={BarChart3}
                    label="Volume Traded"
                    value={tradesData?.stats?.totalVolume !== undefined ?
                        `$${tradesData.stats.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}` :
                        '$0'}
                    loading={tradesLoading}
                />
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-800 overflow-x-auto no-scrollbar">
                <nav className="flex space-x-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.id === 'orders' && ordersData?.stats?.activeOrders ? (
                                <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                                    {ordersData.stats.activeOrders}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <OverviewTab
                        botStatus={botStatus}
                        tradesData={tradesData}
                        tradesLoading={tradesLoading}
                        ordersData={ordersData}
                    />
                )}
                {activeTab === 'orders' && (
                    <OrdersTab botId={params.id as string} />
                )}
                {activeTab === 'trades' && (
                    <TradesTab botId={params.id as string} />
                )}
                {activeTab === 'logs' && (
                    <StreamingTerminal
                        botId={params.id as string}
                        initialLogs={allLogs}
                        recentlyActive={botStatus?.recently_active}
                    />
                )}
                {activeTab === 'about' && (
                    <div className="space-y-8">
                        {/* Deployment Details Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatRow label="Strategy" value={botStatus?.strategy || 'PMM'} />
                            <StatRow label="Exchange" value={botStatus?.exchange || 'Paper'} />
                            <StatRow label="Deployed" value={botStatus?.botRun?.deployedAt ? new Date(botStatus.botRun.deployedAt).toLocaleDateString() : 'N/A'} />
                            <StatRow label="Runtime" value={formatRuntime()} />
                        </div>

                        <DynamicConfigEditor
                            botId={params.id as string}
                            initialConfig={botStatus?.config || {}}
                            onUpdate={fetchBotStatus}
                            isRunning={isRunning}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({
    icon: Icon,
    label,
    value,
    trend,
    loading,
    subtext
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    trend?: 'up' | 'down';
    loading?: boolean;
    subtext?: string;
}) {
    if (loading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-slate-700 rounded w-24"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${trend === 'up' ? 'text-green-500' :
                trend === 'down' ? 'text-red-500' :
                    'text-white'
                }`}>
                {value}
            </p>
            {subtext && (
                <p className="text-xs text-slate-500 mt-1">{subtext}</p>
            )}
        </div>
    );
}

// Overview Tab
function OverviewTab({
    botStatus,
    tradesData,
    tradesLoading,
    ordersData
}: {
    botStatus: BotStatus | null;
    tradesData: TradesData | null;
    tradesLoading: boolean;
    ordersData: OrdersData | null;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart */}
            <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                        Portfolio Performance
                    </h3>
                    <PnLChart
                        data={tradesData?.chartData || []}
                        loading={tradesLoading}
                        emptyMessage="No trades yet. Chart will populate as trades are executed."
                        height={350}
                    />
                </div>

                {/* Active Orders Preview */}
                {ordersData?.orders && ordersData.orders.filter((o: Order) => o.isActive).length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-purple-500" />
                            Active Orders
                            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                                {ordersData.orders.filter((o: Order) => o.isActive).length}
                            </span>
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-800">
                                        <th className="text-left py-2 font-medium">Pair</th>
                                        <th className="text-left py-2 font-medium">Side</th>
                                        <th className="text-right py-2 font-medium">Price</th>
                                        <th className="text-right py-2 font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordersData.orders.filter((o: Order) => o.isActive).slice(0, 5).map((order: Order) => (
                                        <tr key={order.id} className="border-b border-slate-800/50">
                                            <td className="py-2 text-white">{order.symbol}</td>
                                            <td className={`py-2 ${order.side === 'buy' ? 'text-green-500' : 'text-red-500'} `}>
                                                {order.side.toUpperCase()}
                                            </td>
                                            <td className="py-2 text-right text-slate-300">
                                                ${order.price.toFixed(4)}
                                            </td>
                                            <td className="py-2 text-right text-slate-300">
                                                {order.amount.toFixed(4)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Statistics */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-purple-500" />
                        Status
                    </h3>
                    <div className="space-y-3">
                        <StatRow label="Container" value={botStatus?.container_running ? 'Running' : 'Stopped'}
                            icon={botStatus?.container_running ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-slate-500" />} />
                        <StatRow label="MQTT Active" value={botStatus?.recently_active ? 'Yes' : 'No'}
                            icon={botStatus?.recently_active ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-slate-500" />} />
                        <StatRow label="Runtime" value={botStatus?.runtime ? `${botStatus.runtime.hours}h ${botStatus.runtime.minutes} m` : 'N/A'} />
                        {botStatus?.botRun?.deployedAt && (
                            <StatRow label="Deployed" value={new Date(botStatus.botRun.deployedAt).toLocaleDateString()} />
                        )}
                    </div>
                </div>

                {/* Configuration */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-slate-400" />
                        Configuration
                    </h3>
                    <div className="space-y-3 text-sm">
                        <ConfigRow label="Strategy" value={botStatus?.strategy || 'PMM'} />
                        <ConfigRow label="Exchange" value={botStatus?.exchange || 'paper'} />
                        <ConfigRow label="Trading Pair" value={botStatus?.tradingPair || 'N/A'} />
                        {botStatus?.botRun?.imageVersion && (
                            <ConfigRow label="Image" value={botStatus.botRun.imageVersion} />
                        )}
                        {botStatus?.controllers && botStatus.controllers.length > 0 && (
                            <div className="pt-2 border-t border-slate-800">
                                <span className="text-slate-500">Controllers</span>
                                <div className="mt-1 space-y-1">
                                    {botStatus.controllers.map((c, i) => (
                                        <div key={i} className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper components
function StatRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950/50">
            <span className="text-sm text-slate-400">{label}</span>
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-mono text-sm text-white">{value}</span>
            </div>
        </div>
    );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-300">{value}</span>
        </div>
    );
}

// Sort icon component
function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
    return (
        <span className="ml-1 inline-flex flex-col">
            <svg className={`w-2 h-2 ${direction === 'asc' ? 'text-blue-400' : 'text-slate-600'} `} viewBox="0 0 8 8" fill="currentColor">
                <path d="M4 0L8 4H0L4 0Z" />
            </svg>
            <svg className={`w-2 h-2 -mt-0.5 ${direction === 'desc' ? 'text-blue-400' : 'text-slate-600'} `} viewBox="0 0 8 8" fill="currentColor">
                <path d="M4 8L0 4H8L4 8Z" />
            </svg>
        </span>
    );
}

// Sortable header component
function SortableHeader({
    label,
    sortKey,
    currentSort,
    onSort,
    align = 'left'
}: {
    label: string;
    sortKey: string;
    currentSort: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
    align?: 'left' | 'right';
}) {
    const isActive = currentSort?.key === sortKey;
    return (
        <th
            className={`text-${align} py-3 px-4 font-medium cursor-pointer hover:text-blue-400 transition-colors select-none`}
            onClick={() => onSort(sortKey)}
        >
            <span className="inline-flex items-center">
                {label}
                <SortIcon direction={isActive ? currentSort.direction : null} />
            </span>
        </th>
    );
}

// Orders Tab - Self-contained with filters and pagination
function OrdersTab({ botId }: { botId: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter and pagination state
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sideFilter, setSideFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [pagination, setPagination] = useState({
        page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false,
        showing: { from: 0, to: 0 }
    });
    const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, filledOrders: 0 });

    // Fetch orders with current filters
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                timeRange,
                status: statusFilter,
                side: sideFilter
            });
            const response = await backendApi.get(`/bots/${botId}/orders?${params}`);
            if (response.data) {
                setOrders(response.data.orders || []);
                setPagination(response.data.pagination || pagination);
                setStats(response.data.stats || stats);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [botId, page, limit, timeRange, statusFilter, sideFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [timeRange, statusFilter, sideFilter]);

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedOrders = useMemo(() => {
        if (!sortConfig) return orders;
        return [...orders].sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortConfig.key) {
                case 'status': aVal = a.isActive ? 'OPEN' : a.status; bVal = b.isActive ? 'OPEN' : b.status; break;
                case 'symbol': aVal = a.symbol; bVal = b.symbol; break;
                case 'side': aVal = a.side; bVal = b.side; break;
                case 'price': aVal = a.price; bVal = b.price; break;
                case 'amount': aVal = a.amount; bVal = b.amount; break;
                case 'createdAt': aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [orders, sortConfig]);

    // CSV Export
    const handleExport = () => {
        const headers = ['Status', 'Symbol', 'Side', 'Type', 'Price', 'Amount', 'Filled', 'Time'];
        const rows = orders.map(o => [
            o.isActive ? 'OPEN' : o.status, o.symbol, o.side.toUpperCase(), o.type,
            o.price, o.amount, o.filled, new Date(o.createdAt).toISOString()
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `orders-${botId}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'open', label: 'Open' },
        { value: 'filled', label: 'Filled' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    if (loading && orders.length === 0) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DataTableFilters
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                statusFilter={statusFilter}
                statusOptions={statusOptions}
                onStatusChange={setStatusFilter}
                sideFilter={sideFilter}
                onSideChange={setSideFilter}
                onExport={handleExport}
                showing={pagination.showing}
                total={pagination.total}
            />

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                            <tr className="text-slate-400">
                                <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Pair" sortKey="symbol" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Side" sortKey="side" currentSort={sortConfig} onSort={handleSort} />
                                <th className="text-left py-3 px-4 font-medium">Type</th>
                                <SortableHeader label="Price" sortKey="price" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <SortableHeader label="Amount" sortKey="amount" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <th className="text-right py-3 px-4 font-medium">Filled</th>
                                <SortableHeader label="Time" sortKey="createdAt" currentSort={sortConfig} onSort={handleSort} align="right" />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center">
                                        <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-400">No orders found</p>
                                        <p className="text-sm text-slate-600 mt-1">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${order.isActive ? 'bg-blue-500/20 text-blue-400' :
                                                order.status === 'FILLED' ? 'bg-green-500/20 text-green-400' :
                                                    order.status === 'CANCELLED' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {order.isActive ? 'OPEN' : order.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-white font-medium">{order.symbol}</td>
                                        <td className={`py-3 px-4 font-medium ${order.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                            {order.side.toUpperCase()}
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 capitalize">{order.type}</td>
                                        <td className="py-3 px-4 text-right text-slate-300 font-mono">${order.price.toFixed(4)}</td>
                                        <td className="py-3 px-4 text-right text-slate-300 font-mono">{order.amount.toFixed(4)}</td>
                                        <td className="py-3 px-4 text-right text-slate-300 font-mono">{order.filled.toFixed(4)}</td>
                                        <td className="py-3 px-4 text-right text-slate-500 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    limit={limit}
                    total={pagination.total}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
                    className="px-4 border-t border-slate-800"
                />
            </div>
        </div>
    );
}

// Trades Tab - Self-contained with filters and pagination
function TradesTab({ botId }: { botId: string }) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter and pagination state
    const [timeRange, setTimeRange] = useState<TimeRange>('all');
    const [sideFilter, setSideFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [pagination, setPagination] = useState({
        page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false,
        showing: { from: 0, to: 0 }
    });
    const [stats, setStats] = useState({ totalTrades: 0, totalPnL: 0, winRate: 0 });

    // Fetch trades with current filters
    const fetchTrades = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                timeRange,
                side: sideFilter
            });
            const response = await backendApi.get(`/bots/${botId}/trades?${params}`);
            if (response.data) {
                setTrades(response.data.trades || []);
                setPagination(response.data.pagination || pagination);
                setStats(response.data.stats || stats);
            }
        } catch (error) {
            console.error("Failed to fetch trades:", error);
        } finally {
            setLoading(false);
        }
    }, [botId, page, limit, timeRange, sideFilter]);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [timeRange, sideFilter]);

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedTrades = useMemo(() => {
        if (!sortConfig) return trades;
        return [...trades].sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortConfig.key) {
                case 'symbol': aVal = a.symbol; bVal = b.symbol; break;
                case 'side': aVal = a.side; bVal = b.side; break;
                case 'price': aVal = a.price; bVal = b.price; break;
                case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
                case 'total': aVal = a.total; bVal = b.total; break;
                case 'pnl': aVal = a.pnl; bVal = b.pnl; break;
                case 'timestamp': aVal = new Date(a.timestamp).getTime(); bVal = new Date(b.timestamp).getTime(); break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [trades, sortConfig]);

    // CSV Export
    const handleExport = () => {
        const headers = ['Symbol', 'Side', 'Price', 'Quantity', 'Total', 'PnL', 'Time'];
        const rows = trades.map(t => [
            t.symbol, t.side.toUpperCase(), t.price, t.quantity, t.total, t.pnl, new Date(t.timestamp).toISOString()
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `trades-${botId}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && trades.length === 0) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DataTableFilters
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                sideFilter={sideFilter}
                onSideChange={setSideFilter}
                onExport={handleExport}
                showing={pagination.showing}
                total={pagination.total}
            />

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                            <tr className="text-slate-400">
                                <SortableHeader label="Pair" sortKey="symbol" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Side" sortKey="side" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Price" sortKey="price" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <SortableHeader label="Quantity" sortKey="quantity" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <SortableHeader label="Total" sortKey="total" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <SortableHeader label="PnL" sortKey="pnl" currentSort={sortConfig} onSort={handleSort} align="right" />
                                <SortableHeader label="Time" sortKey="timestamp" currentSort={sortConfig} onSort={handleSort} align="right" />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTrades.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-400">No trades found</p>
                                        <p className="text-sm text-slate-600 mt-1">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedTrades.map((trade) => (
                                    <tr key={trade.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="py-3 px-4 text-white font-medium">{trade.symbol}</td>
                                        <td className={`py-3 px-4 font-medium ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                            {trade.side.toUpperCase()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-300 font-mono">${trade.price.toFixed(4)}</td>
                                        <td className="py-3 px-4 text-right text-slate-300 font-mono">{trade.quantity.toFixed(4)}</td>
                                        <td className="py-3 px-4 text-right text-slate-300 font-mono">${trade.total.toFixed(2)}</td>
                                        <td className={`py-3 px-4 text-right font-mono font-medium ${trade.pnl > 0 ? 'text-green-500' : trade.pnl < 0 ? 'text-red-500' : 'text-slate-400'
                                            }`}>
                                            {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-500 text-xs">{new Date(trade.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    limit={limit}
                    total={pagination.total}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
                    className="px-4 border-t border-slate-800"
                />
            </div>

            {/* Summary Breakdown Table */}
            {stats.totalTrades > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Trade Summary Breakdown</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Trade Counts */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Trade Counts</h4>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="py-2 text-slate-400">Total Trades</td>
                                        <td className="py-2 text-right text-white font-medium">{stats.totalTrades || 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-green-400">Buy Trades</td>
                                        <td className="py-2 text-right text-green-400 font-medium">{(stats as any).buyTrades || 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-red-400">Sell Trades</td>
                                        <td className="py-2 text-right text-red-400 font-medium">{(stats as any).sellTrades || 0}</td>
                                    </tr>
                                    {(stats as any).unmatchedSells > 0 && (
                                        <tr>
                                            <td className="py-2 text-yellow-400">⚠ Unmatched Sells</td>
                                            <td className="py-2 text-right text-yellow-400 font-medium">{(stats as any).unmatchedSells}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Volume */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Volume</h4>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="py-2 text-slate-400">Total Volume</td>
                                        <td className="py-2 text-right text-white font-medium">
                                            ${((stats as any).totalVolume || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-green-400">Buy Volume</td>
                                        <td className="py-2 text-right text-green-400 font-medium">
                                            ${((stats as any).buyVolume || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-red-400">Sell Volume</td>
                                        <td className="py-2 text-right text-red-400 font-medium">
                                            ${((stats as any).sellVolume || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-400">Avg Trade Size</td>
                                        <td className="py-2 text-right text-white font-medium">
                                            ${((stats as any).avgTradeSize || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* PnL Analysis */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">PnL Analysis</h4>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="py-2 text-slate-400">Total Realized PnL</td>
                                        <td className={`py-2 text-right font-medium ${(stats.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {(stats.totalPnL || 0) >= 0 ? '+' : ''}${(stats.totalPnL || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-green-400">Winning Trades</td>
                                        <td className="py-2 text-right text-green-400 font-medium">{(stats as any).winningTrades || 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-red-400">Losing Trades</td>
                                        <td className="py-2 text-right text-red-400 font-medium">{(stats as any).losingTrades || 0}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-400">Win Rate</td>
                                        <td className="py-2 text-right text-white font-medium">{stats.winRate || 0}%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-400">Total Fees</td>
                                        <td className="py-2 text-right text-orange-400 font-medium">
                                            -${((stats as any).totalFees || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Warning for unmatched sells */}
                    {(stats as any).unmatchedSells > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-sm text-yellow-400">
                                <strong>⚠ Data Quality Notice:</strong> {(stats as any).unmatchedSells} sell trade(s) occurred
                                without matching buy inventory. These are treated as $0 PnL (only fees counted).
                                This typically happens when trading history is incomplete or the bot started mid-position.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// Logs Tab
function LogsTab({ logs, recentlyActive }: { logs: { timestamp: number; level: string; message: string }[]; recentlyActive?: boolean }) {
    // Deduplicate logs based on timestamp + message + level
    const uniqueLogs = logs.reduce((acc, log) => {
        const key = `${log.timestamp}-${log.level}-${log.message}`;
        if (!acc.some(existing => `${existing.timestamp}-${existing.level}-${existing.message}` === key)) {
            acc.push(log);
        }
        return acc;
    }, [] as typeof logs);

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Terminal className="w-5 h-5 mr-2 text-slate-400" />
                Activity Log
                {recentlyActive && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
            </h3>
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 h-[500px] overflow-y-auto space-y-1">
                {uniqueLogs.length > 0 ? (
                    uniqueLogs.map((log, idx) => (
                        <div key={`${log.timestamp}-${idx}`} className="flex space-x-2">
                            <span className="text-slate-500 shrink-0">
                                [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className={`shrink-0 ${log.level === 'ERROR' ? 'text-red-400' :
                                log.level === 'WARNING' ? 'text-yellow-400' :
                                    'text-blue-400'
                                }`}>
                                {log.level}
                            </span>
                            <span className="break-all">{log.message}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-slate-500">No logs available. Bot may not be actively publishing logs.</div>
                )}
            </div>
        </div>
    );
}

// About Tab
function AboutTab({ botStatus }: { botStatus: BotStatus | null }) {
    if (!botStatus) return null;

    const config = botStatus.config || {};
    const botRun = botStatus.botRun || {};

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deployment Info */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-500" />
                        Deployment Information
                    </h3>
                    <div className="space-y-4">
                        <InfoSection title="Bot Lifecycle">
                            <InfoRow label="Deployment ID" value={botStatus.botRun?.deployedAt ? `RUN-${botStatus.botRun.deployedAt.slice(-6)}` : 'N/A'} />
                            <InfoRow label="Deployed At" value={botRun.deployedAt ? new Date(botRun.deployedAt).toLocaleString() : 'N/A'} />
                            <InfoRow label="Last Stopped" value={botRun.stoppedAt ? new Date(botRun.stoppedAt).toLocaleString() : 'N/A'} />
                            <InfoRow label="Deployment Status" value={botRun.deploymentStatus || 'Unknown'} />
                        </InfoSection>

                        <InfoSection title="Software & Environment">
                            <InfoRow label="Image Version" value={botRun.imageVersion || 'N/A'} />
                            <InfoRow label="Strategy Type" value={botStatus.strategy || 'N/A'} />
                            <InfoRow label="Connector" value={botStatus.exchange || 'N/A'} />
                            <InfoRow label="Trading Pair" value={botStatus.tradingPair || 'N/A'} />
                        </InfoSection>
                    </div>
                </div>

                {/* Configuration Parameters */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-purple-500" />
                        Strategy Configuration
                    </h3>
                    <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
                        {Object.keys(config).length > 0 ? (
                            <div className="grid grid-cols-1 gap-y-1">
                                {Object.entries(config).sort().map(([key, value]) => {
                                    // Resolve asset symbols for unit fields
                                    let displayValue = String(value);
                                    const baseAsset = botStatus.tradingPair?.split('-')[0] || 'Base Asset';
                                    const quoteAsset = botStatus.tradingPair?.split('-')[1] || 'Quote Asset';

                                    if (key.includes('_unit')) {
                                        if (value === 'base' || value === 'btc') {
                                            displayValue = baseAsset;
                                        } else if (value === 'usdt' || value === 'quote') {
                                            displayValue = quoteAsset;
                                        }
                                    }

                                    return (
                                        <div key={key} className="flex justify-between items-start py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 px-1 rounded transition-colors group">
                                            <span className="text-sm text-slate-400 font-mono break-all pr-4">{key}</span>
                                            <span className={cn(
                                                "text-sm font-medium text-right break-all",
                                                key.includes('_unit') ? "text-blue-400 font-bold" : "text-white"
                                            )}>
                                                {typeof value === 'object' ? JSON.stringify(value) : displayValue}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 italic">
                                No configuration parameters found for this bot.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Complete Config JSON */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Terminal className="w-5 h-5 mr-2 text-slate-400" />
                    Raw Configuration Data
                </h3>
                <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-blue-400 overflow-x-auto">
                    <pre>{JSON.stringify({ ...botStatus, error_logs: undefined, general_logs: undefined }, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}

// Info Component Helpers
function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
            <div className="space-y-1 bg-slate-950/50 rounded-lg p-3">
                {children}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm py-1">
            <span className="text-slate-400">{label}</span>
            <span className="text-white font-medium">{value}</span>
        </div>
    );
}
