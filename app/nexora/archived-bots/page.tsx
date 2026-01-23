'use client';

import React from 'react';
import { Archive, Search, History, Trash2, RotateCcw } from 'lucide-react';

export default function NexoraArchivedBotsPage() {
    return (
        <div className="space-y-8">
            {/* Archive Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Archive className="w-8 h-8 text-slate-500" />
                        Operational Archives <span className="text-slate-500 font-mono text-sm not-italic ml-2">// DECOMMISSIONED LOGS</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Historical repository for decommissioned strategies and terminal bot records
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Scan Archives..."
                        className="w-80 bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 outline-none focus:border-slate-500/50 transition-all uppercase tracking-widest"
                    />
                </div>
            </div>

            {/* Archive List */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl min-h-[500px] flex flex-col group/container">
                <div className="flex items-center justify-between mb-8 opacity-40">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Decommissioned Asset Log
                    </h4>
                    <span className="text-[9px] font-mono text-slate-600">ENCRYPTION: VERIFIED</span>
                </div>

                {/* Empty State / List */}
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 group">
                    <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:border-slate-500/30 transition-all duration-700">
                        <Archive className="h-10 w-10 text-slate-800 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">No Archived Records</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                        Operational history is currently purged. Decommissioned bot logs will satisfy this terminal when available.
                    </p>
                </div>

                {/* Tactical Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-end gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">
                        <RotateCcw className="w-3 h-3" />
                        Restore All
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-[9px] font-black text-rose-500/60 hover:text-rose-500 uppercase tracking-widest transition-all">
                        <Trash2 className="w-3 h-3" />
                        Purge Vault
                    </button>
                </div>
            </div>
        </div>
    );
}
