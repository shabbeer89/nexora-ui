'use client';

import React, { useState } from 'react';
import { BacktestConfig } from '@/types/strategy';
import { Play, Calendar } from 'lucide-react';

interface BacktestConfigPanelProps {
    strategyId: string;
    onRunBacktest: (config: BacktestConfig) => void;
    isRunning: boolean;
}

export function BacktestConfigPanel({ strategyId, onRunBacktest, isRunning }: BacktestConfigPanelProps) {
    const [exchange, setExchange] = useState('binance');
    const [pair, setPair] = useState('BTC-USDT');
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2024-02-01');
    const [initialBalance, setInitialBalance] = useState(10000);
    const [includeFees, setIncludeFees] = useState(true);

    const handleRun = () => {
        const config: BacktestConfig = {
            strategyId,
            exchange,
            pair,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            initialBalance,
            includeFees
        };
        onRunBacktest(config);
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Backtest Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Exchange</label>
                    <select
                        value={exchange}
                        onChange={(e) => setExchange(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="binance">Binance</option>
                        <option value="kucoin">KuCoin</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Trading Pair</label>
                    <input
                        type="text"
                        value={pair}
                        onChange={(e) => setPair(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Calendar size={14} /> Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Calendar size={14} /> End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Initial Balance (USDT)</label>
                    <input
                        type="number"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-800">
                    <span className="text-sm font-medium text-gray-300">Include Trading Fees</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeFees}
                            onChange={(e) => setIncludeFees(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <button
                onClick={handleRun}
                disabled={isRunning}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isRunning ? (
                    'Running Backtest...'
                ) : (
                    <>
                        <Play size={20} /> Run Backtest
                    </>
                )}
            </button>
        </div>
    );
}
