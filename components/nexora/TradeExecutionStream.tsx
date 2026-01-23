'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Trade {
    id: string;
    timestamp: number;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    value: number;
    exchange: string;
    strategy: string;
    orderId: string;
}

interface TradeStats {
    totalTrades: number;
    totalVolume: number;
    buyVolume: number;
    sellVolume: number;
    avgPrice: number;
    lastPrice: number;
}

export default function TradeExecutionStream() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [stats, setStats] = useState<TradeStats>({
        totalTrades: 0,
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0,
        avgPrice: 0,
        lastPrice: 0,
    });
    const [isConnected, setIsConnected] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState('ALL');
    const [maxTrades, setMaxTrades] = useState(50);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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
            const ws = new WebSocket(`ws://localhost:8888/ws/trades${selectedSymbol !== 'ALL' ? `/${selectedSymbol}` : ''}`);

            ws.onopen = () => {
                setIsConnected(true);
                console.log('Trade Execution WebSocket connected');
            };

            ws.onmessage = (event) => {
                const trade: Trade = JSON.parse(event.data);

                setTrades(prev => {
                    const newTrades = [trade, ...prev].slice(0, maxTrades);
                    return newTrades;
                });

                // Update stats
                setStats(prev => ({
                    totalTrades: prev.totalTrades + 1,
                    totalVolume: prev.totalVolume + trade.value,
                    buyVolume: prev.buyVolume + (trade.side === 'buy' ? trade.value : 0),
                    sellVolume: prev.sellVolume + (trade.side === 'sell' ? trade.value : 0),
                    avgPrice: (prev.avgPrice * prev.totalTrades + trade.price) / (prev.totalTrades + 1),
                    lastPrice: trade.price,
                }));

                // Auto-scroll to top
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = 0;
                }
            };

            ws.onerror = (error) => {
                console.error('Trade Execution WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                setTimeout(connectWebSocket, 5000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to connect to Trade Execution WebSocket:', error);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour12: false });
    };

    const formatPrice = (price: number) => {
        return price.toFixed(2);
    };

    const formatAmount = (amount: number) => {
        return amount.toFixed(4);
    };

    const formatValue = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(2)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(2)}K`;
        }
        return `$${value.toFixed(2)}`;
    };

    const clearTrades = () => {
        setTrades([]);
        setStats({
            totalTrades: 0,
            totalVolume: 0,
            buyVolume: 0,
            sellVolume: 0,
            avgPrice: 0,
            lastPrice: 0,
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                ⚡ Trade Execution Stream
                                <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
                                    {isConnected ? '🟢 Live' : '🔴 Disconnected'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Real-time trade execution monitoring
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                            >
                                <option value="ALL">All Symbols</option>
                                <option value="BTC/USDT">BTC/USDT</option>
                                <option value="ETH/USDT">ETH/USDT</option>
                                <option value="SOL/USDT">SOL/USDT</option>
                            </select>
                            <button
                                onClick={clearTrades}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Total Trades</div>
                            <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Total Volume</div>
                            <div className="text-2xl font-bold text-blue-400">{formatValue(stats.totalVolume)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-green-900/30">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Buy Volume</div>
                            <div className="text-2xl font-bold text-green-400">{formatValue(stats.buyVolume)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-red-900/30">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Sell Volume</div>
                            <div className="text-2xl font-bold text-red-400">{formatValue(stats.sellVolume)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Avg Price</div>
                            <div className="text-2xl font-bold text-yellow-400 font-mono">
                                ${formatPrice(stats.avgPrice)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Last Price</div>
                            <div className="text-2xl font-bold text-yellow-400 font-mono">
                                ${formatPrice(stats.lastPrice)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Trade List */}
            <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white">Recent Executions</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]" ref={scrollRef}>
                        <div className="space-y-2">
                            {trades.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    Waiting for trades...
                                </div>
                            ) : (
                                trades.map((trade) => (
                                    <div
                                        key={trade.id}
                                        className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${trade.side === 'buy'
                                                ? 'bg-green-950/20 border-green-900/30 hover:border-green-700/50'
                                                : 'bg-red-950/20 border-red-900/30 hover:border-red-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    variant={trade.side === 'buy' ? 'default' : 'destructive'}
                                                    className="w-16 justify-center"
                                                >
                                                    {trade.side.toUpperCase()}
                                                </Badge>
                                                <div>
                                                    <div className="font-bold text-white">{trade.symbol}</div>
                                                    <div className="text-xs text-slate-400">{trade.exchange}</div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-mono text-lg font-bold text-white">
                                                    ${formatPrice(trade.price)}
                                                </div>
                                                <div className="text-xs text-slate-400">{formatTime(trade.timestamp)}</div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm text-slate-300">
                                                    {formatAmount(trade.amount)} {trade.symbol.split('/')[0]}
                                                </div>
                                                <div className="text-xs font-bold text-blue-400">
                                                    {formatValue(trade.value)}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs text-slate-400">Strategy</div>
                                                <div className="text-sm text-purple-400">{trade.strategy}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
