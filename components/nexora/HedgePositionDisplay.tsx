/**
 * Hedge Position Display Component
 * Shows active hedge positions in portfolio
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HedgePosition {
    pair: string;
    side: 'long' | 'short';
    size: number;
    entry_price: number;
    current_price: number;
    pnl: number;
    pnl_pct: number;
    hedge_ratio: number;
}

export function HedgePositionDisplay() {
    const [hedges, setHedges] = useState<HedgePosition[]>([]);

    useEffect(() => {
        const fetchHedges = async () => {
            try {
                const response = await fetch('http://localhost:8888/api/v1/portfolio/hedges');
                const data = await response.json();
                setHedges(data.positions || []);
            } catch (error) {
                console.error('Failed to fetch hedge positions:', error);
            }
        };

        fetchHedges();
        const interval = setInterval(fetchHedges, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Hedge Positions</CardTitle>
            </CardHeader>
            <CardContent>
                {hedges.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                        No active hedges
                    </div>
                ) : (
                    <div className="space-y-3">
                        {hedges.map((hedge, idx) => (
                            <div key={idx} className="border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="font-semibold">{hedge.pair}</div>
                                    <Badge variant={hedge.side === 'long' ? 'default' : 'destructive'}>
                                        {hedge.side.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">Size</div>
                                        <div className="font-medium">${hedge.size.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Entry</div>
                                        <div className="font-medium">${hedge.entry_price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Current</div>
                                        <div className="font-medium">${hedge.current_price.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t">
                                    <div>
                                        <span className="text-muted-foreground text-sm">Hedge Ratio: </span>
                                        <span className="font-semibold">{(hedge.hedge_ratio * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className={hedge.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        <span className="font-bold">${hedge.pnl.toFixed(2)}</span>
                                        <span className="text-sm ml-1">({hedge.pnl_pct.toFixed(2)}%)</span>
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
