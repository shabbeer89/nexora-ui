'use client';

import React from 'react';
import { Activity, TrendingUp, Zap, BarChart3, Clock, RefreshCw } from 'lucide-react';

export default function NexoraPerformancePage() {
    return (
        <div className="space-y-8">
            {/* Performance Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Activity className="w-8 h-8 text-emerald-500" />
                        Alpha Performance <span className="text-emerald-500 font-mono text-sm not-italic ml-2">// REAL-TIME ANALYTICS</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-resolution performance tracking and alpha decay monitoring for active strategies
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5">
                        <Zap className="w-4 h-4 text-cyan-500" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Global ROI</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">+14.2% <span className="text-emerald-500 font-mono">24H</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Sharpe Ratio', value: '3.42', trend: '+0.12', color: 'text-blue-400' },
                    { label: 'Sortino Ratio', value: '4.12', trend: '+0.05', color: 'text-purple-400' },
                    { label: 'Max Drawdown', value: '2.1%', trend: '-0.3%', color: 'text-rose-400' },
                    { label: 'Profit Factor', value: '2.85', trend: '+0.15', color: 'text-emerald-400' }
                ].map((metric, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group hover:border-white/20 transition-all">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{metric.label}</div>
                        <div className="text-2xl font-black text-white">{metric.value}</div>
                        <div className={cn("mt-4 text-[9px] font-black uppercase tracking-widest", metric.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500')}>
                            {metric.trend} <span className="text-slate-600">Period Drift</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Analytics Integration */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group/container">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>

                <div className="flex items-center justify-between mb-8 opacity-40">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Equity Curve Telemetry
                    </h4>
                    <span className="text-[9px] font-mono text-emerald-500">SAMPLING: 1SEC</span>
                </div>

                {/* Analysis UI */}
                <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-center group">
                    <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:border-emerald-500/30 transition-all duration-700">
                        <TrendingUp className="h-10 w-10 text-slate-700 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">Generating Synthetic Performance Map...</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                        Synthesizing operational data across 14 frequency nodes. Real-time alpha visualization will satisfy this terminal when stream is normalized.
                    </p>
                </div>

                {/* Footer Telemetry */}
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-cyan-500" />
                            <span>Interval: 1m 5m 15m 1h</span>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-cyan-500/80 hover:text-cyan-400 transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        <span className="font-mono tracking-widest uppercase">Force Analytical Re-sweep</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
