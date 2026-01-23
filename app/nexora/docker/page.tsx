'use client';

import React from 'react';
import { Container, Activity, Cpu, HardDrive, RefreshCw } from 'lucide-react';

export default function NexoraDockerPage() {
    return (
        <div className="space-y-8">
            {/* System Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Container className="w-8 h-8 text-cyan-500" />
                        Infrastructure Logic <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// CONTAINER MATRIX</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Resource-level management of algorithmic environment variables and container clusters
                    </p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-slate-300 hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest group">
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                    Reset Daemon
                </button>
            </div>

            {/* Health Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'CPU Utilization', value: '14.2%', icon: Cpu, color: 'text-cyan-400' },
                    { label: 'Memory Pressure', value: '4.8 GB', icon: Activity, color: 'text-purple-400' },
                    { label: 'Disk IOPS', value: '1,024/s', icon: HardDrive, color: 'text-blue-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <stat.icon className={cn("w-10 h-10", stat.color)} />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="mt-4 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className={cn("h-full w-[40%] shadow-lg", stat.color.replace('text-', 'bg-'))}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cluster View */}
            <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Container className="w-4 h-4" />
                        Active Container Cluster
                    </h4>
                    <span className="text-[9px] font-mono text-cyan-500">DOCKER ENGINE: READY</span>
                </div>

                <div className="space-y-4">
                    {[
                        { name: 'nexora-orchestrator', status: 'Running', image: 'nexora:v4.2.1', cpu: '2.4%', mem: '512MB' },
                        { name: 'hummingbot-daemon', status: 'Running', image: 'hummingbot:latest', cpu: '5.1%', mem: '1.2GB' },
                        { name: 'freqtrade-worker-1', status: 'Running', image: 'freqtrade:custom', cpu: '4.2%', mem: '890MB' }
                    ].map((container, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                    <Container className="w-6 h-6 text-cyan-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white hover:text-cyan-400 transition-colors cursor-pointer">{container.name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{container.image}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="hidden md:block">
                                    <div className="text-[10px] font-black text-slate-500 uppercase">Resource Load</div>
                                    <div className="text-xs font-mono text-white mt-1">{container.cpu} CPU / {container.mem} MEM</div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{container.status}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-600">UPTIME: 14D 02H</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { cn } from '@/lib/utils';
