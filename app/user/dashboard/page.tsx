"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react";

interface BotMetrics {
    totalProfit: number;
    profitChange: number;
    todayInvested: number;
    todayProfit: number;
    totalTrades: number;
    todayTrades: number;
    last30DaysTrades: number;
    avgProfitPerTrade: number;
}

export default function UserDashboard() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<BotMetrics>({
        totalProfit: 0,
        profitChange: 0,
        todayInvested: 0,
        todayProfit: 0,
        totalTrades: 0,
        todayTrades: 0,
        last30DaysTrades: 0,
        avgProfitPerTrade: 0
    });
    const [botStatus, setBotStatus] = useState<'active' | 'stopped'>('active');

    useEffect(() => {
        // Fetch bot metrics (mock data for now)
        setMetrics({
            totalProfit: 13.03,
            profitChange: 0.14,
            todayInvested: 880.00,
            todayProfit: 1.21,
            totalTrades: 425,
            todayTrades: 44,
            last30DaysTrades: 425,
            avgProfitPerTrade: 0.03
        });
    }, []);

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background-dark)' }}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Bot Dashboard
                </h1>
                <div className="flex items-center gap-4">
                    <span
                        className="px-4 py-2 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: botStatus === 'active' ? 'var(--color-success)' : 'var(--color-danger)',
                            color: 'white'
                        }}
                    >
                        Bot Startup {botStatus === 'active' ? 'Activated' : 'Deactivated'}
                    </span>
                    <button
                        onClick={() => setBotStatus(botStatus === 'active' ? 'stopped' : 'active')}
                        className="px-6 py-2 rounded-lg font-medium transition-colors"
                        style={{
                            background: botStatus === 'active' ? 'var(--color-danger)' : 'var(--color-success)',
                            color: 'white'
                        }}
                    >
                        {botStatus === 'active' ? 'STOP BOT' : 'START BOT'}
                    </button>
                </div>
            </div>

            <div className="rounded-xl p-6 mb-6" style={{ background: 'var(--gradient-orange)' }}>
                <div className="grid grid-cols-3 gap-8 text-white">
                    <div>
                        <p className="text-sm opacity-90 mb-1">Total Profit</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">${metrics.totalProfit.toFixed(2)}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm opacity-90 mb-1">Today Invested</p>
                        <span className="text-4xl font-bold">${metrics.todayInvested.toFixed(2)}</span>
                    </div>
                    <div>
                        <p className="text-sm opacity-90 mb-1">Today Profit</p>
                        <span className="text-4xl font-bold">${metrics.todayProfit.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <MetricCard title="Total Trades" value={metrics.totalTrades.toString()} icon={<BarChart3 />} />
                <MetricCard title="Today Trades" value={metrics.todayTrades.toString()} icon={<Activity />} />
                <MetricCard title="30-Day Trades" value={metrics.last30DaysTrades.toString()} icon={<TrendingUp />} />
                <MetricCard title="Avg Profit/Trade" value={`$${metrics.avgProfitPerTrade.toFixed(2)}`} icon={<DollarSign />} />
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--background-card)' }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
                <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        </div>
    );
}
