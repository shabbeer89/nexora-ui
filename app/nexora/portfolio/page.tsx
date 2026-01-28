'use client';

import React from 'react';
import UnifiedPortfolio from '@/components/nexora/UnifiedPortfolio';
import { Wallet, PieChart, Filter } from 'lucide-react';

export default function NexoraPortfolioGlobalPage() {
    return (
        <div className="space-y-8">
            {/* Asset Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-emerald-500" />
                        Global Assets <span className="text-emerald-500 font-mono text-sm not-italic ml-2">// TOTAL PORTFOLIO</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Consolidated multi-chain asset aggregation and historical allocation analysis
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                        <Filter className="w-3 h-3" />
                        Filter Cluster
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-widest">
                        <PieChart className="w-3 h-3" />
                        Allocation Map
                    </button>
                </div>
            </div>

            {/* Portfolio Integration */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group/container">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

                <UnifiedPortfolio />

                {/* Visual Guard */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            </div>
        </div>
    );
}
