'use client';

import React from 'react';
import { Shield, Users, FileText, Building2, Zap, Settings } from 'lucide-react';
import Link from 'next/link';

export default function NexoraAdminPage() {
    const adminModules = [
        { label: 'User Control', icon: Users, href: '/nexora/admin/users', count: '12 Active', color: 'text-blue-400' },
        { label: 'Security Logs', icon: FileText, href: '/nexora/admin/audit-logs', count: '2.4k Items', color: 'text-slate-400' },
        { label: 'Organizations', icon: Building2, href: '/nexora/admin/organizations', count: '1 Enterprise', color: 'text-purple-400' },
        { label: 'Global Setup', icon: Settings, href: '/settings', count: 'Verified', color: 'text-emerald-400' }
    ];

    return (
        <div className="space-y-8">
            {/* Admin Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        Administrative Hub <span className="text-purple-600 font-mono text-sm not-italic ml-2">// CORE CLEARANCE</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-level management of user identities, security protocols, and enterprise structure
                    </p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-purple-600/10 border border-purple-600/20 rounded-xl">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Admin Clearance: Level 1</span>
                </div>
            </div>

            {/* Admin Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {adminModules.map((module, i) => (
                    <Link
                        key={i}
                        href={module.href}
                        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group hover:border-purple-500/30 transition-all hover:scale-[1.02] duration-500"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <module.icon className={cn("w-12 h-12", module.color)} />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Module Registry</div>
                        <div className="text-lg font-black text-white uppercase tracking-tight mb-4">{module.label}</div>
                        <div className="flex items-center justify-between">
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", module.color)}>{module.count}</span>
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                <Shield className="w-3 h-3" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* System Status Panel */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] -mr-64 -mt-64"></div>

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Enterprise Infrastructure Status
                    </h4>
                    <span className="text-[9px] font-mono text-purple-500">REAL-TIME TELEMETRY</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                    {[
                        { label: 'Identity Server', status: 'Healthy', latency: '24ms', load: '1.2%' },
                        { label: 'Security Vault', status: 'Locked', latency: '4ms', load: '0.4%' },
                        { label: 'Audit Stream', status: 'Active', latency: '12ms', load: '2.8%' }
                    ].map((svc, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex items-center justify-between text-[11px] font-black uppercase text-white">
                                <span>{svc.label}</span>
                                <span className="text-emerald-500">{svc.status}</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600 w-[75%] shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>LATENCY: {svc.latency}</span>
                                <span>LOAD: {svc.load}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
