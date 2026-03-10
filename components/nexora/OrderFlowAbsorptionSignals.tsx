/**
 * Order Flow Absorption Signals Component
 * Displays detected order flow absorption patterns
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface OrderFlowSignal {
    timestamp: string;
    type: 'absorption' | 'exhaustion' | 'imbalance';
    side: 'buy' | 'sell';
    strength: number;
    price: number;
    volume: number;
}

export function OrderFlowAbsorptionSignals() {
    const [signals, setSignals] = useState<OrderFlowSignal[]>([]);

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const response = await fetch('/api/v1/microstructure/order-flow');
                const data = await response.json();
                setSignals(data.signals || []);
            } catch (error) {
                console.error('Failed to fetch order flow signals:', error);
            }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 2000); // Update every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const getSignalIcon = (signal: OrderFlowSignal) => {
        if (signal.side === 'buy') return <TrendingUp className="h-4 w-4 text-green-600" />;
        return <TrendingDown className="h-4 w-4 text-red-600" />;
    };

    const getSignalColor = (type: string) => {
        switch (type) {
            case 'absorption': return 'bg-blue-100 text-blue-800';
            case 'exhaustion': return 'bg-red-100 text-red-800';
            case 'imbalance': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Order Flow Signals
                </CardTitle>
            </CardHeader>
            <CardContent>
                {signals.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                        No active signals
                    </div>
                ) : (
                    <div className="space-y-2">
                        {signals.slice(0, 5).map((signal, idx) => (
                            <div key={idx} className="border rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getSignalIcon(signal)}
                                    <div>
                                        <div className="font-semibold">${signal.price.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">{signal.timestamp}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge className={getSignalColor(signal.type)}>
                                        {signal.type}
                                    </Badge>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">
                                            Strength: {(signal.strength * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Vol: {(signal.volume / 1000).toFixed(1)}K
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
