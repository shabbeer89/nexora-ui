'use client';

import React from 'react';
import TradeManagerUI from '@/components/nexora/TradeManagerUI';
import { TrendingUp, ShieldCheck, DollarSign } from 'lucide-react';

export default function NexoraCapitalPage() {
    return (
        <div className="space-y-8">
            {/* Capital Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                        Capital Manager <span className="text-blue-500 font-mono text-sm not-italic ml-2">// EQUITY OPTIMIZATION</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Dynamic allocation of trading equity and risk-adjusted capital distribution
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Net Equity</span>
                            <span className="text-[12px] font-black text-white uppercase tracking-tighter">$142,502.82</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trade Manager Interface */}
            <div className="relative border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden group/container">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                <TradeManagerUI />

                {/* Secure Guard */}
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Capital Protection Protocols Active</span>
                </div>
            </div>
        </div>
    );
}
