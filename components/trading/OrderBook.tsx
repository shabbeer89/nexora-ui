'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';

// Helper to strip _paper_trade suffix for market data API
const getBaseConnector = (connector: string): string => {
    return connector.replace(/_paper_trade$/, '');
};

interface OrderBookLevel {
    price: number;
    amount: number;
}

interface OrderBookProps {
    connector?: string;
    tradingPair?: string;
    depth?: number;
    className?: string;
}

export function OrderBook({
    connector = 'binance',
    tradingPair = 'BTC-USDT',
    depth = 15,
    className
}: OrderBookProps) {
    const [bids, setBids] = useState<OrderBookLevel[]>([]);
    const [asks, setAsks] = useState<OrderBookLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConnector, setSelectedConnector] = useState(connector);
    const [selectedPair, setSelectedPair] = useState(tradingPair);

    const fetchOrderBook = useCallback(async () => {
        try {
            const response = await backendApi.post('/market-data', {
                action: 'orderbook',
                connector: getBaseConnector(selectedConnector),
                pair: selectedPair,
                depth: depth
            });

            if (response.data?.error) {
                setError(response.data.error);
                setBids([]);
                setAsks([]);
            } else if (response.data) {
                // Normalize bids/asks (handle both [[price, amount], ...] and [{price, amount}, ...])
                const normalize = (levels: any[]): OrderBookLevel[] => {
                    if (!Array.isArray(levels)) return [];
                    return levels.filter(l => l !== null && l !== undefined).map(l => {
                        if (Array.isArray(l)) {
                            return { price: Number(l[0]) || 0, amount: Number(l[1]) || 0 };
                        }
                        return {
                            price: Number(l.price) || 0,
                            amount: Number(l.amount) || Number(l.quantity) || 0
                        };
                    });
                };

                setBids(normalize(response.data.bids));
                setAsks(normalize(response.data.asks));
                setError(null);
            }
        } catch (err: any) {
            console.error('[OrderBook] Failed to fetch:', err);
            setError(err.message || 'Failed to load order book');
        } finally {
            setLoading(false);
        }
    }, [selectedConnector, selectedPair, depth]);

    useEffect(() => {
        fetchOrderBook();
        const interval = setInterval(fetchOrderBook, 2000); // Update every 2 seconds
        return () => clearInterval(interval);
    }, [fetchOrderBook]);

    // Calculate max amounts for visualization
    const maxBidAmount = Math.max(...bids.map(b => b.amount), 1);
    const maxAskAmount = Math.max(...asks.map(a => a.amount), 1);
    const maxAmount = Math.max(maxBidAmount, maxAskAmount);

    // Calculate spread
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    const renderLevel = (level: OrderBookLevel, side: 'bid' | 'ask', index: number) => {
        const amount = level?.amount || 0;
        const price = level?.price || 0;
        const percentage = (amount / maxAmount) * 100;

        return (
            <div
                key={`${side}-${index}`}
                className="relative flex items-center justify-between py-1 px-2 text-sm hover:bg-gray-800/50"
            >
                {/* Background bar */}
                <div
                    className={cn(
                        "absolute inset-y-0 h-full opacity-20",
                        side === 'bid' ? 'right-0 bg-green-500' : 'left-0 bg-red-500'
                    )}
                    style={{
                        width: `${percentage}%`,
                        ...(side === 'bid' && { right: 0 })
                    }}
                />

                {side === 'bid' ? (
                    <>
                        <span className="text-gray-400 z-10">{amount.toFixed(4)}</span>
                        <span className="text-green-400 font-mono z-10">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </>
                ) : (
                    <>
                        <span className="text-red-400 font-mono z-10">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-gray-400 z-10">{amount.toFixed(4)}</span>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className={cn("rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden", className)}>
            {/* Header */}
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={selectedPair}
                        onChange={(e) => setSelectedPair(e.target.value.toUpperCase())}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white w-28"
                        placeholder="BTC-USDT"
                    />
                    <span className="text-xs text-gray-500">Order Book</span>
                </div>
                <button
                    onClick={fetchOrderBook}
                    disabled={loading}
                    className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </button>
            </div>

            {loading && bids.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-400">Loading...</span>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center py-12 text-red-400 text-sm">
                    {error}
                </div>
            ) : (
                <div className="divide-y divide-gray-800">
                    {/* Asks (reversed to show best ask at bottom) */}
                    <div className="flex flex-col-reverse max-h-[250px] overflow-y-auto">
                        {asks.slice(0, depth).map((ask, idx) => renderLevel(ask, 'ask', idx))}
                    </div>

                    {/* Spread */}
                    <div className="flex items-center justify-center py-2 bg-gray-800/30">
                        <span className="text-xs text-gray-500 mr-2">Spread</span>
                        <span className="text-sm font-mono text-gray-300">
                            {spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
                        </span>
                    </div>

                    {/* Bids */}
                    <div className="max-h-[250px] overflow-y-auto">
                        {bids.slice(0, depth).map((bid, idx) => renderLevel(bid, 'bid', idx))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="p-2 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                <span>Amount</span>
                <span>Price (USDT)</span>
            </div>
        </div>
    );
}

export default OrderBook;
