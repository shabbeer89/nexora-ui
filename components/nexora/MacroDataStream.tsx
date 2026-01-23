'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MacroDataPoint {
    timestamp: number;
    spx: number;
    vix: number;
    dxy: number;
    gold: number;
}

interface MacroIndicator {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePct: number;
    status: 'bullish' | 'bearish' | 'neutral';
}

export default function MacroDataStream() {
    const [macroData, setMacroData] = useState<MacroDataPoint[]>([]);
    const [indicators, setIndicators] = useState<MacroIndicator[]>([
        { name: 'S&P 500', symbol: 'SPX', value: 0, change: 0, changePct: 0, status: 'neutral' },
        { name: 'VIX', symbol: 'VIX', value: 0, change: 0, changePct: 0, status: 'neutral' },
        { name: 'Dollar Index', symbol: 'DXY', value: 0, change: 0, changePct: 0, status: 'neutral' },
        { name: 'Gold', symbol: 'GOLD', value: 0, change: 0, changePct: 0, status: 'neutral' },
    ]);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        try {
            const ws = new WebSocket('ws://localhost:8888/ws/macro');

            ws.onopen = () => {
                setIsConnected(true);
                console.log('Macro Data WebSocket connected');
            };

            ws.onmessage = (event) => {
                const data: MacroDataPoint = JSON.parse(event.data);

                setMacroData(prev => {
                    const newData = [...prev, data].slice(-100); // Keep last 100 points
                    return newData;
                });

                // Update indicators
                if (macroData.length > 0) {
                    const prevData = macroData[macroData.length - 1];

                    setIndicators([
                        {
                            name: 'S&P 500',
                            symbol: 'SPX',
                            value: data.spx,
                            change: data.spx - prevData.spx,
                            changePct: ((data.spx - prevData.spx) / prevData.spx) * 100,
                            status: data.spx > prevData.spx ? 'bullish' : data.spx < prevData.spx ? 'bearish' : 'neutral',
                        },
                        {
                            name: 'VIX',
                            symbol: 'VIX',
                            value: data.vix,
                            change: data.vix - prevData.vix,
                            changePct: ((data.vix - prevData.vix) / prevData.vix) * 100,
                            status: data.vix < prevData.vix ? 'bullish' : data.vix > prevData.vix ? 'bearish' : 'neutral',
                        },
                        {
                            name: 'Dollar Index',
                            symbol: 'DXY',
                            value: data.dxy,
                            change: data.dxy - prevData.dxy,
                            changePct: ((data.dxy - prevData.dxy) / prevData.dxy) * 100,
                            status: data.dxy > prevData.dxy ? 'bearish' : data.dxy < prevData.dxy ? 'bullish' : 'neutral',
                        },
                        {
                            name: 'Gold',
                            symbol: 'GOLD',
                            value: data.gold,
                            change: data.gold - prevData.gold,
                            changePct: ((data.gold - prevData.gold) / prevData.gold) * 100,
                            status: data.gold > prevData.gold ? 'bullish' : data.gold < prevData.gold ? 'bearish' : 'neutral',
                        },
                    ]);
                }
            };

            ws.onerror = (error) => {
                console.error('Macro Data WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                setTimeout(connectWebSocket, 5000);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to connect to Macro Data WebSocket:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'bullish':
                return 'text-green-400';
            case 'bearish':
                return 'text-red-400';
            default:
                return 'text-slate-400';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'bullish':
                return <Badge className="bg-green-600">📈 Bullish</Badge>;
            case 'bearish':
                return <Badge className="bg-red-600">📉 Bearish</Badge>;
            default:
                return <Badge variant="secondary">➡️ Neutral</Badge>;
        }
    };

    const formatValue = (value: number, decimals: number = 2) => {
        return value.toFixed(decimals);
    };

    const formatChange = (change: number, changePct: number) => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                🌍 Macro Data Stream
                                <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
                                    {isConnected ? '🟢 Live' : '🔴 Disconnected'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Real-time macro economic indicators
                            </CardDescription>
                        </div>
                        <select
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                        >
                            <option value="5M">5 Minutes</option>
                            <option value="15M">15 Minutes</option>
                            <option value="1H">1 Hour</option>
                            <option value="4H">4 Hours</option>
                        </select>
                    </div>
                </CardHeader>
            </Card>

            {/* Indicator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {indicators.map((indicator) => (
                    <Card
                        key={indicator.symbol}
                        className={`bg-slate-900 border transition-all hover:scale-105 ${indicator.status === 'bullish'
                                ? 'border-green-900/30'
                                : indicator.status === 'bearish'
                                    ? 'border-red-900/30'
                                    : 'border-slate-700'
                            }`}
                    >
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-slate-400">{indicator.name}</div>
                                    {getStatusBadge(indicator.status)}
                                </div>

                                <div className="text-3xl font-bold text-white font-mono">
                                    {formatValue(indicator.value)}
                                </div>

                                <div className={`text-sm font-medium ${getStatusColor(indicator.status)}`}>
                                    {formatChange(indicator.change, indicator.changePct)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* SPX & VIX Chart */}
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">S&P 500 & VIX</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={macroData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                    stroke="#94a3b8"
                                />
                                <YAxis yAxisId="left" stroke="#10b981" />
                                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="spx"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                    name="S&P 500"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="vix"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={false}
                                    name="VIX"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* DXY & Gold Chart */}
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Dollar Index & Gold</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={macroData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                    stroke="#94a3b8"
                                />
                                <YAxis yAxisId="left" stroke="#3b82f6" />
                                <YAxis yAxisId="right" orientation="right" stroke="#eab308" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="dxy"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    name="DXY"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="gold"
                                    stroke="#eab308"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Gold"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Market Sentiment */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Market Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800 rounded-lg">
                            <div className="text-sm text-slate-400 mb-2">Risk Appetite</div>
                            <div className="text-2xl font-bold text-green-400">
                                {indicators[0].status === 'bullish' && indicators[1].status === 'bullish'
                                    ? 'Risk On 📈'
                                    : indicators[0].status === 'bearish' && indicators[1].status === 'bearish'
                                        ? 'Risk Off 📉'
                                        : 'Mixed ➡️'}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800 rounded-lg">
                            <div className="text-sm text-slate-400 mb-2">Dollar Strength</div>
                            <div className="text-2xl font-bold text-blue-400">
                                {indicators[2].status === 'bullish' ? 'Strong 💪' : indicators[2].status === 'bearish' ? 'Weak 📉' : 'Neutral ➡️'}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800 rounded-lg">
                            <div className="text-sm text-slate-400 mb-2">Safe Haven Demand</div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {indicators[3].status === 'bullish' ? 'High 🔥' : indicators[3].status === 'bearish' ? 'Low ❄️' : 'Moderate ➡️'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
