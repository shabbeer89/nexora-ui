'use client';

import React from 'react';
import TradingCockpit from '@/components/dashboard/TradingCockpit';
import { Target, ShieldCheck, Zap } from 'lucide-react';

export default function NexoraManualTradingPage() {
    return (
        <div className="space-y-8">
            {/* Strategic Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Target className="w-8 h-8 text-blue-500" />
                        Tactical Execution <span className="text-blue-500 font-mono text-sm not-italic ml-2">// MANUAL OVERRIDE</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Direct human-to-market execution interface with automated guardrails
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase leading-none">Safety Protocol</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">ENGAGED</span>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-white/5"></div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                        <Zap className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase leading-none">Bridge Latency</span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">12ms <span className="text-[8px] opacity-40">SRV1</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Execution Center */}
            <div className="relative">
                <TradingCockpit symbol="BTC-USDT" />

                {/* Visual Ambient Decorations */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
        </div>
    );
}
