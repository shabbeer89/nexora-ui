'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Loader2, Circle, Settings } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';

interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface PriceChartProps {
    connector?: string;
    tradingPair?: string;
    interval?: string;
    className?: string;
}

const intervalOptions = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
];

export function PriceChart({
    connector = 'binance',
    tradingPair = 'BTC-USDT',
    interval: initialInterval = '5m',
    className
}: PriceChartProps) {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [interval, setInterval] = useState(initialInterval);
    const [selectedConnector, setSelectedConnector] = useState(connector);
    const [selectedPair, setSelectedPair] = useState(tradingPair);
    const [connectors, setConnectors] = useState<string[]>([]);

    const chartRef = useRef<HTMLDivElement>(null);

    // Fetch available connectors
    const fetchConnectors = useCallback(async () => {
        try {
            const response = await backendApi.post('/market-data', { action: 'connectors' });
            if (response.data?.connectors) {
                setConnectors(response.data.connectors);
            }
        } catch (err) {
            console.error('[PriceChart] Failed to fetch connectors:', err);
        }
    }, []);

    // Fetch candles data
    const fetchCandles = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await backendApi.post('/market-data', {
                action: 'candles',
                connector: selectedConnector,
                pair: selectedPair,
                interval: interval,
                limit: 100
            });

            if (response.data?.error) {
                setError(response.data.error);
                setCandles([]);
            } else if (response.data?.candles) {
                // Normalize candle data
                const normalizedCandles = response.data.candles.map((c: any) => ({
                    timestamp: c.timestamp,
                    open: parseFloat(c.open),
                    high: parseFloat(c.high),
                    low: parseFloat(c.low),
                    close: parseFloat(c.close),
                    volume: parseFloat(c.volume)
                }));
                setCandles(normalizedCandles);
            }
        } catch (err: any) {
            console.error('[PriceChart] Failed to fetch candles:', err);
            setError(err.message || 'Failed to load chart data');
        } finally {
            setLoading(false);
        }
    }, [selectedConnector, selectedPair, interval]);

    useEffect(() => {
        fetchConnectors();
    }, [fetchConnectors]);

    useEffect(() => {
        fetchCandles();
        // Refresh every 30 seconds
        const refreshInterval = window.setInterval(fetchCandles, 30000);
        return () => window.clearInterval(refreshInterval);
    }, [fetchCandles]);

    // Calculate chart metrics
    const latestCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];
    const priceChange = latestCandle && previousCandle
        ? latestCandle.close - previousCandle.close
        : 0;
    const priceChangePercent = previousCandle
        ? (priceChange / previousCandle.close) * 100
        : 0;
    const isPositive = priceChange >= 0;

    // Get price range for scaling
    const allHighs = candles.map(c => c.high);
    const allLows = candles.map(c => c.low);
    const maxPrice = Math.max(...allHighs, 0);
    const minPrice = Math.min(...allLows, Infinity);
    const priceRange = maxPrice - minPrice || 1;

    // Simple candlestick rendering
    const renderCandlesticks = () => {
        if (candles.length === 0) return null;

        const chartWidth = 100; // percentage
        const chartHeight = 200;
        const candleWidth = chartWidth / candles.length;
        const padding = 2;

        return (
            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-48"
                preserveAspectRatio="none"
            >
                {candles.map((candle, idx) => {
                    const x = idx * candleWidth + candleWidth / 4;
                    const wickX = idx * candleWidth + candleWidth / 2;
                    const width = candleWidth / 2;

                    const isUp = candle.close >= candle.open;
                    const color = isUp ? '#22c55e' : '#ef4444';

                    // Scale prices to chart height
                    const scaleY = (price: number) =>
                        chartHeight - ((price - minPrice) / priceRange) * (chartHeight - padding * 2) - padding;

                    const openY = scaleY(candle.open);
                    const closeY = scaleY(candle.close);
                    const highY = scaleY(candle.high);
                    const lowY = scaleY(candle.low);

                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.abs(closeY - openY) || 1;

                    return (
                        <g key={idx}>
                            {/* Wick */}
                            <line
                                x1={wickX}
                                y1={highY}
                                x2={wickX}
                                y2={lowY}
                                stroke={color}
                                strokeWidth="0.5"
                            />
                            {/* Body */}
                            <rect
                                x={x}
                                y={bodyTop}
                                width={width}
                                height={bodyHeight}
                                fill={color}
                            />
                        </g>
                    );
                })}
            </svg>
        );
    };

    // Render volume bars
    const renderVolumeBars = () => {
        if (candles.length === 0) return null;

        const maxVolume = Math.max(...candles.map(c => c.volume));
        const chartWidth = 100;
        const chartHeight = 50;
        const barWidth = chartWidth / candles.length;

        return (
            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-12"
                preserveAspectRatio="none"
            >
                {candles.map((candle, idx) => {
                    const x = idx * barWidth;
                    const width = barWidth * 0.8;
                    const height = (candle.volume / maxVolume) * chartHeight;
                    const isUp = candle.close >= candle.open;

                    return (
                        <rect
                            key={idx}
                            x={x + (barWidth - width) / 2}
                            y={chartHeight - height}
                            width={width}
                            height={height}
                            fill={isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}
                        />
                    );
                })}
            </svg>
        );
    };

    return (
        <div className={cn("rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden", className)}>
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedConnector}
                            onChange={(e) => setSelectedConnector(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                        >
                            {connectors.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={selectedPair}
                            onChange={(e) => setSelectedPair(e.target.value.toUpperCase())}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white w-28"
                            placeholder="BTC-USDT"
                        />
                    </div>

                    {latestCandle && (
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">
                                ${latestCandle.close.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </span>
                            <span className={cn(
                                "flex items-center text-sm font-medium",
                                isPositive ? "text-green-500" : "text-red-500"
                            )}>
                                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Interval Selector */}
                    <div className="flex bg-gray-800 rounded-lg p-0.5">
                        {intervalOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setInterval(opt.value)}
                                className={cn(
                                    "px-2 py-1 text-xs rounded transition-colors",
                                    interval === opt.value
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchCandles}
                        disabled={loading}
                        className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div ref={chartRef} className="p-4 relative">
                {loading && candles.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-400">Loading chart...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-48 text-red-400">
                        <span>{error}</span>
                    </div>
                ) : candles.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        <span>No data available</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Price labels */}
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>H: ${maxPrice.toLocaleString()}</span>
                            <span>L: ${minPrice.toLocaleString()}</span>
                        </div>

                        {/* Candlestick chart */}
                        {renderCandlesticks()}

                        {/* Volume bars */}
                        <div className="pt-2 border-t border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">Volume</div>
                            {renderVolumeBars()}
                        </div>
                    </div>
                )}

                {/* Live indicator */}
                {!loading && candles.length > 0 && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-green-500">
                        <Circle className="h-2 w-2 fill-current animate-pulse" />
                        Live
                    </div>
                )}
            </div>

            {/* OHLC Summary */}
            {latestCandle && (
                <div className="px-4 pb-4 grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-xs text-gray-500">Open</div>
                        <div className="text-sm text-white font-medium">
                            ${latestCandle.open.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">High</div>
                        <div className="text-sm text-green-500 font-medium">
                            ${latestCandle.high.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Low</div>
                        <div className="text-sm text-red-500 font-medium">
                            ${latestCandle.low.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Close</div>
                        <div className="text-sm text-white font-medium">
                            ${latestCandle.close.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PriceChart;
