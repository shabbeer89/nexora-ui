import { usePortfolioUpdates, useConnectionStatus } from '@/lib/websocket-hooks';
import { PnLData } from '@/types/trading';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export function RealTimePnL() {
    const { portfolio } = usePortfolioUpdates();
    const { status } = useConnectionStatus();

    // Adapter for portfolio data to PnLData
    // Assumes portfolio object contains these fields or defaults to 0
    const data: PnLData = {
        totalPnL: portfolio?.total_pnl || 0,
        totalPnLPercent: portfolio?.total_pnl_percent || 0,
        dailyPnL: portfolio?.daily_pnl || 0,
        weeklyPnL: portfolio?.weekly_pnl || 0,
        monthlyPnL: portfolio?.monthly_pnl || 0,
        unrealizedPnL: portfolio?.unrealized_pnl || 0,
        realizedPnL: portfolio?.realized_pnl || 0,
        positions: portfolio?.positions || [],
        timestamp: portfolio?.timestamp || new Date().toISOString()
    };

    if (status === 'connecting' && !portfolio) {
        return <PnLSkeleton />;
    }

    const isPositive = data.totalPnL >= 0;
    const PnLIcon = isPositive ? TrendingUp : TrendingDown;
    const pnlColor = isPositive ? 'text-green-500' : 'text-red-500';
    const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total PnL Card */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-3 opacity-10 ${pnlColor}`}>
                    <PnLIcon size={48} />
                </div>
                <div className="relative z-10">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total PnL</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={clsx("text-2xl font-bold", pnlColor)}>
                            ${Math.abs(data.totalPnL).toLocaleString()}
                        </h3>
                        <span className={clsx("text-sm font-medium px-1.5 py-0.5 rounded", bgColor, pnlColor)}>
                            {data.totalPnLPercent > 0 ? '+' : ''}{data.totalPnLPercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Daily PnL Card */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-blue-500" />
                    <p className="text-gray-500 text-sm font-medium">Daily PnL</p>
                </div>
                <h3 className={clsx("text-xl font-bold", data.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {data.dailyPnL >= 0 ? '+' : '-'}${Math.abs(data.dailyPnL).toLocaleString()}
                </h3>
            </div>

            {/* Unrealized PnL Card */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-purple-500" />
                    <p className="text-gray-500 text-sm font-medium">Unrealized PnL</p>
                </div>
                <h3 className={clsx("text-xl font-bold", data.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {data.unrealizedPnL >= 0 ? '+' : '-'}${Math.abs(data.unrealizedPnL).toLocaleString()}
                </h3>
            </div>

            {/* Realized PnL Card */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-yellow-500" />
                    <p className="text-gray-500 text-sm font-medium">Realized PnL</p>
                </div>
                <h3 className={clsx("text-xl font-bold", data.realizedPnL >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {data.realizedPnL >= 0 ? '+' : '-'}${Math.abs(data.realizedPnL).toLocaleString()}
                </h3>
            </div>
        </div>
    );
}

function PnLSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-800 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-gray-800 rounded w-3/4"></div>
                </div>
            ))}
        </div>
    );
}
