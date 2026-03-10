'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, Award, BarChart3 } from 'lucide-react';

interface HyperoptResult {
    strategy: string;
    best_params: Record<string, any>;
    best_result: {
        total_trades: number;
        win_rate: number;
        profit_total: number;
        sharpe_ratio: number;
        max_drawdown: number;
    };
    epochs: number;
    timestamp: string;
}

export default function HyperoptDashboard() {
    const [results, setResults] = useState<HyperoptResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await fetch('/api/hyperopt/results');
            const data = await response.json();
            setResults(data.results || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch hyperopt results:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-64 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                        <Target className="w-6 h-6 text-cyan-400" />
                        Hyperopt Results
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Parameter Optimization History
                    </p>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎯</div>
                    <div className="text-xl font-bold text-slate-400">No Optimization Results</div>
                    <div className="text-sm text-slate-500 mt-2">Run hyperopt to optimize strategy parameters</div>
                </div>
            ) : (
                <div className="space-y-6">
                    {results.map((result, idx) => (
                        <div key={idx} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="text-lg font-black text-white">{result.strategy}</div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        {result.epochs} epochs • {new Date(result.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                    <Award className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-400 uppercase">Best Result</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                <div className="bg-slate-700/30 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Total Trades</div>
                                    <div className="text-xl font-black text-white">{result.best_result.total_trades}</div>
                                </div>
                                <div className="bg-slate-700/30 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                                    <div className="text-xl font-black text-emerald-400">{(result.best_result.win_rate * 100).toFixed(1)}%</div>
                                </div>
                                <div className="bg-slate-700/30 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Total Profit</div>
                                    <div className="text-xl font-black text-cyan-400">${result.best_result.profit_total.toFixed(2)}</div>
                                </div>
                                <div className="bg-slate-700/30 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Sharpe Ratio</div>
                                    <div className="text-xl font-black text-blue-400">{result.best_result.sharpe_ratio.toFixed(2)}</div>
                                </div>
                                <div className="bg-slate-700/30 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">Max DD</div>
                                    <div className="text-xl font-black text-red-400">-{(result.best_result.max_drawdown * 100).toFixed(1)}%</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Best Parameters</div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(result.best_params).map(([key, value]) => (
                                        <div key={key} className="bg-slate-700/20 rounded-lg p-3">
                                            <div className="text-xs text-slate-400 mb-1">{key}</div>
                                            <div className="text-sm font-mono text-cyan-400">{JSON.stringify(value)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
