/**
 * Multi-Timeframe Synthesis Component
 * Unified view of multiple timeframes
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeframeData {
    timeframe: string;
    trend: 'up' | 'down' | 'neutral';
    strength: number;
    data: Array<{ time: string; price: number }>;
}

export function MultiTimeframeSynthesis() {
    const [timeframes, setTimeframes] = useState<TimeframeData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/v1/analytics/multi-timeframe');
                const data = await response.json();
                setTimeframes(data.timeframes || []);
            } catch (error) {
                console.error('Failed to fetch multi-timeframe data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'up': return 'text-green-600';
            case 'down': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Multi-Timeframe Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    {timeframes.map((tf, idx) => (
                        <div key={idx} className="border rounded-lg p-3 text-center">
                            <div className="text-sm text-muted-foreground">{tf.timeframe}</div>
                            <div className={`text-lg font-bold ${getTrendColor(tf.trend)}`}>
                                {tf.trend.toUpperCase()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {(tf.strength * 100).toFixed(0)}% strength
                            </div>
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="1h" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="5m">5m</TabsTrigger>
                        <TabsTrigger value="1h">1h</TabsTrigger>
                        <TabsTrigger value="4h">4h</TabsTrigger>
                        <TabsTrigger value="1d">1d</TabsTrigger>
                    </TabsList>

                    {timeframes.map((tf, idx) => (
                        <TabsContent key={idx} value={tf.timeframe}>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={tf.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="price" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
