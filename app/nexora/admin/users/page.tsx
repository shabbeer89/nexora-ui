'use client';

import React from 'react';
import { Users, Search, Shield, Filter, UserPlus } from 'lucide-react';

export default function NexoraUsersPage() {
    return (
        <div className="space-y-8">
            {/* User Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Identity Matrix <span className="text-indigo-500 font-mono text-sm not-italic ml-2">// USER REGISTRY</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Comprehensive management of personnel clearance, access privileges, and neural terminal assignments
                    </p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                    <UserPlus className="w-4 h-4" />
                    Authorize New Identity
                </button>
            </div>

            {/* Matrix Search */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Scan Identities by Hash, Name, or Role..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest"
                    />
                </div>
                <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Matrix Table */}
            <div className="bg-[#0b1120]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Personnel Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clearance Level</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Matrix Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {[
                                { name: 'Admin Terminal', email: 'admin@nexora.ai', role: 'SUPER_ADMIN', status: 'Active' },
                                { name: 'Sector Trader A', email: 'trader@nexora.ai', role: 'TRADER', status: 'Active' },
                                { name: 'Neural Analyst', email: 'analyst@nexora.ai', role: 'ANALYST', status: 'Standby' }
                            ].map((user, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white uppercase tracking-tight">{user.name}</div>
                                                <div className="text-[10px] font-mono text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Active' ? "bg-emerald-500 animate-pulse" : "bg-slate-700")}></div>
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", user.status === 'Active' ? "text-emerald-500" : "text-slate-600")}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                            <Shield className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
