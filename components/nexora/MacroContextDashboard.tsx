'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Zap } from 'lucide-react';

interface MacroData {
    spx: { price: number; change: number; change_percent: number };
    vix: { price: number; change: number };
    dxy: { price: number; change: number };
    gold: { price: number; change: number };
    correlations: {
        SPX: number;
        DXY: number;
        GOLD: number;
        VIX: number;
    };
    risk_sentiment: string;
    timestamp: string;
}

export default function MacroContextDashboard() {
    const [macroData, setMacroData] = useState<MacroData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMacroData();
        const interval = setInterval(fetchMacroData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const fetchMacroData = async () => {
        try {
            const response = await fetch('/api/macro/context');
            if (!response.ok) {
                if (response.status === 403) {
                    console.warn('Macro data access forbidden - likely needs auth');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setMacroData(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch macro data:', error);
            // Set mock state on failure to keep UI alive
            setMacroData({
                spx: { price: 4780, change: 0, change_percent: 0 },
                vix: { price: 14, change: 0 },
                dxy: { price: 102, change: 0 },
                gold: { price: 2050, change: 0 },
                correlations: { SPX: 0.5, DXY: -0.5, GOLD: 0, VIX: -0.5 },
                risk_sentiment: 'neutral',
                timestamp: new Date().toISOString()
            });
            setLoading(false);
        }
    };

    const getCorrelationColor = (corr: number) => {
        if (corr > 0.5) return 'text-emerald-400';
        if (corr > 0) return 'text-cyan-400';
        if (corr > -0.5) return 'text-orange-400';
        return 'text-red-400';
    };

    const getRiskSentimentColor = (sentiment: string) => {
        if (sentiment === 'risk_on') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (sentiment === 'risk_off') return 'bg-red-500/20 text-red-400 border-red-500/30';
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    };

    if (loading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-slate-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!macroData) return null;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1">
                        🌍 Macro Context
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Global Market Intelligence
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full border ${getRiskSentimentColor(macroData.risk_sentiment || 'neutral')}`}>
                    <span className="text-xs font-black uppercase tracking-wider">
                        {(macroData.risk_sentiment || 'neutral').replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Market Indicators Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* SPX */}
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase">SPX</span>
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white mb-1">
                        ${macroData.spx.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-bold ${macroData.spx.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroData.spx.change >= 0 ? '+' : ''}{macroData.spx.change_percent.toFixed(2)}%
                    </div>
                </div>

                {/* VIX */}
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-400 uppercase">VIX</span>
                        <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-white mb-1">
                        {macroData.vix.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-bold ${macroData.vix.change >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {macroData.vix.change >= 0 ? '+' : ''}{macroData.vix.change.toFixed(2)}
                    </div>
                </div>

                {/* DXY */}
                <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-green-400 uppercase">DXY</span>
                        <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-black text-white mb-1">
                        {macroData.dxy.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-bold ${macroData.dxy.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroData.dxy.change >= 0 ? '+' : ''}{macroData.dxy.change.toFixed(2)}
                    </div>
                </div>

                {/* Gold */}
                <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-yellow-400 uppercase">Gold</span>
                        <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-black text-white mb-1">
                        ${macroData.gold.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-bold ${macroData.gold.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {macroData.gold.change >= 0 ? '+' : ''}{macroData.gold.change.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* BTC Correlations */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                    BTC Correlations (30d)
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(macroData.correlations || {}).map(([asset, corr]) => (
                        <div key={asset} className="text-center">
                            <div className="text-xs text-slate-400 mb-1">{asset}</div>
                            <div className={`text-2xl font-black ${getCorrelationColor(corr as number)}`}>
                                {(corr as number) >= 0 ? '+' : ''}{(corr as number).toFixed(2)}
                            </div>
                            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${(corr as number) >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.abs(corr as number) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Last Update */}
            <div className="mt-4 text-center text-xs text-slate-500 font-mono">
                Last updated: {new Date(macroData.timestamp).toLocaleTimeString()}
            </div>
        </div>
    );
}
