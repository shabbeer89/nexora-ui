'use client';

import React from 'react';
import { FileText, Search, ShieldAlert, Clock, Terminal } from 'lucide-react';

export default function NexoraAuditLogsPage() {
    return (
        <div className="space-y-8">
            {/* Log Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <FileText className="w-8 h-8 text-slate-400" />
                        Security Audit <span className="text-slate-400 font-mono text-sm not-italic ml-2">// TELEMETRY TRAIL</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-resolution audit logs monitoring all operational inputs, security events, and terminal access
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Integrity Status</span>
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">VERIFIED</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit List */}
            <div className="bg-[#0b1120]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative group/container">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-500/20 to-transparent"></div>

                <div className="flex items-center justify-between mb-8 opacity-40">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Real-Time Operation Log
                    </h4>
                    <span className="text-[9px] font-mono text-slate-600">SYSLOG CONSOLE: NOMINAL</span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {[
                        { time: '14:32:01', event: 'Identity Authorized', details: 'User admin@nexora.ai clearance verified (Level 1)', source: 'AuthBridge', level: 'INFO' },
                        { time: '14:30:45', event: 'Vault Access', details: 'Private key retrieved for Solana/Jupiter bridge', source: 'SecurityVault', level: 'SECURE' },
                        { time: '14:28:12', event: 'Manual Override', details: 'Tactical BUY signal executed on BTC-USDT', source: 'TacticalPanel', level: 'OP' },
                        { time: '14:25:00', event: 'System Sync', details: 'Node cluster resynchronized across 3 zones', source: 'Orchestrator', level: 'INFO' }
                    ].map((log, i) => (
                        <div key={i} className="flex items-center gap-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all group overflow-hidden relative">
                            <div className="w-20 font-mono text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors uppercase">{log.time}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-[11px] font-black text-white hover:text-cyan-400 transition-colors cursor-pointer uppercase tracking-tight">{log.event}</h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border",
                                        log.level === 'SECURE' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                            log.level === 'OP' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    )}>
                                        {log.level}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                    {log.details}
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <Terminal className="w-3 h-3 text-slate-700" />
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">{log.source}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ambient Glow */}
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
