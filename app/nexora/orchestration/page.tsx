'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import FleetOrchestration from '@/components/nexora/FleetOrchestration';
import { LayoutGrid, Globe, Activity, Terminal } from 'lucide-react';

export default function NexoraOrchestrationPage() {
    const router = useRouter();

    return (
        <div className="space-y-8">
            {/* Management Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <LayoutGrid className="w-8 h-8 text-cyan-500" />
                        Fleet Control <span className="text-cyan-500 font-mono text-sm not-italic ml-2">// GLOBAL REGISTRY</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        High-level synthesis and life-cycle management of all active algorithmic assets
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Control Interface */}
            <div className="relative min-h-[600px] border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden group/container">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>

                <FleetOrchestration
                    onSelectBot={(id: string) => router.push(`/nexora/engines/${id}`)}
                    onCreateNew={() => router.push('/nexora/engines/new')}
                />

                {/* Footer Telemetry */}
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            <span>Global Distribution: ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            <span>Telemetry Stream: NOMINAL</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-500/80">
                        <Terminal className="w-3 h-3" />
                        <span className="font-mono tracking-widest">Protocol v4.2.1-SECURE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
