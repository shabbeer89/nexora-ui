'use client';

import React from 'react';
import { Layers, History, Play, Filter } from 'lucide-react';

export default function NexoraBacktestingPage() {
    return (
        <div className="space-y-8">
            {/* Simulation Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Layers className="w-8 h-8 text-amber-500" />
                        Historical Simulation <span className="text-amber-500 font-mono text-sm not-italic ml-2">// ALPHA VALIDATION</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-precision historical replay and strategy optimization engine
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all font-black uppercase tracking-widest text-[10px]">
                        <Play className="w-3 h-3 fill-amber-500" />
                        Start Simulation
                    </button>
                </div>
            </div>

            {/* Backtesting Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analysis Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[500px] border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group">
                        <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:border-amber-500/30 transition-all duration-700">
                            <Layers className="h-10 w-10 text-slate-700 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">No Simulation Active</h3>
                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                            Select a strategy and time interval in the parameters panel to initiate alpha validation.
                        </p>
                    </div>
                </div>

                {/* Parameters Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Parameters
                            </h4>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Strategy Engine</label>
                                <select className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all">
                                    <option>FreqAI_Neural_v2</option>
                                    <option>MACD_Cross_Alpha</option>
                                    <option>RSI_Mean_Reversion</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Historical Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-2.5 rounded-xl bg-white/5 text-[9px] font-black text-slate-400 border border-transparent hover:border-white/10 transition-all uppercase tracking-widest">Last 30 Days</button>
                                    <button className="py-2.5 rounded-xl bg-white/5 text-[9px] font-black text-slate-400 border border-transparent hover:border-white/10 transition-all uppercase tracking-widest">Last 90 Days</button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <History className="w-4 h-4 text-amber-500" />
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Validation Status</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                Strategy bridge ready. Standing by for simulation signal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
