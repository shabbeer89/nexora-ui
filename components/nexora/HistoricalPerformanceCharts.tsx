/**
 * Historical Performance Charts Component
 * PnL curve, drawdown, and performance metrics
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceData {
    timestamp: string;
    pnl: number;
    cumulative_pnl: number;
    drawdown: number;
    sharpe: number;
}

export function HistoricalPerformanceCharts() {
    const [data, setData] = useState<PerformanceData[]>([]);
    const [stats, setStats] = useState({ total_pnl: 0, max_dd: 0, sharpe: 0, win_rate: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8888/api/v1/analytics/performance');
                const result = await response.json();

                setData(result.history || []);
                setStats(result.stats || {});
            } catch (error) {
                console.error('Failed to fetch performance data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="border rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Total P&L</div>
                            <div className={`text-2xl font-bold ${stats.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${stats.total_pnl.toFixed(2)}
                            </div>
                        </div>
                        <div className="border rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Max Drawdown</div>
                            <div className="text-2xl font-bold text-red-600">
                                {(stats.max_dd * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div className="border rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                            <div className="text-2xl font-bold">
                                {stats.sharpe.toFixed(2)}
                            </div>
                        </div>
                        <div className="border rounded-lg p-3">
                            <div className="text-sm text-muted-foreground">Win Rate</div>
                            <div className="text-2xl font-bold">
                                {(stats.win_rate * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <Tabs defaultValue="pnl" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="pnl">P&L Curve</TabsTrigger>
                            <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pnl">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulative_pnl"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.3}
                                        name="Cumulative P&L"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        <TabsContent value="drawdown">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="drawdown"
                                        stroke="#ef4444"
                                        fill="#ef4444"
                                        fillOpacity={0.3}
                                        name="Drawdown %"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}
