'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportData {
    totalPnL: number;
    totalVolume: number;
    totalTrades: number;
    winRate: number | null;
    profitFactor: number;
    bestBot: { name: string; pnl: number } | null;
    worstBot: { name: string; pnl: number } | null;
    dailyPnL: { date: string; pnl: number }[];
    botPerformance: { name: string; pnl: number; trades: number; winRate: number }[];
}

// Map date range selector to API time range
const timeRangeMap: Record<string, string> = {
    '7d': '1w',
    '30d': '1m',
    '90d': '3m',
    'ytd': 'all'
};

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [data, setData] = useState<ReportData | null>(null);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Fetch pre-calculated stats from backend
            const apiTimeRange = timeRangeMap[dateRange] || '1m';
            const response = await fetch(`/api/stats?timeRange=${apiTimeRange}&includePerBot=true`);
            const stats = await response.json();

            if (stats.error) {
                throw new Error(stats.error);
            }

            // Map backend response to component state
            setData({
                totalPnL: stats.trading?.totalPnL || 0,
                totalVolume: stats.trading?.totalVolume || 0,
                totalTrades: stats.trading?.totalTrades || 0,
                winRate: stats.trading?.winRate,
                profitFactor: stats.trading?.profitFactor || 0,
                bestBot: stats.bots?.topPerformer || null,
                worstBot: stats.bots?.worstPerformer || null,
                dailyPnL: [],
                botPerformance: (stats.botPerformance || []).map((b: any) => ({
                    name: b.name,
                    pnl: b.pnl,
                    trades: b.trades,
                    winRate: b.winRate
                }))
            });
        } catch (err) {
            console.error('Error fetching report data:', err);
            toast.error('Failed to load report data');
            // Fallback to empty state
            setData({
                totalPnL: 0,
                totalVolume: 0,
                totalTrades: 0,
                winRate: null,
                profitFactor: 0,
                bestBot: null,
                worstBot: null,
                dailyPnL: [],
                botPerformance: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const exportReport = (format: 'csv' | 'pdf') => {
        if (!data) return;

        if (format === 'csv') {
            const csv = [
                ['Metric', 'Value'],
                ['Total PnL', `$${data.totalPnL.toFixed(2)}`],
                ['Total Volume', `$${data.totalVolume.toFixed(2)}`],
                ['Total Trades', data.totalTrades.toString()],
                ['Win Rate', data.winRate !== null ? `${data.winRate.toFixed(1)}%` : 'N/A'],
                ['Profit Factor', data.profitFactor.toFixed(2)],
                [''],
                ['Bot Performance'],
                ['Bot Name', 'PnL', 'Trades', 'Win Rate'],
                ...data.botPerformance.map(b => [b.name, `$${b.pnl.toFixed(2)}`, b.trades.toString(), `${b.winRate.toFixed(1)}%`])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trading-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            toast.success('Report exported as CSV');
        } else {
            toast.info('PDF export coming soon');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports</h1>
                    <p className="text-slate-400 mt-1">Unified trading performance reports</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="ytd">Year to Date</option>
                    </select>
                    <button onClick={fetchReportData} disabled={loading} className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => exportReport('csv')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : data && (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm">Total PnL</span>
                            </div>
                            <p className={`text-2xl font-bold ${data.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${data.totalPnL.toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Activity className="h-4 w-4" />
                                <span className="text-sm">Total Trades</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{data.totalTrades}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">Win Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">{data.winRate !== null ? `${data.winRate.toFixed(1)}%` : 'N/A'}</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-sm">Profit Factor</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-400">{data.profitFactor.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Best & Worst */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-green-900/50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                <h3 className="text-lg font-semibold text-white">Best Performer</h3>
                            </div>
                            {data.bestBot ? (
                                <div>
                                    <p className="text-xl font-bold text-white">{data.bestBot.name}</p>
                                    <p className="text-green-400 text-lg">+${data.bestBot.pnl.toFixed(2)}</p>
                                </div>
                            ) : (
                                <p className="text-slate-400">No data</p>
                            )}
                        </div>
                        <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingDown className="h-5 w-5 text-red-500" />
                                <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
                            </div>
                            {data.worstBot ? (
                                <div>
                                    <p className="text-xl font-bold text-white">{data.worstBot.name}</p>
                                    <p className={data.worstBot.pnl >= 0 ? 'text-green-400 text-lg' : 'text-red-400 text-lg'}>
                                        ${data.worstBot.pnl.toFixed(2)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-slate-400">No data</p>
                            )}
                        </div>
                    </div>

                    {/* Bot Performance Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-lg font-semibold text-white">Bot Performance Breakdown</h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Bot</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">PnL</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">Trades</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.botPerformance.map((bot, i) => (
                                    <tr key={i} className="border-t border-slate-800">
                                        <td className="px-6 py-4 text-white font-medium">{bot.name}</td>
                                        <td className={`px-6 py-4 text-right ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${bot.pnl.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">{bot.trades}</td>
                                        <td className="px-6 py-4 text-right text-blue-400">{bot.winRate.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
