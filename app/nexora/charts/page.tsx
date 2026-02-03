'use client';

import React from 'react';
import PriceChart from '@/components/trading/PriceChart';
import { BarChart3, Maximize2, RefreshCcw } from 'lucide-react';

export default function NexoraChartsPage() {
    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-200px)]">
            {/* Tactical Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-cyan-500" />
                        Live Intelligence <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// VISUAL OVERLAY</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-fidelity market telemetry and pattern recognition
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all group">
                        <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Resync Stream</span>
                    </button>
                    <button className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/20 transition-all">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Stage: Enterprise Charting */}
            <div className="flex-1 min-h-0 rounded-[2.5rem] border border-white/5 bg-slate-950/40 backdrop-blur-xl overflow-hidden relative group/container shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

                <div className="w-full h-full p-4">
                    <PriceChart tradingPair="BTC-USDT" />
                </div>

                {/* Status Overlay */}
                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Stream Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
