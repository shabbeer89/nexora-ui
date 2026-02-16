'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, AlertTriangle } from 'lucide-react';

interface DrawdownData {
    current_drawdown: number;
    max_drawdown: number;
    peak_equity: number;
    current_equity: number;
    in_drawdown: boolean;
    drawdown_duration_hours: number;
    timestamp: string;
}

export default function DrawdownTracker() {
    const [data, setData] = useState<DrawdownData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:8888/api/analytics/drawdown');
            const result = await response.json();
            setData(result);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch drawdown data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !data) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-64 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    const drawdownPct = (data?.current_drawdown || 0) * 100;
    const maxDrawdownPct = (data?.max_drawdown || 0) * 100;
    const isWarning = drawdownPct > 10;
    const isCritical = drawdownPct > 20;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                        <TrendingDown className="w-6 h-6 text-red-400" />
                        Drawdown Tracker
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Real-Time Risk Monitoring
                    </p>
                </div>
                {data.in_drawdown && (
                    <div className={`px-4 py-2 rounded-full border ${isCritical ? 'bg-red-500/20 border-red-500/30' : 'bg-yellow-500/20 border-yellow-500/30'}`}>
                        <span className={`text-xs font-black uppercase ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}>
                            {isCritical ? 'CRITICAL' : 'WARNING'}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Current Drawdown</div>
                        {data.in_drawdown && <AlertTriangle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="text-5xl font-black text-red-400 mb-2">
                        -{drawdownPct.toFixed(2)}%
                    </div>
                    <div className="text-sm text-slate-400">
                        From peak: ${data?.peak_equity?.toFixed(2) || '0.00'}
                    </div>
                    {data.in_drawdown && (
                        <div className="mt-4 text-xs text-yellow-400">
                            Duration: {data?.drawdown_duration_hours?.toFixed(1) || '0.0'} hours
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-6">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Max Drawdown</div>
                    <div className="text-5xl font-black text-orange-400 mb-2">
                        -{maxDrawdownPct.toFixed(2)}%
                    </div>
                    <div className="text-sm text-slate-400">
                        Historical worst case
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Peak Equity</div>
                    <div className="text-2xl font-black text-emerald-400">${data?.peak_equity?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Current Equity</div>
                    <div className="text-2xl font-black text-white">${data?.current_equity?.toFixed(2) || '0.00'}</div>
                </div>
            </div>

            {isCritical && (
                <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-bold text-red-400 mb-1">CRITICAL DRAWDOWN</div>
                            <div className="text-xs text-slate-300">
                                Consider reducing position sizes or pausing trading until recovery.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
