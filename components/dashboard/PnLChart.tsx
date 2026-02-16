"use client";

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

interface PnLDataPoint {
    date: string;
    value: number;
    pnl?: number;
}

export type BaselineMode = 'absolute' | 'pnl' | 'percentage';

interface PnLChartProps {
    data?: PnLDataPoint[];
    loading?: boolean;
    emptyMessage?: string;
    height?: number;
    showGradient?: boolean;
    initialBaseline?: number; // Optional: actual starting balance
    defaultMode?: BaselineMode;
    showModeSelector?: boolean;
}

const BASELINE_OPTIONS: { value: BaselineMode; label: string; description: string }[] = [
    { value: 'absolute', label: 'Portfolio Value', description: 'Total portfolio value' },
    { value: 'pnl', label: 'PnL Only', description: 'Profit/Loss from $0' },
    { value: 'percentage', label: 'Percentage', description: '% change from start' },
];

export function PnLChart({
    data = [],
    loading = false,
    emptyMessage = "No trading data available yet",
    height = 400,
    showGradient = true,
    initialBaseline,
    defaultMode = 'absolute',
    showModeSelector = true
}: PnLChartProps) {
    const [baselineMode, setBaselineMode] = useState<BaselineMode>(defaultMode);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Transform data based on baseline mode
    const transformedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const firstValue = data[0]?.value || 0;
        const baseline = initialBaseline || firstValue;

        return data.map(point => {
            switch (baselineMode) {
                case 'pnl':
                    // Show only PnL (difference from baseline)
                    return {
                        ...point,
                        displayValue: point.value - baseline
                    };
                case 'percentage':
                    // Show percentage change
                    return {
                        ...point,
                        displayValue: baseline > 0 ? ((point.value - baseline) / baseline) * 100 : 0
                    };
                case 'absolute':
                default:
                    // Show absolute portfolio value
                    return {
                        ...point,
                        displayValue: point.value
                    };
            }
        });
    }, [data, baselineMode, initialBaseline]);

    // Loading skeleton
    if (loading) {
        return (
            <div className={`h-[${height}px] w-full flex items-center justify-center`} style={{ height }}>
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-pulse flex flex-col items-center space-y-3 w-full">
                        <div className="h-4 bg-slate-700 rounded w-24"></div>
                        <div className="h-64 w-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg relative overflow-hidden">
                            <div className="absolute inset-0 flex items-end justify-around px-4 pb-4">
                                {[...Array(7)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-slate-700 rounded-t animate-pulse"
                                        style={{
                                            width: '8%',
                                            height: `${30 + ((i * 13) % 50)}%`,
                                            animationDelay: `${i * 100}ms`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">Loading chart data...</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (!data || data.length === 0) {
        return (
            <div className={`h-[${height}px] w-full flex items-center justify-center`} style={{ height }}>
                <div className="flex flex-col items-center space-y-4 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-slate-400 font-medium">{emptyMessage}</p>
                        <p className="text-sm text-slate-600 mt-1">Chart will populate as trades are executed</p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate if overall PnL is positive or negative
    const latestValue = transformedData[transformedData.length - 1]?.displayValue || 0;
    const firstValue = transformedData[0]?.displayValue || 0;
    const isPositive = latestValue >= firstValue;
    const gradientColor = isPositive ? "#22c55e" : "#ef4444";
    const strokeColor = isPositive ? "#22c55e" : "#ef4444";

    // Format value based on mode
    const formatValue = (value: number): string => {
        switch (baselineMode) {
            case 'percentage':
                return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
            case 'pnl':
                return `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case 'absolute':
            default:
                return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    // Y-axis formatter
    const yAxisFormatter = (value: number): string => {
        switch (baselineMode) {
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'pnl':
                if (Math.abs(value) >= 1000) {
                    return `${value >= 0 ? '+' : '-'}$${(Math.abs(value) / 1000).toFixed(1)}k`;
                }
                return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(0)}`;
            case 'absolute':
            default:
                if (Math.abs(value) >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`;
                }
                return `$${value.toFixed(0)}`;
        }
    };

    // Tooltip label based on mode
    const getTooltipLabel = (): string => {
        switch (baselineMode) {
            case 'percentage': return '% Change';
            case 'pnl': return 'Profit/Loss';
            case 'absolute':
            default: return 'Portfolio Value';
        }
    };

    const selectedOption = BASELINE_OPTIONS.find(opt => opt.value === baselineMode);

    return (
        <div className="w-full relative">
            {/* Baseline Mode Selector */}
            {showModeSelector && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                        >
                            <span>{selectedOption?.label}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setDropdownOpen(false)}
                                />
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                                    {BASELINE_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setBaselineMode(option.value);
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors ${baselineMode === option.value ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300'
                                                }`}
                                        >
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-slate-500">{option.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div style={{ height, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                        data={transformedData}
                        margin={{
                            top: showModeSelector ? 40 : 10,
                            right: 30,
                            left: 10,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={gradientColor} stopOpacity={showGradient ? 0.3 : 0} />
                                <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={yAxisFormatter}
                            domain={baselineMode === 'pnl' || baselineMode === 'percentage'
                                ? ['auto', 'auto']
                                : ['dataMin - 100', 'dataMax + 100']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#1e293b',
                                color: '#f8fafc',
                                borderRadius: '8px',
                                padding: '12px',
                            }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            itemStyle={{ color: strokeColor }}
                            formatter={(value: any) => [formatValue(Number(value || 0)), getTooltipLabel()]}
                            labelFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="displayValue"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            dot={false}
                            activeDot={{ r: 6, fill: strokeColor, stroke: '#0f172a', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
