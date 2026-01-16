"use client";

import { useEffect } from "react";
import { Wallet, RefreshCw, TrendingUp, ArrowUpRight, ArrowDownLeft, Activity, Layers } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils/cn";
import { PortfolioHistoryChart, TokenDistributionChart } from "@/components/portfolio";

export default function PortfolioPage() {
    const { portfolioValue, change24h, change24hPercent, assets, connectedExchanges, recentActivity, fetchPortfolio, fetchBots, bots } = useStore();

    useEffect(() => {
        // Initial fetch
        fetchPortfolio();
        fetchBots();

        // Set up polling every 5 seconds for real-time updates
        const interval = setInterval(() => {
            fetchPortfolio();
            fetchBots();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchPortfolio, fetchBots]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-white">Portfolio</h2>
                <button
                    onClick={() => fetchPortfolio()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-sm"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Value Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-white">Total Value</h3>
                        <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white">
                            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className={cn(
                            "mt-1 text-sm flex items-center",
                            change24hPercent >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                            <TrendingUp className={cn("h-4 w-4 mr-1", change24hPercent < 0 && "rotate-180")} />
                            {change24hPercent >= 0 ? '+' : ''}{change24hPercent.toFixed(2)}% (24h)
                            <span className="ml-2 text-slate-400">
                                ({change24h >= 0 ? '+' : ''}${Math.abs(change24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                        </p>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-400">Active Assets</h3>
                        <Layers className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{assets.length}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-400">Exchanges</h3>
                        <Activity className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{connectedExchanges.length}</div>
                </div>
            </div>

            {/* Portfolio Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <PortfolioHistoryChart />
                <TokenDistributionChart />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Assets Table */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="text-lg font-medium text-white">Asset Allocation</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Asset</th>
                                    <th className="px-6 py-3 font-medium text-right">Balance</th>
                                    <th className="px-6 py-3 font-medium text-right">Value</th>
                                    <th className="px-6 py-3 font-medium text-right">Alloc %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {assets.map((asset, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{asset.symbol}</td>
                                        <td className="px-6 py-4 text-slate-300 text-right">{asset.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-300 text-right">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-slate-300 text-right">{asset.allocation}%</td>
                                    </tr>
                                ))}
                                {assets.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No assets found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Connected Exchanges & Activity */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Connected Exchanges</h3>
                        <div className="space-y-4">
                            {connectedExchanges.map((ex, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="font-medium text-white">{ex.name}</span>
                                    </div>
                                    <span className="text-xs uppercase px-2 py-1 rounded bg-green-500/10 text-green-500 font-medium">
                                        {ex.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className={cn(
                                        "mt-1 p-1.5 rounded-full",
                                        activity.type === 'Trade' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                    )}>
                                        {activity.type === 'Trade' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-white">{activity.description}</p>
                                            <span className={cn(
                                                "text-sm font-medium",
                                                activity.value.startsWith('+') ? "text-green-500" : "text-white"
                                            )}>{activity.value}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
