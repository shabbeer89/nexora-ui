"use client";

import { useState, useEffect, useMemo } from "react";
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell, Legend
} from "recharts";
import {
    TrendingUp,
    Activity, DollarSign, BarChart3,
    PieChart as PieChartIcon, ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { format } from "date-fns";

// Types
interface Trade {
    id: string;
    timestamp: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    pnl: number;
    fee: number;
    exchange: string;
}

interface AnalyticsMetrics {
    totalPnL: number;
    totalVolume: number;
    tradeCount: number;
    winRate: number | null;
    profitFactor: number;
    bestTrade: number;
    worstTrade: number;
    averageTrade: number;
}

// Map UI time range to API time range
const timeRangeMap: Record<string, string> = {
    '7d': '1w',
    '30d': '1m',
    '90d': '3m',
    'all': 'all'
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [metrics, setMetrics] = useState<AnalyticsMetrics>({
        totalPnL: 0, totalVolume: 0, tradeCount: 0,
        winRate: null, profitFactor: 0, bestTrade: 0,
        worstTrade: 0, averageTrade: 0
    });
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch pre-calculated metrics from backend stats API
                const apiTimeRange = timeRangeMap[timeRange] || '1m';
                const statsRes = await fetch(`/api/stats?timeRange=${apiTimeRange}`);
                const stats = await statsRes.json();

                // Map stats to metrics state
                setMetrics({
                    totalPnL: stats.trading?.totalPnL || 0,
                    totalVolume: stats.trading?.totalVolume || 0,
                    tradeCount: stats.trading?.totalTrades || 0,
                    winRate: stats.trading?.winRate,
                    profitFactor: stats.trading?.profitFactor || 0,
                    bestTrade: stats.trading?.bestTrade || 0,
                    worstTrade: stats.trading?.worstTrade || 0,
                    averageTrade: stats.trading?.avgTradePnL || 0
                });

                // Fetch trades for chart data (still needed for visualizations)
                const tradesRes = await fetch(`/api/trades?limit=1000`);
                const tradesData = await tradesRes.json();

                // Sort by timestamp ascending for charts
                const sorted = Array.isArray(tradesData) ? tradesData.sort((a: Trade, b: Trade) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                ) : [];

                setTrades(sorted);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    // Prepare Chart Data
    const chartsData = useMemo(() => {
        if (!trades.length) return { daily: [], cumulative: [], volumeByPair: [] };

        // Daily PnL
        const dailyMap = new Map<string, { date: string, pnl: number, volume: number }>();
        let cumulativePnL = 0;
        const cumulativeData: { date: string, value: number }[] = [];

        trades.forEach(t => {
            const date = format(new Date(t.timestamp), 'yyyy-MM-dd');
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { date, pnl: 0, volume: 0 });
            }
            const d = dailyMap.get(date)!;
            d.pnl += t.pnl;
            d.volume += t.price * t.quantity;

            cumulativePnL += t.pnl;
            cumulativeData.push({
                date: format(new Date(t.timestamp), 'MMM dd HH:mm'),
                value: cumulativePnL
            });
        });

        const dailyData = Array.from(dailyMap.values());

        // Volume by Pair
        const pairMap = new Map<string, number>();
        trades.forEach(t => {
            const pair = t.symbol;
            pairMap.set(pair, (pairMap.get(pair) || 0) + (t.price * t.quantity));
        });

        const volumeByPair = Array.from(pairMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 pairs

        return { daily: dailyData, cumulative: cumulativeData, volumeByPair };
    }, [trades]);

    return (
        <div className="min-h-screen pb-20 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
                    <p className="text-slate-400 mt-2">Comprehensive performance analysis and trade metrics.</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                    {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                                timeRange === r
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total PnL"
                    value={`$${metrics.totalPnL.toFixed(2)}`}
                    trend={metrics.totalPnL >= 0 ? "up" : "down"}
                    icon={DollarSign}
                    subValue={`${metrics.tradeCount} trades`}
                />
                <MetricCard
                    title="Win Rate"
                    value={metrics.winRate !== null ? `${metrics.winRate.toFixed(1)}%` : 'N/A'}
                    trend={metrics.winRate !== null && metrics.winRate > 50 ? "up" : "neutral"}
                    icon={Activity}
                    subValue={`PF: ${metrics.profitFactor.toFixed(2)}`}
                />
                <MetricCard
                    title="Volume"
                    value={`$${(metrics.totalVolume / 1000).toFixed(1)}k`}
                    icon={BarChart3}
                    subValue="Total traded volume"
                />
                <MetricCard
                    title="Avg Trade"
                    value={`$${metrics.averageTrade.toFixed(2)}`}
                    trend={metrics.averageTrade >= 0 ? "up" : "down"}
                    icon={TrendingUp}
                    subValue={`Best: $${metrics.bestTrade.toFixed(2)}`}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cumulative PnL Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Cumulative PnL
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartsData.cumulative}>
                                <defs>
                                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} minTickGap={30} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'PnL']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPnL)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily PnL Bar Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                        Daily PnL
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'PnL']}
                                />
                                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                    {chartsData.daily.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Volume Allocation Pie Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-purple-500" />
                        Volume by Pair
                    </h3>
                    <div className="h-[300px] flex items-center justify-center">
                        {chartsData.volumeByPair.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartsData.volumeByPair}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartsData.volumeByPair.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                        formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'Volume']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-500 flex flex-col items-center">
                                <Activity className="w-10 h-10 mb-2 opacity-50" />
                                <p>No volume data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const MetricCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
            {trend && (
                <div className={cn(
                    "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                    trend === 'up' ? "bg-green-500/10 text-green-500" :
                        trend === 'down' ? "bg-red-500/10 text-red-500" :
                            "bg-slate-800 text-slate-400"
                )}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> :
                        trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                    {trend === 'up' ? '+2.5%' : trend === 'down' ? '-1.2%' : '0%'}
                </div>
            )}
        </div>
        <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
        </div>
    </div>
);
