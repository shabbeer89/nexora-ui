/**
 * Live Order Book Component
 * Real-time order book display
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderBookLevel {
    price: number;
    size: number;
    total: number;
}

interface OrderBookData {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    spread: number;
    mid_price: number;
}

export function LiveOrderBook() {
    const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [], spread: 0, mid_price: 0 });

    useEffect(() => {
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:8888/ws/orderbook');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setOrderBook(data);
        };

        ws.onerror = () => {
            // Fallback to HTTP polling
            const interval = setInterval(async () => {
                try {
                    const response = await fetch('/api/v1/orderbook/snapshot');
                    const data = await response.json();
                    setOrderBook(data);
                } catch (error) {
                    console.error('Failed to fetch order book:', error);
                }
            }, 1000);

            return () => clearInterval(interval);
        };

        return () => ws.close();
    }, []);

    const maxTotal = Math.max(
        ...orderBook.bids.map(b => b.total),
        ...orderBook.asks.map(a => a.total)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Live Order Book</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {/* Asks (sells) */}
                    <div className="space-y-1">
                        {orderBook.asks.slice(0, 10).reverse().map((ask, idx) => (
                            <div key={idx} className="relative flex justify-between text-sm">
                                <div
                                    className="absolute inset-0 bg-red-100 opacity-30"
                                    style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                                />
                                <span className="relative z-10 text-red-600 font-mono">${ask.price.toFixed(2)}</span>
                                <span className="relative z-10 font-mono">{ask.size.toFixed(4)}</span>
                                <span className="relative z-10 text-muted-foreground font-mono">{ask.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Spread */}
                    <div className="border-y py-2 text-center">
                        <div className="text-lg font-bold">${orderBook.mid_price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                            Spread: ${orderBook.spread.toFixed(2)} ({((orderBook.spread / orderBook.mid_price) * 100).toFixed(3)}%)
                        </div>
                    </div>

                    {/* Bids (buys) */}
                    <div className="space-y-1">
                        {orderBook.bids.slice(0, 10).map((bid, idx) => (
                            <div key={idx} className="relative flex justify-between text-sm">
                                <div
                                    className="absolute inset-0 bg-green-100 opacity-30"
                                    style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                                />
                                <span className="relative z-10 text-green-600 font-mono">${bid.price.toFixed(2)}</span>
                                <span className="relative z-10 font-mono">{bid.size.toFixed(4)}</span>
                                <span className="relative z-10 text-muted-foreground font-mono">{bid.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
