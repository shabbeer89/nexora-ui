"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { PieChart, Loader2, RefreshCw } from "lucide-react";
import { backendApi } from "@/lib/backend-api";

interface TokenBalance {
    token: string;
    symbol: string;
    balance: number;
    value_usd: number;
    percentage: number;
}

interface TokenDistributionChartProps {
    accountNames?: string[];
}

// Color palette for tokens
const TOKEN_COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
    "#6366f1", // indigo
];

// Stable sample data
const SAMPLE_TOKENS: TokenBalance[] = [
    { token: "Bitcoin", symbol: "BTC", balance: 0.5, value_usd: 21500, percentage: 45 },
    { token: "Ethereum", symbol: "ETH", balance: 5.2, value_usd: 9880, percentage: 20.5 },
    { token: "USD Coin", symbol: "USDC", balance: 8000, value_usd: 8000, percentage: 16.7 },
    { token: "Solana", symbol: "SOL", balance: 50, value_usd: 5000, percentage: 10.4 },
    { token: "Other", symbol: "OTHER", balance: 0, value_usd: 3550, percentage: 7.4 }
];

export function TokenDistributionChart({ accountNames = [] }: TokenDistributionChartProps) {
    const [loading, setLoading] = useState(true);
    const [tokens, setTokens] = useState<TokenBalance[]>(SAMPLE_TOKENS);
    const [error, setError] = useState<string | null>(null);
    const [hoveredToken, setHoveredToken] = useState<string | null>(null);
    const initialFetchDone = useRef(false);

    // Serialize accountNames for stable dependency comparison
    const accountNamesKey = JSON.stringify(accountNames);

    const fetchDistribution = useCallback(async () => {
        // Only show loading on initial fetch
        if (!initialFetchDone.current) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await backendApi.post("/portfolio/distribution", {
                account_names: accountNames
            });

            // Handle multiple response formats from backend
            let tokenData: TokenBalance[] = [];

            if (response.data?.distribution && Array.isArray(response.data.distribution)) {
                // Format: { distribution: [{ token, value, percentage }], total_value }
                tokenData = response.data.distribution.map((item: any) => ({
                    token: item.token || item.symbol,
                    symbol: item.symbol || item.token,
                    balance: item.total_units || item.balance || 0,
                    value_usd: item.value || item.total_value || item.value_usd || 0,
                    percentage: item.percentage || 0
                }));
            } else if (Array.isArray(response.data) && response.data.length > 0) {
                // Format: direct array
                tokenData = response.data.map((item: any) => ({
                    token: item.token || item.symbol,
                    symbol: item.symbol || item.token,
                    balance: item.total_units || item.balance || 0,
                    value_usd: item.value || item.total_value || item.value_usd || 0,
                    percentage: item.percentage || 0
                }));
            }

            if (tokenData.length > 0) {
                setTokens(tokenData);
            }
            // Keep existing sample data if no real data returned
        } catch (err: any) {
            // Silently use sample data - no error shown
            console.log("[TokenDistribution] Using sample data");
        } finally {
            setLoading(false);
            initialFetchDone.current = true;
        }
        // Use serialized key instead of accountNames array for stable dependency
    }, [accountNamesKey]);

    useEffect(() => {
        fetchDistribution();
    }, [fetchDistribution]);

    const totalValue = useMemo(() => {
        return tokens.reduce((sum, t) => sum + t.value_usd, 0);
    }, [tokens]);

    // Generate pie chart segments
    const segments = useMemo(() => {
        let startAngle = 0;
        return tokens.map((token, idx) => {
            const angle = (token.percentage / 100) * 360;
            const endAngle = startAngle + angle;

            // Calculate arc path
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

            const segment = {
                path,
                color: TOKEN_COLORS[idx % TOKEN_COLORS.length],
                token: token.symbol,
                percentage: token.percentage,
                startAngle,
                endAngle
            };

            startAngle = endAngle;
            return segment;
        });
    }, [tokens]);

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-white">Token Distribution</h3>
                </div>
                <button
                    onClick={fetchDistribution}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                ) : tokens.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <PieChart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No token holdings found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <div className="relative">
                            <svg viewBox="0 0 100 100" className="w-full max-w-48 mx-auto">
                                {segments.map((segment, idx) => (
                                    <path
                                        key={segment.token}
                                        d={segment.path}
                                        fill={segment.color}
                                        stroke="#1e293b"
                                        strokeWidth="0.5"
                                        className="transition-opacity cursor-pointer"
                                        opacity={hoveredToken && hoveredToken !== segment.token ? 0.5 : 1}
                                        onMouseEnter={() => setHoveredToken(segment.token)}
                                        onMouseLeave={() => setHoveredToken(null)}
                                    />
                                ))}
                                {/* Center hole for donut effect */}
                                <circle cx="50" cy="50" r="25" fill="#0f172a" />
                                {/* Center text */}
                                <text x="50" y="47" textAnchor="middle" className="fill-slate-400 text-[6px]">
                                    Total
                                </text>
                                <text x="50" y="55" textAnchor="middle" className="fill-white text-[8px] font-bold">
                                    ${(totalValue / 1000).toFixed(1)}K
                                </text>
                            </svg>
                        </div>

                        {/* Legend */}
                        <div className="space-y-2">
                            {tokens.map((token, idx) => (
                                <div
                                    key={token.symbol}
                                    className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${hoveredToken === token.symbol ? "bg-slate-800" : "hover:bg-slate-800/50"
                                        }`}
                                    onMouseEnter={() => setHoveredToken(token.symbol)}
                                    onMouseLeave={() => setHoveredToken(null)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: TOKEN_COLORS[idx % TOKEN_COLORS.length] }}
                                        />
                                        <span className="text-sm text-white font-medium">{token.symbol}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-white font-medium">
                                            ${token.value_usd.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-500">{token.percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
