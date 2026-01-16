
"use client";

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils location

interface ManualRegime {
    current: string;
    confidence: number;
    indicator: string;
    volatility: string;
    recommendation: string;
}

export function MarketRegimeWidget() {
    const [regime, setRegime] = useState<ManualRegime | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegime = async () => {
            try {
                const res = await fetch('/api/market-data/regime');
                const data = await res.json();
                setRegime(data);
            } catch (error) {
                console.error("Failed to fetch market regime", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegime();
    }, []);

    if (loading) return <div className="animate-pulse h-32 bg-slate-800 rounded-lg"></div>;
    if (!regime) return null;

    const getIcon = () => {
        if (regime.current.includes("Bullish")) return <TrendingUp className="w-8 h-8 text-green-500" />;
        if (regime.current.includes("Bearish")) return <TrendingDown className="w-8 h-8 text-red-500" />;
        return <Minus className="w-8 h-8 text-slate-500" />;
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Market Regime
                </h3>
                <span className="text-xs text-slate-500 rounded-full bg-slate-800 px-2 py-1">
                    Conf: {regime.confidence}%
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-950 rounded-full border border-slate-800">
                    {getIcon()}
                </div>
                <div>
                    <div className="text-xl font-bold text-white tracking-tight">
                        {regime.current}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                        Rec: {regime.recommendation}
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Vol: {regime.volatility}</span>
                <span>{regime.indicator}</span>
            </div>
        </div>
    );
}
