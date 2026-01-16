"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, TrendingDown, Activity, Lock, Unlock, RefreshCw, AlertTriangle, PieChart, BarChart3, Wallet, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { backendApi } from "@/lib/backend-api";
import Link from "next/link";

interface CapitalAllocation {
    totalCapital: number;
    allocatedCapital: number;
    availableCapital: number;
    lockedCapital: number;
    totalFees: number;
    efficiency: number;
}

interface BotCapital {
    botId: string;
    botName: string;
    status: string;
    allocatedCapital: number;
    usedCapital: number;
    availableCapital: number;
    currentValue: number;
    unrealizedPnL: number;
    totalFees: number;
    strategy: string;
    exchange: string;
    tradingPair: string;
}

interface RecentTransaction {
    id: string;
    botId: string;
    botName: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    fee: number;
    balanceBefore: number;
    balanceAfter: number;
    timestamp: string;
}

export default function CapitalPage() {
    const { bots, fetchBots, portfolioValue, assets } = useStore();
    const [capitalAllocation, setCapitalAllocation] = useState<CapitalAllocation>({
        totalCapital: 0,
        allocatedCapital: 0,
        availableCapital: 0,
        lockedCapital: 0,
        totalFees: 0,
        efficiency: 0
    });
    const [botCapitals, setBotCapitals] = useState<BotCapital[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCapitalData = useCallback(async () => {
        try {
            // Fetch detailed bot capital allocation
            const botsResponse = await backendApi.get('/capital/allocation');
            if (botsResponse.data?.bots) {
                setBotCapitals(botsResponse.data.bots);
            }

            // Fetch overall capital summary
            const summaryResponse = await backendApi.get('/capital/summary');
            if (summaryResponse.data) {
                setCapitalAllocation(summaryResponse.data);
            }

            // Fetch recent transactions with balance info
            const transactionsResponse = await backendApi.get('/capital/transactions?limit=20');
            if (transactionsResponse.data?.transactions) {
                setRecentTransactions(transactionsResponse.data.transactions);
            }
        } catch (error) {
            console.error('Failed to fetch capital data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCapitalData();
        fetchBots();

        // Refresh every 5 seconds
        const interval = setInterval(() => {
            fetchCapitalData();
            fetchBots();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchCapitalData, fetchBots]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading capital data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Capital Management</h2>
                    <p className="text-sm text-slate-400 mt-1">Real-time capital allocation and fee tracking</p>
                </div>
                <button
                    onClick={fetchCapitalData}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Capital Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-400">Total Capital</h3>
                        <Wallet className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        ${capitalAllocation.totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Across all accounts</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-400">Allocated Capital</h3>
                        <Lock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        ${capitalAllocation.allocatedCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {capitalAllocation.totalCapital > 0
                            ? `${((capitalAllocation.allocatedCapital / capitalAllocation.totalCapital) * 100).toFixed(1)}% 
deployed`
                            : '0% deployed'}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-400">Available Capital</h3>
                        <Unlock className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        ${capitalAllocation.availableCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Ready to deploy</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-400">Total Fees Paid</h3>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-red-400">
                        ${capitalAllocation.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">All-time exchange fees</p>
                </div>
            </div>

            {/* Capital Efficiency Meter */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-medium text-white">Capital Efficiency</h3>
                        <p className="text-xs text-slate-500 mt-1">Percentage of allocated capital actively in positions</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-400">{capitalAllocation.efficiency.toFixed(1)}%</div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                    <div
                        className={cn(
                            "h-3 rounded-full transition-all duration-500",
                            capitalAllocation.efficiency >= 75 ? "bg-green-500" :
                                capitalAllocation.efficiency >= 50 ? "bg-blue-500" :
                                    capitalAllocation.efficiency >= 25 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${capitalAllocation.efficiency}%` }}
                    />
                </div>
            </div>

            {/* Bot Capital Allocation Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-500" />
                        Bot Capital Allocation
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                            <tr className="text-slate-400">
                                <th className="text-left py-3 px-4 font-medium">Bot</th>
                                <th className="text-left py-3 px-4 font-medium">Status</th>
                                <th className="text-right py-3 px-4 font-medium">Allocated</th>
                                <th className="text-right py-3 px-4 font-medium">In Use</th>
                                <th className="text-right py-3 px-4 font-medium">Available</th>
                                <th className="text-right py-3 px-4 font-medium">Current Value</th>
                                <th className="text-right py-3 px-4 font-medium">Unrealized PnL</th>
                                <th className="text-right py-3 px-4 font-medium">Fees Paid</th>
                                <th className="text-center py-3 px-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {botCapitals.length > 0 ? (
                                botCapitals.map((bot, index) => (
                                    <tr key={`${bot.botId}-${index}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium text-white">{bot.botName}</div>
                                                <div className="text-xs text-slate-500">{bot.strategy} • {bot.tradingPair}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-medium",
                                                bot.status === 'running' ? "bg-green-500/20 text-green-400" :
                                                    bot.status === 'stopped' ? "bg-slate-500/20 text-slate-400" :
                                                        "bg-yellow-500/20 text-yellow-400"
                                            )}>
                                                {bot.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-white">
                                            ${bot.allocatedCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-amber-400">
                                            ${bot.usedCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-green-400">
                                            ${bot.availableCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-blue-400">
                                            ${bot.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={cn(
                                            "py-3 px-4 text-right font-mono font-bold",
                                            bot.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {bot.unrealizedPnL >= 0 ? '+' : ''}${bot.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-red-400">
                                            ${bot.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Link
                                                href={`/orchestration/${bot.botId}`}
                                                className="text-blue-500 hover:text-blue-400 text-xs font-medium underline"
                                            >
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-500">
                                        No bots deployed yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions with Balance Tracking */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Recent Transactions (with Balance Impact)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                            <tr className="text-slate-400">
                                <th className="text-left py-3 px-4 font-medium">Time</th>
                                <th className="text-left py-3 px-4 font-medium">Bot</th>
                                <th className="text-center py-3 px-4 font-medium">Type</th>
                                <th className="text-right py-3 px-4 font-medium">Amount</th>
                                <th className="text-right py-3 px-4 font-medium">Price</th>
                                <th className="text-right py-3 px-4 font-medium">Fee</th>
                                <th className="text-right py-3 px-4 font-medium">Balance Before</th>
                                <th className="text-right py-3 px-4 font-medium">Balance After</th>
                                <th className="text-right py-3 px-4 font-medium">Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((tx) => {
                                    const balanceChange = tx.balanceAfter - tx.balanceBefore;
                                    const totalCost = tx.amount * tx.price + tx.fee;

                                    return (
                                        <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="py-3 px-4 text-slate-400 text-xs">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-white">{tx.botName}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1",
                                                    tx.type === 'buy' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {tx.type === 'buy' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                    {tx.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-white">
                                                {tx.amount.toFixed(6)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                                                ${tx.price.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-red-400">
                                                ${tx.fee.toFixed(4)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-slate-400">
                                                ${tx.balanceBefore.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-blue-400 font-bold">
                                                ${tx.balanceAfter.toFixed(2)}
                                            </td>
                                            <td className={cn(
                                                "py-3 px-4 text-right font-mono font-bold",
                                                balanceChange >= 0 ? "text-green-500" : "text-red-500"
                                            )}>
                                                {balanceChange >= 0 ? '+' : ''}${Math.abs(balanceChange).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-500">
                                        No recent transactions.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
