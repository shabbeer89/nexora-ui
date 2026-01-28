'use client';

import React, { useState } from 'react';
import { Play, Calendar, TrendingUp } from 'lucide-react';

interface BacktestFormProps {
    onSubmit: (config: BacktestConfig) => void;
    isRunning: boolean;
}

interface BacktestConfig {
    strategy: string;
    timerange: string;
    timeframe: string;
    pairs: string[];
    stake_amount: number;
    initial_balance: number;
}

export function BacktestForm({ onSubmit, isRunning }: BacktestFormProps) {
    const [strategy, setStrategy] = useState('SimpleTrendFollowing');
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2024-12-31');
    const [timeframe, setTimeframe] = useState('1d');
    const [pair, setPair] = useState('BTC/USDT');
    const [stakeAmount, setStakeAmount] = useState(100);
    const [initialBalance, setInitialBalance] = useState(1000);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const timerange = `${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}`;

        onSubmit({
            strategy,
            timerange,
            timeframe,
            pairs: [pair],
            stake_amount: stakeAmount,
            initial_balance: initialBalance
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Strategy Engine
                    </label>
                    <select
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                        disabled={isRunning}
                    >
                        <option value="SimpleTrendFollowing">SimpleTrendFollowing</option>
                        <option value="TrendFollowingV1">TrendFollowingV1</option>
                        <option value="TrendFollowingV2">TrendFollowingV2</option>
                        <option value="MeanReversionV1">MeanReversionV1</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Trading Pair
                    </label>
                    <input
                        type="text"
                        value={pair}
                        onChange={(e) => setPair(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                        disabled={isRunning}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                        disabled={isRunning}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                        disabled={isRunning}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Timeframe
                    </label>
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                        disabled={isRunning}
                    >
                        <option value="1m">1 Minute</option>
                        <option value="5m">5 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="1h">1 Hour</option>
                        <option value="4h">4 Hours</option>
                        <option value="1d">1 Day</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Initial Balance (USDT)
                    </label>
                    <input
                        type="number"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                        disabled={isRunning}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all font-black uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isRunning ? (
                    <>
                        <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        Running Simulation...
                    </>
                ) : (
                    <>
                        <Play className="w-3 h-3 fill-amber-500" />
                        Start Simulation
                    </>
                )}
            </button>
        </form>
    );
}
