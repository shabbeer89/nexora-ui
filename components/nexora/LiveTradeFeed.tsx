/**
 * Live Trade Execution Feed Component
 * Real-time trade execution display
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Trade {
    id: string;
    timestamp: string;
    pair: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    total: number;
    pnl?: number;
    pnl_pct?: number;
    status: 'open' | 'closed';
}

export function LiveTradeFeed() {
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        // WebSocket for real-time trade updates
        const ws = new WebSocket('ws://localhost:8888/ws/trades');

        ws.onmessage = (event) => {
            const trade = JSON.parse(event.data);
            setTrades(prev => [trade, ...prev].slice(0, 20)); // Keep last 20 trades
        };

        ws.onerror = () => {
            // Fallback to HTTP polling
            const interval = setInterval(async () => {
                try {
                    const response = await fetch('/api/v1/trades/recent');
                    const data = await response.json();
                    setTrades(data.trades || []);
                } catch (error) {
                    console.error('Failed to fetch trades:', error);
                }
            }, 2000);

            return () => clearInterval(interval);
        };

        return () => ws.close();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Live Trade Feed</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {trades.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            No trades yet
                        </div>
                    ) : (
                        trades.map((trade) => (
                            <div key={trade.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {trade.side === 'buy' ? (
                                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="font-semibold">{trade.pair}</span>
                                        <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                                            {trade.side.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{trade.timestamp}</div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">Price</div>
                                        <div className="font-mono">${trade.price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Amount</div>
                                        <div className="font-mono">{trade.amount.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Total</div>
                                        <div className="font-mono">${trade.total.toFixed(2)}</div>
                                    </div>
                                </div>

                                {trade.status === 'closed' && trade.pnl !== undefined && (
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <Badge variant={trade.pnl >= 0 ? 'default' : 'destructive'}>
                                            {trade.status}
                                        </Badge>
                                        <div className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            <span className="font-bold">${trade.pnl.toFixed(2)}</span>
                                            <span className="text-sm ml-1">({trade.pnl_pct?.toFixed(2)}%)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
