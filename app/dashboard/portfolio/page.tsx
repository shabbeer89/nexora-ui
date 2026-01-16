// Portfolio Dashboard Component
// app/dashboard/portfolio/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { nexoraAPI } from '@/lib/nexora-api';

export default function PortfolioDashboard() {
    const [portfolio, setPortfolio] = useState<any>(null);
    const [positions, setPositions] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [portfolioData, positionsData] = await Promise.all([
                    nexoraAPI.getPortfolio(),
                    nexoraAPI.getPositions()
                ]);

                setPortfolio(portfolioData);
                setPositions(positionsData);
            } catch (error) {
                console.error('Failed to fetch portfolio data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Update every 5s

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading portfolio...</div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-4xl font-bold">Unified Portfolio</h1>

            {/* Total Value Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
                <p className="text-sm opacity-80 mb-2">Total Portfolio Value</p>
                <h2 className="text-6xl font-bold mb-4">
                    ${portfolio?.total_value_usd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-sm opacity-90">
                    Last Updated: {new Date(portfolio?.timestamp).toLocaleString()}
                </p>
            </div>

            {/* CEX vs DEX Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CEX Portfolio */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">CEX (FreqTrade)</h3>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                            Centralized
                        </span>
                    </div>

                    <div className="text-4xl font-bold mb-4">
                        ${portfolio?.cex?.total_usd?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Percentage</span>
                            <span className="font-semibold">
                                {((portfolio?.cex?.total_usd / portfolio?.total_value_usd) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* DEX Portfolio */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">DEX (HummingBot)</h3>
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-semibold">
                            Decentralized
                        </span>
                    </div>

                    <div className="text-4xl font-bold mb-4">
                        ${portfolio?.dex?.total_usd?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Percentage</span>
                            <span className="font-semibold">
                                {((portfolio?.dex?.total_usd / portfolio?.total_value_usd) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orchestrator Data */}
            {portfolio?.orchestrator && Object.keys(portfolio.orchestrator).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-2xl font-bold mb-4">Multi-Venue Pricing</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Best Bid</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${portfolio.orchestrator.best_bid?.toFixed(2)}
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Best Ask</p>
                            <p className="text-2xl font-bold text-red-600">
                                ${portfolio.orchestrator.best_ask?.toFixed(2)}
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Spread</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {portfolio.orchestrator.spread?.toFixed(4)}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Active Venues</p>
                        <div className="flex flex-wrap gap-2">
                            {portfolio.orchestrator.venues?.map((venue: string) => (
                                <span
                                    key={venue}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-semibold"
                                >
                                    {venue}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Positions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold mb-6">Active Positions</h3>

                <div className="space-y-4">
                    {/* CEX Positions */}
                    {positions?.cex_positions?.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-blue-600">CEX Positions</h4>
                            {positions.cex_positions.map((pos: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{pos.symbol}</p>
                                            <p className="text-sm text-gray-500">{pos.side}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">${pos.size_usd?.toFixed(2)}</p>
                                            <p className={`text-sm ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {pos.pnl >= 0 ? '+' : ''}{pos.pnl?.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* DEX Positions */}
                    {positions?.dex_positions?.length > 0 && (
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-purple-600">DEX Positions</h4>
                            {positions.dex_positions.map((pos: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{pos.symbol}</p>
                                            <p className="text-sm text-gray-500">{pos.side}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">${pos.size_usd?.toFixed(2)}</p>
                                            <p className={`text-sm ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {pos.pnl >= 0 ? '+' : ''}{pos.pnl?.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {positions?.total_positions === 0 && (
                        <p className="text-center text-gray-500 py-8">No active positions</p>
                    )}
                </div>
            </div>
        </div>
    );
}
