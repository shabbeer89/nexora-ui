'use client';

import React from 'react';
import { ScrollText, Play, FileCode, Upload, Search, Filter } from 'lucide-react';

export default function NexoraScriptsPage() {
    return (
        <div className="space-y-8">
            {/* Script Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <ScrollText className="w-8 h-8 text-cyan-500" />
                        Neural Scripts <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// LOGIC EXTENSIONS</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Deployment and orchestration of custom Python and neural network logic extensions
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Upload className="w-4 h-4" />
                        Upload Script
                    </button>
                </div>
            </div>

            {/* Script Search & Catalog */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Catalog Filter */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    Library Filters
                                </h4>
                            </div>
                            <div className="space-y-2">
                                {['FreqAI Models', 'Custom Indicators', 'Risk Oracles', 'Utility Wrappers'].map(cat => (
                                    <button key={cat} className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-transparent hover:border-cyan-500/30 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Script Grid */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col group/container">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 group">
                            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:border-cyan-500/30 transition-all duration-700">
                                <FileCode className="h-10 w-10 text-slate-800 group-hover:text-cyan-500 transition-colors" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">Neural Library Empty</h3>
                            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                                No operational scripts detected in the local registry. Deploy custom logic to expand terminal capabilities.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
