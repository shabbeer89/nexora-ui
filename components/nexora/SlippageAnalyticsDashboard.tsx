/**
 * Slippage Analytics Dashboard
 * Historical slippage analysis and optimization
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SlippageData {
    timestamp: string;
    expected_price: number;
    executed_price: number;
    slippage_bps: number;
    pair: string;
}

export function SlippageAnalyticsDashboard() {
    const [data, setData] = useState<SlippageData[]>([]);
    const [avgSlippage, setAvgSlippage] = useState<number>(0);
    const [maxSlippage, setMaxSlippage] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8888/api/v1/analytics/slippage');
                const result = await response.json();

                setData(result.history || []);
                setAvgSlippage(result.avg_slippage_bps || 0);
                setMaxSlippage(result.max_slippage_bps || 0);
            } catch (error) {
                console.error('Failed to fetch slippage data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Slippage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Avg Slippage</div>
                            <div className="text-2xl font-bold">{avgSlippage.toFixed(2)} bps</div>
                        </div>
                        <div className="border rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Max Slippage</div>
                            <div className="text-2xl font-bold text-red-600">{maxSlippage.toFixed(2)} bps</div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis label={{ value: 'Slippage (bps)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="slippage_bps" stroke="#8884d8" name="Slippage" />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="text-sm text-muted-foreground">
                        <p>• Lower slippage = better execution</p>
                        <p>• Target: &lt; 10 bps for liquid pairs</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
