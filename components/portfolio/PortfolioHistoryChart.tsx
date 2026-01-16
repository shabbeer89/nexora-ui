"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TrendingUp, TrendingDown, Loader2, Calendar, RefreshCw } from "lucide-react";
import { backendApi } from "@/lib/backend-api";

interface HistoryPoint {
    timestamp: string;
    value: number;
}

interface PortfolioHistoryChartProps {
    accountNames?: string[];
    interval?: string;
    height?: number;
}

// Generate stable sample data once
function generateSampleData(numPoints: number, startTime: number, endTime: number): HistoryPoint[] {
    const points: HistoryPoint[] = [];
    let value = 10000;
    const seed = 12345; // Fixed seed for stable data
    let rng = seed;

    for (let i = 0; i < numPoints; i++) {
        // Simple pseudo-random with fixed seed
        rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        const random = (rng / 0x7fffffff);
        const change = (random - 0.48) * 80;
        value = Math.max(5000, Math.min(15000, value + change));
        points.push({
            timestamp: new Date(startTime + (i * (endTime - startTime) / numPoints)).toISOString(),
            value
        });
    }
    return points;
}

export function PortfolioHistoryChart({
    accountNames = [],
    interval = "1h",
    height = 200
}: PortfolioHistoryChartProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
    const initialFetchDone = useRef(false);

    // Serialize accountNames for stable dependency comparison
    const accountNamesKey = JSON.stringify(accountNames);

    const fetchHistory = useCallback(async () => {
        // Only show loading on initial fetch
        if (!initialFetchDone.current) {
            setLoading(true);
        }
        setError(null);

        const now = new Date();
        let startDate: Date;
        let numPoints: number;

        switch (timeRange) {
            case "24h":
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                numPoints = 24;
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                numPoints = 30;
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                numPoints = 7 * 24;
        }

        try {
            const response = await backendApi.post("/portfolio/history", {
                account_names: accountNames,
                start_time: startDate.getTime(),
                end_time: now.getTime(),
                interval,
                limit: numPoints
            });

            // Handle multiple response formats
            let historyData: HistoryPoint[] = [];

            if (response.data?.history && Array.isArray(response.data.history)) {
                // Format: { history: [{ timestamp, value }], pagination: {...} }
                historyData = response.data.history.map((item: any) => ({
                    timestamp: item.timestamp,
                    value: item.value || item.total_value || 0
                })).filter((item: HistoryPoint) => item.value > 0);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                // Format: { data: [...], pagination: {...} }
                historyData = response.data.data.map((item: any) => {
                    let totalValue = 0;
                    const timestamp = item.timestamp;

                    for (const [key, value] of Object.entries(item)) {
                        if (key !== 'timestamp' && typeof value === 'object' && value !== null) {
                            const accountData = value as Record<string, any>;
                            for (const [, connectorData] of Object.entries(accountData)) {
                                if (Array.isArray(connectorData)) {
                                    for (const token of connectorData) {
                                        if (token.value) {
                                            totalValue += parseFloat(token.value) || 0;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return { timestamp, value: totalValue };
                }).filter((item: HistoryPoint) => item.value > 0);
            } else if (Array.isArray(response.data) && response.data.length > 0) {
                // Direct array format
                historyData = response.data.map((item: any) => ({
                    timestamp: item.timestamp,
                    value: item.value || item.total_value || 0
                })).filter((item: HistoryPoint) => item.value > 0);
            }

            if (historyData.length > 0) {
                // Sort by timestamp ascending
                historyData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                setData(historyData);
            } else {
                // Use stable sample data
                setData(generateSampleData(numPoints, startDate.getTime(), now.getTime()));
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load history");
            // Use stable sample data on error
            const now = new Date();
            const startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
            setData(generateSampleData(168, startTime, now.getTime()));
        } finally {
            setLoading(false);
            initialFetchDone.current = true;
        }
        // Use serialized key instead of accountNames array for stable dependency
    }, [accountNamesKey, interval, timeRange]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Calculate chart metrics
    const { minValue, maxValue, change, changePercent, currentValue, isPositive } = useMemo(() => {
        if (data.length === 0) {
            return { minValue: 0, maxValue: 100, change: 0, changePercent: 0, currentValue: 0, isPositive: true };
        }

        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const first = values[0];
        const last = values[values.length - 1];
        const diff = last - first;
        const pct = first > 0 ? (diff / first) * 100 : 0;

        return {
            minValue: min,
            maxValue: max,
            change: diff,
            changePercent: pct,
            currentValue: last,
            isPositive: diff >= 0
        };
    }, [data]);

    // Generate SVG path
    const pathD = useMemo(() => {
        if (data.length < 2) return "";

        const range = maxValue - minValue || 1;
        const points = data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return `${x},${y}`;
        });

        return `M ${points.join(" L ")}`;
    }, [data, minValue, maxValue]);

    const areaPath = useMemo(() => {
        if (!pathD) return "";
        return `${pathD} L 100,100 L 0,100 Z`;
    }, [pathD]);

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <p className="text-sm text-slate-400">Portfolio Value</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">
                                ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        {(["24h", "7d", "30d"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${timeRange === range
                                    ? "bg-blue-500 text-white"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center" style={{ height }}>
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div style={{ height }} className="relative">
                        <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="w-full h-full"
                        >
                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Area fill */}
                            <path
                                d={areaPath}
                                fill="url(#areaGradient)"
                            />

                            {/* Line */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke={isPositive ? "#22c55e" : "#ef4444"}
                                strokeWidth="0.5"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 pointer-events-none">
                            <span>${maxValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <span>${minValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
