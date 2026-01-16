'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Loader2, DollarSign, X, AlertTriangle } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';

interface Position {
    trading_pair: string;
    side: 'LONG' | 'SHORT';
    amount: number;
    entry_price: number;
    mark_price: number;
    unrealized_pnl: number;
    unrealized_pnl_pct: number;
    leverage: number;
    liquidation_price?: number;
    account_name: string;
    connector_name: string;
    margin?: number;
}

export default function PositionsPage() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [closingPosition, setClosingPosition] = useState<string | null>(null);

    const fetchPositions = useCallback(async () => {
        try {
            const response = await backendApi.get('/orders/positions');
            if (response.data?.positions) {
                setPositions(response.data.positions);
                setError(null);
            }
        } catch (err: any) {
            console.error('[Positions] Failed to fetch:', err);
            setError('Failed to load positions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPositions();
        const interval = setInterval(fetchPositions, 5000);
        return () => clearInterval(interval);
    }, [fetchPositions]);

    const handleClosePosition = async (position: Position) => {
        const positionKey = `${position.account_name}:${position.connector_name}:${position.trading_pair}`;
        setClosingPosition(positionKey);

        try {
            await backendApi.post('/orders/positions', {
                account_name: position.account_name,
                connector_name: position.connector_name,
                trading_pair: position.trading_pair,
                side: position.side,
                amount: position.amount,
                order_type: 'MARKET'
            });

            // Refresh positions
            fetchPositions();
        } catch (err: any) {
            console.error('[Positions] Close error:', err);
        } finally {
            setClosingPosition(null);
        }
    };

    // Calculate totals
    const totalUnrealizedPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
    const totalMargin = positions.reduce((sum, p) => sum + (p.margin || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    Open Positions
                </h1>
                <button
                    onClick={fetchPositions}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Open Positions</p>
                    <p className="text-2xl font-bold text-white mt-1">{positions.length}</p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Total Unrealized P&L</p>
                    <p className={cn(
                        "text-2xl font-bold mt-1",
                        totalUnrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                        {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
                    </p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Total Margin Used</p>
                    <p className="text-2xl font-bold text-white mt-1">${totalMargin.toFixed(2)}</p>
                </div>
            </div>

            {/* Positions Table */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                {loading && positions.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-400">Loading positions...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-red-400">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <span>{error}</span>
                    </div>
                ) : positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <DollarSign className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-lg">No Open Positions</p>
                        <p className="text-sm mt-1">Your perpetual positions will appear here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800/50">
                                <tr className="text-left text-xs text-gray-400 uppercase">
                                    <th className="px-4 py-3">Trading Pair</th>
                                    <th className="px-4 py-3">Side</th>
                                    <th className="px-4 py-3">Size</th>
                                    <th className="px-4 py-3">Entry Price</th>
                                    <th className="px-4 py-3">Mark Price</th>
                                    <th className="px-4 py-3">Unrealized P&L</th>
                                    <th className="px-4 py-3">Leverage</th>
                                    <th className="px-4 py-3">Liq. Price</th>
                                    <th className="px-4 py-3">Account</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {positions.map((position, idx) => {
                                    const positionKey = `${position.account_name}:${position.connector_name}:${position.trading_pair}`;
                                    const isClosing = closingPosition === positionKey;

                                    return (
                                        <tr key={idx} className="hover:bg-gray-800/30">
                                            <td className="px-4 py-3 font-medium text-white">
                                                {position.trading_pair}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "flex items-center font-medium",
                                                    position.side === 'LONG' ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {position.side === 'LONG' ? (
                                                        <TrendingUp className="h-4 w-4 mr-1" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4 mr-1" />
                                                    )}
                                                    {position.side}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white">
                                                {position.amount.toFixed(4)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                ${position.entry_price?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                ${position.mark_price?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={cn(
                                                    "font-medium",
                                                    position.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl?.toFixed(2)}
                                                    <span className="ml-1 text-xs opacity-75">
                                                        ({position.unrealized_pnl_pct >= 0 ? '+' : ''}{position.unrealized_pnl_pct?.toFixed(2)}%)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-yellow-500">
                                                {position.leverage}x
                                            </td>
                                            <td className="px-4 py-3 text-orange-400">
                                                {position.liquidation_price
                                                    ? `$${position.liquidation_price.toLocaleString()}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">
                                                {position.account_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleClosePosition(position)}
                                                    disabled={isClosing}
                                                    className={cn(
                                                        "flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                                        isClosing
                                                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                                                    )}
                                                >
                                                    {isClosing ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                    Close
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 text-sm text-gray-400">
                <p>
                    <strong className="text-white">Note:</strong> Positions are only available for perpetual connectors.
                    Data refreshes every 5 seconds automatically.
                </p>
            </div>
        </div>
    );
}
