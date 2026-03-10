/**
 * Kelly Sizing Transparency Component
 * Shows Kelly Criterion calculation breakdown
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface KellyData {
    win_rate: number;
    avg_win: number;
    avg_loss: number;
    kelly_pct: number;
    fractional_kelly: number;
    recommended_size: number;
    volatility_adjustment: number;
}

export function KellySizingTransparency() {
    const [kelly, setKelly] = useState<KellyData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/v1/risk/kelly-sizing');
                const data = await response.json();
                setKelly(data);
            } catch (error) {
                console.error('Failed to fetch Kelly data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!kelly) return <div>Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kelly Sizing Calculator</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">Win Rate</div>
                            <div className="font-bold text-green-600">{(kelly.win_rate * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Avg Win</div>
                            <div className="font-bold">{kelly.avg_win.toFixed(2)}R</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Avg Loss</div>
                            <div className="font-bold text-red-600">{kelly.avg_loss.toFixed(2)}R</div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="text-sm font-semibold mb-2">Kelly Calculation:</div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Full Kelly %:</span>
                                <span className="font-mono">{(kelly.kelly_pct * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Fractional Kelly (25%):</span>
                                <span className="font-mono">{(kelly.fractional_kelly * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Volatility Adjustment:</span>
                                <span className="font-mono">×{kelly.volatility_adjustment.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-2">Recommended Position Size</div>
                        <div className="text-3xl font-bold text-blue-600">
                            ${kelly.recommended_size.toFixed(2)}
                        </div>
                        <Progress value={kelly.fractional_kelly * 100} className="mt-2" />
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <p>Formula: Kelly% = (Win% × AvgWin - Loss% × AvgLoss) / AvgWin</p>
                        <p>Using fractional Kelly (25%) for safety</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
