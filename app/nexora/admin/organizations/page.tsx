'use client';

import React from 'react';
import { Building2, Plus, Globe, ShieldCheck, Search } from 'lucide-react';

export default function NexoraOrganizationsPage() {
    return (
        <div className="space-y-8">
            {/* Org Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-500" />
                        Enterprise Matrix <span className="text-blue-500 font-mono text-sm not-italic ml-2">// ORG REGISTRY</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-level configuration of corporate structures, neural sub-networks, and organizational clearance
                    </p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <Plus className="w-4 h-4" />
                    Register Unit
                </button>
            </div>

            {/* Org Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Identity */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                    <div className="mb-10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Primary Unit</div>
                        <h3 className="text-4xl font-black text-white hover:text-blue-400 transition-colors cursor-pointer">Nexora AI Global</h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest">ID: NEX-GBL-ENT-001</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <div className="text-[10px] font-black text-slate-600 uppercase mb-2 leading-none">Global Nodes</div>
                            <div className="text-xl font-black text-white">1,242 <span className="text-[9px] text-emerald-500 ml-1">ONLINE</span></div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-600 uppercase mb-2 leading-none">Personnel</div>
                            <div className="text-xl font-black text-white">42 Authorized</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-500 uppercase tracking-widest">Enterprise Clearance</span>
                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified Hub</span>
                    </div>
                </div>

                {/* Strategic Status */}
                <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="w-5 h-5 text-cyan-500" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Network Distribution</h4>
                        </div>
                        <div className="space-y-6">
                            {[
                                { zone: 'North America (slc-eth-1)', status: 'Active', load: '45%' },
                                { zone: 'Europe Central (fra-eth-2)', status: 'Active', load: '28%' }
                            ].map((zone, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                        <span>{zone.zone}</span>
                                        <span className="text-emerald-500">{zone.status}</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 w-[45%] opacity-60"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex items-center gap-4">
                        <ShieldCheck className="w-10 h-10 text-emerald-500/40" />
                        <div>
                            <h5 className="text-[11px] font-black text-white uppercase tracking-tight">Org Integrity Protocol</h5>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-signature authorization required for unit modification</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
