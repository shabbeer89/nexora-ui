'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderBookLevel {
    price: number;
    size: number;
    total: number;
    timestamp: number;
}

interface OrderBookData {
    symbol: string;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    spread: number;
    spreadPct: number;
    lastUpdate: number;
}

export default function OrderBookStream() {
    const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
    const [depth, setDepth] = useState(10);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [selectedSymbol]);

    const connectWebSocket = () => {
        try {
            // Connect to orderbook WebSocket
            const ws = new WebSocket(`ws://localhost:8888/ws/orderbook/${selectedSymbol}`);

            ws.onopen = () => {
                setIsConnected(true);
                console.log('OrderBook WebSocket connected');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setOrderBook(data);
            };

            ws.onerror = (error) => {
                console.error('OrderBook WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Reconnect after 5 seconds
                setTimeout(connectWebSocket, 5000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to connect to OrderBook WebSocket:', error);
        }
    };

    const formatPrice = (price: number) => {
        return price.toFixed(2);
    };

    const formatSize = (size: number) => {
        return size.toFixed(4);
    };

    const getBarWidth = (total: number, maxTotal: number) => {
        return `${(total / maxTotal) * 100}%`;
    };

    const maxBidTotal = orderBook?.bids[0]?.total || 0;
    const maxAskTotal = orderBook?.asks[0]?.total || 0;
    const maxTotal = Math.max(maxBidTotal, maxAskTotal);

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                📊 Order Book Stream
                                <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
                                    {isConnected ? '🟢 Live' : '🔴 Disconnected'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Real-time market depth visualization
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                            >
                                <option value="BTC/USDT">BTC/USDT</option>
                                <option value="ETH/USDT">ETH/USDT</option>
                                <option value="SOL/USDT">SOL/USDT</option>
                            </select>
                            <select
                                value={depth}
                                onChange={(e) => setDepth(Number(e.target.value))}
                                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                            >
                                <option value={5}>5 Levels</option>
                                <option value={10}>10 Levels</option>
                                <option value={20}>20 Levels</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Order Book */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Asks (Sell Orders) */}
                <Card className="bg-slate-900 border-red-900/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-red-400">Asks (Sellers)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {/* Header */}
                            <div className="grid grid-cols-3 text-xs text-slate-400 font-medium mb-2">
                                <div>Price</div>
                                <div className="text-right">Size</div>
                                <div className="text-right">Total</div>
                            </div>

                            {/* Ask Levels */}
                            <ScrollArea className="h-[400px]">
                                {orderBook?.asks.slice(0, depth).reverse().map((ask, idx) => (
                                    <div
                                        key={idx}
                                        className="relative grid grid-cols-3 text-sm py-1.5 hover:bg-red-950/20 rounded transition-colors"
                                    >
                                        {/* Background bar */}
                                        <div
                                            className="absolute inset-y-0 right-0 bg-red-950/30"
                                            style={{ width: getBarWidth(ask.total, maxTotal) }}
                                        />

                                        {/* Content */}
                                        <div className="relative text-red-400 font-mono">
                                            ${formatPrice(ask.price)}
                                        </div>
                                        <div className="relative text-right text-slate-300 font-mono">
                                            {formatSize(ask.size)}
                                        </div>
                                        <div className="relative text-right text-slate-400 font-mono text-xs">
                                            {formatSize(ask.total)}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>

                {/* Bids (Buy Orders) */}
                <Card className="bg-slate-900 border-green-900/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-green-400">Bids (Buyers)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {/* Header */}
                            <div className="grid grid-cols-3 text-xs text-slate-400 font-medium mb-2">
                                <div>Price</div>
                                <div className="text-right">Size</div>
                                <div className="text-right">Total</div>
                            </div>

                            {/* Bid Levels */}
                            <ScrollArea className="h-[400px]">
                                {orderBook?.bids.slice(0, depth).map((bid, idx) => (
                                    <div
                                        key={idx}
                                        className="relative grid grid-cols-3 text-sm py-1.5 hover:bg-green-950/20 rounded transition-colors"
                                    >
                                        {/* Background bar */}
                                        <div
                                            className="absolute inset-y-0 right-0 bg-green-950/30"
                                            style={{ width: getBarWidth(bid.total, maxTotal) }}
                                        />

                                        {/* Content */}
                                        <div className="relative text-green-400 font-mono">
                                            ${formatPrice(bid.price)}
                                        </div>
                                        <div className="relative text-right text-slate-300 font-mono">
                                            {formatSize(bid.size)}
                                        </div>
                                        <div className="relative text-right text-slate-400 font-mono text-xs">
                                            {formatSize(bid.total)}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Spread Info */}
            {orderBook && (
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Best Bid</div>
                                <div className="text-lg font-bold text-green-400 font-mono">
                                    ${formatPrice(orderBook.bids[0]?.price || 0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Best Ask</div>
                                <div className="text-lg font-bold text-red-400 font-mono">
                                    ${formatPrice(orderBook.asks[0]?.price || 0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Spread</div>
                                <div className="text-lg font-bold text-yellow-400 font-mono">
                                    ${formatPrice(orderBook.spread)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Spread %</div>
                                <div className="text-lg font-bold text-yellow-400 font-mono">
                                    {orderBook.spreadPct.toFixed(3)}%
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
