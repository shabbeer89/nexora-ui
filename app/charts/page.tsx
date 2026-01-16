'use client';

import React from 'react';
import { LineChart, Activity, TrendingUp } from 'lucide-react';
import PriceChart from '@/components/trading/PriceChart';
import OrderBook from '@/components/trading/OrderBook';

export default function ChartsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <LineChart className="h-6 w-6 text-blue-500" />
                    Live Price Charts
                </h1>
            </div>

            <p className="text-gray-400">
                Real-time candlestick charts powered by Hummingbot market data feeds.
                Select different exchanges and trading pairs to monitor live price action.
            </p>

            {/* Main Chart with Order Book */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <PriceChart
                        connector="binance"
                        tradingPair="BTC-USDT"
                        interval="5m"
                    />
                </div>
                <div className="lg:col-span-1">
                    <OrderBook
                        connector="binance"
                        tradingPair="BTC-USDT"
                        depth={15}
                    />
                </div>
            </div>

            {/* Secondary Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PriceChart
                    connector="binance"
                    tradingPair="ETH-USDT"
                    interval="5m"
                />
                <PriceChart
                    connector="binance"
                    tradingPair="SOL-USDT"
                    interval="5m"
                />
            </div>

            {/* Feature Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium text-white">Real-Time Data</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Charts update every 30 seconds with live market data from connected exchanges.
                    </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <LineChart className="h-5 w-5 text-green-500" />
                        <h3 className="font-medium text-white">Multiple Timeframes</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Switch between 1m, 5m, 15m, 1H, 4H, and 1D timeframes for different perspectives.
                    </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium text-white">OHLCV Data</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        View Open, High, Low, Close prices and Volume for each candle period.
                    </p>
                </div>
            </div>
        </div>
    );
}
