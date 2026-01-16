"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

interface Opportunity {
    pair: string;
    percentage: number;
    entryPrice: number;
    targetPrice: number;
    exchange: string;
}

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        // Mock data - replace with actual API call
        const mockOpportunities = [
            { pair: "BONE/USDT", percentage: 0.0007, entryPrice: 0.4521, targetPrice: 0.4524, exchange: "BYBIT" },
            { pair: "FIS/USDT", percentage: 0.0007, entryPrice: 0.3245, targetPrice: 0.3247, exchange: "BYBIT" },
            { pair: "SOLO/USDT", percentage: 0.0002, entryPrice: 0.1823, targetPrice: 0.1824, exchange: "BYBIT" },
            { pair: "XAI/USDT", percentage: 0.0002, entryPrice: 0.2456, targetPrice: 0.2457, exchange: "BYBIT" },
            { pair: "ARB/USDT", percentage: 0.0006, entryPrice: 0.7234, targetPrice: 0.7238, exchange: "BYBIT" },
            { pair: "OP/USDT", percentage: 0.0005, entryPrice: 1.523, targetPrice: 1.524, exchange: "BYBIT" },
        ];
        setOpportunities(mockOpportunities);
    }, []);

    const refreshOpportunities = () => {
        setLastUpdate(new Date());
        // Trigger API refresh
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background-dark)' }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Trading Opportunities
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={refreshOpportunities}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {opportunities.map((opp, idx) => (
                    <div
                        key={idx}
                        className="rounded-xl p-5"
                        style={{
                            backgroundColor: 'var(--background-card)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                {opp.pair}
                            </h3>
                            <span
                                className="text-sm font-medium px-2 py-1 rounded"
                                style={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    color: 'var(--color-success)'
                                }}
                            >
                                +{(opp.percentage * 100).toFixed(4)}%
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Entry Price
                                </span>
                                <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                                    ${opp.entryPrice.toFixed(4)}
                                </span>
                            </div>
                            <div className="flex items-center justify-center py-2">
                                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Target Price
                                </span>
                                <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                                    ${opp.targetPrice.toFixed(4)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span>Exchange: {opp.exchange}</span>
                            </div>
                        </div>

                        <button
                            className="w-full mt-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                        >
                            Execute Trade
                        </button>
                    </div>
                ))}
            </div>

            {opportunities.length === 0 && (
                <div
                    className="rounded-xl p-12 text-center"
                    style={{ backgroundColor: 'var(--background-card)' }}
                >
                    <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                        No opportunities detected at the moment
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                        The bot is scanning markets for profitable trades
                    </p>
                </div>
            )}
        </div>
    );
}
