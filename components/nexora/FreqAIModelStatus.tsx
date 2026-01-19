'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, Activity, AlertCircle } from 'lucide-react';

interface FreqAIStatus {
    enabled: boolean;
    identifier: string;
    model_loaded: boolean;
    last_training: string;
    regime_prediction: {
        regime: string;
        confidence: number;
        sub_regime: string;
        direction_forecast: number;
    };
    feature_importance: Array<{ feature: string; importance: number }>;
    performance: {
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
    };
}

export default function FreqAIModelStatus() {
    const [status, setStatus] = useState<FreqAIStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch('http://localhost:8888/api/freqai/status');
            const data = await response.json();
            setStatus(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch FreqAI status:', error);
            setLoading(false);
        }
    };

    const getRegimeColor = (regime: string) => {
        const colors: Record<string, string> = {
            trend_up: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
            trend_down: 'text-red-400 bg-red-500/20 border-red-500/30',
            range: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
            breakout: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
            high_vol: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
        };
        return colors[regime] || 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    };

    if (loading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-32 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (!status || !status.enabled) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-4 text-yellow-400">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">FreqAI Not Enabled</h3>
                        <p className="text-sm text-slate-400">Enable FreqAI in FreqTrade configuration</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-cyan-400" />
                        FreqAI Model Status
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Machine Learning Regime Detection
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-400 uppercase">Model Active</span>
                </div>
            </div>

            {/* Current Prediction */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Current Prediction
                    </h3>
                    <div className="text-xs text-slate-400 font-mono">
                        Confidence: {(status.regime_prediction.confidence * 100).toFixed(1)}%
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-slate-400 mb-2">Regime</div>
                        <div className={`inline-flex px-4 py-2 rounded-full border text-sm font-black uppercase ${getRegimeColor(status.regime_prediction.regime)}`}>
                            {status.regime_prediction.regime.replace('_', ' ')}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 mb-2">Direction Forecast</div>
                        <div className="flex items-center gap-2">
                            {status.regime_prediction.direction_forecast > 0 ? (
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            ) : (
                                <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />
                            )}
                            <span className={`text-lg font-black ${status.regime_prediction.direction_forecast > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {status.regime_prediction.direction_forecast > 0 ? 'Bullish' : 'Bearish'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-4">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                            style={{ width: `${status.regime_prediction.confidence * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Model Performance */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Accuracy</div>
                    <div className="text-2xl font-black text-emerald-400">
                        {(status.performance.accuracy * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Precision</div>
                    <div className="text-2xl font-black text-cyan-400">
                        {(status.performance.precision * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Recall</div>
                    <div className="text-2xl font-black text-blue-400">
                        {(status.performance.recall * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">F1 Score</div>
                    <div className="text-2xl font-black text-purple-400">
                        {(status.performance.f1_score * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Top Features
                </h3>
                <div className="space-y-3">
                    {status.feature_importance.slice(0, 8).map((feature, index) => (
                        <div key={feature.feature} className="flex items-center gap-3">
                            <div className="text-xs text-slate-500 w-4">#{index + 1}</div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-300 font-mono">{feature.feature}</span>
                                    <span className="text-xs text-cyan-400 font-bold">
                                        {(feature.importance * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                                        style={{ width: `${feature.importance * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Model Info */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <div className="font-mono">Model: {status.identifier}</div>
                <div className="font-mono">Last Training: {new Date(status.last_training).toLocaleDateString()}</div>
            </div>
        </div>
    );
}
