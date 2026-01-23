'use client';

import React from 'react';
import { Percent, Activity, Globe, RefreshCcw } from 'lucide-react';

export default function NexoraFundingPage() {
    return (
        <div className="space-y-8">
            {/* Funding Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Percent className="w-8 h-8 text-purple-500" />
                        Funding Rates <span className="text-purple-500 font-mono text-sm not-italic ml-2">// YIELD MONITOR</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Real-time tracking of perpetual funding costs across global decentralized exchanges
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
                        <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-700" />
                        Force Sync
                    </button>
                </div>
            </div>

            {/* Monitoring Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { exchange: 'Jupiter', rate: '0.000102%', status: 'Stable', trend: 'down' },
                    { exchange: 'Hyperliquid', rate: '0.000451%', status: 'Volatile', trend: 'up' },
                    { exchange: 'dYdX', rate: '0.000210%', status: 'Nominal', trend: 'neutral' }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Percent className="w-10 h-10 text-purple-400" />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.exchange}</div>
                        <div className="text-2xl font-black text-white">{item.rate}</div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">{item.status}</span>
                            <Activity className="w-4 h-4 text-slate-700" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Yield Map (Placeholder for complex visualization) */}
            <div className="h-[400px] border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group">
                <Globe className="h-12 w-12 text-slate-700 group-hover:text-purple-500 transition-colors mb-4" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">Multi-Chain Funding Map</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                    Sourcing real-time funding yield data from 20+ perpetual protocols.
                </p>
            </div>
        </div>
    );
}
