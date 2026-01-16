import React from 'react';
import { useRiskUpdates } from '@/lib/websocket-hooks';
import { PortfolioRisk, ExposureBreakdown, DrawdownData } from '@/types/trading';
import { Shield, AlertTriangle, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

export function RiskDashboard() {
    const { data: risk, status } = useRiskUpdates();

    if (status === 'connecting' || !risk) {
        return <RiskDashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Risk Score & Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RiskScoreCard score={risk.riskScore} />
                <MetricCard
                    title="VaR (95%)"
                    value={`$${risk.var95.toLocaleString()}`}
                    subValue="Value at Risk"
                    icon={Shield}
                    color="text-blue-500"
                />
                <MetricCard
                    title="Max Drawdown"
                    value={`${risk.maxDrawdown.toFixed(2)}%`}
                    subValue="Peak to Trough"
                    icon={AlertTriangle}
                    color="text-red-500"
                />
                <MetricCard
                    title="Leverage"
                    value={`${risk.leverage.toFixed(2)}x`}
                    subValue={`Limit: ${risk.limits.maxLeverage}x`}
                    icon={Activity}
                    color="text-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Exposure Chart */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                            <PieChartIcon size={18} className="text-gray-400" />
                            Asset Exposure
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        <ExposureChart data={risk.exposure} />
                    </div>
                </div>

                {/* Drawdown Chart */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                            <Activity size={18} className="text-gray-400" />
                            Drawdown History
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        <DrawdownChart data={risk.drawdown} />
                    </div>
                </div>
            </div>

            {/* Risk Limits */}
            <RiskLimitsPanel limits={risk.limits} />
        </div>
    );
}

function RiskScoreCard({ score }: { score: number }) {
    const getColor = (s: number) => {
        if (s < 30) return 'text-green-500';
        if (s < 70) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Risk Score</p>
                <h3 className={`text-3xl font-bold ${getColor(score)}`}>{score}/100</h3>
            </div>
            <div className="h-16 w-16 rounded-full border-4 border-gray-800 flex items-center justify-center relative">
                <div
                    className={`absolute inset-0 rounded-full border-4 border-t-transparent ${getColor(score)}`}
                    style={{ transform: `rotate(${score * 3.6}deg)` }}
                />
                <Shield size={24} className={getColor(score)} />
            </div>
        </div>
    );
}

function MetricCard({ title, value, subValue, icon: Icon, color }: any) {
    return (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <Icon size={18} className={color} />
            </div>
            <h3 className="text-2xl font-bold text-gray-200">{value}</h3>
            <p className="text-xs text-gray-500 mt-1">{subValue}</p>
        </div>
    );
}

function ExposureChart({ data }: { data: ExposureBreakdown }) {
    const chartData = Object.entries(data.byAsset).map(([name, value]) => ({ name, value }));
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }}
                    itemStyle={{ color: '#e5e7eb' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

function DrawdownChart({ data }: { data: DrawdownData[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                    stroke="#6b7280"
                    fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }}
                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorDrawdown)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

function RiskLimitsPanel({ limits }: { limits: any }) {
    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-gray-200">Risk Limits</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <LimitBar
                    label="Leverage Utilization"
                    current={limits.currentLeverage}
                    max={limits.maxLeverage}
                    unit="x"
                />
                <LimitBar
                    label="Drawdown Limit"
                    current={limits.currentDrawdown}
                    max={limits.maxDrawdown}
                    unit="%"
                    inverse
                />
                <LimitBar
                    label="Daily Loss Limit"
                    current={limits.currentDailyLoss}
                    max={limits.maxDailyLoss}
                    unit="$"
                    inverse
                />
            </div>
        </div>
    );
}

function LimitBar({ label, current, max, unit, inverse }: any) {
    const percentage = Math.min((current / max) * 100, 100);
    const color = inverse
        ? (percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500')
        : (percentage > 80 ? 'bg-red-500' : 'bg-blue-500');

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-200 font-mono">
                    {current}{unit} / {max}{unit}
                </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function RiskDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-900 rounded-lg"></div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="h-[300px] bg-gray-900 rounded-lg"></div>
                <div className="h-[300px] bg-gray-900 rounded-lg"></div>
            </div>
        </div>
    );
}
