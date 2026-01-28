'use client';

import { Suspense } from 'react';
import StreamingTerminal from '@/components/dashboard/StreamingTerminal';
import { Terminal } from 'lucide-react';

export default function TerminalPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Terminal className="w-8 h-8 text-blue-500" />
                        System Terminal
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1 uppercase tracking-widest">
                        Real-time log aggregation and command execution
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Stream Active</span>
                </div>
            </div>



            <div className="space-y-6">
                {/* Trading Strategies Section */}
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Trading Strategies</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="simple-trend" />

                        <StreamingTerminal botId="freqai" />
                    </div>
                </div>

                {/* Hummingbot Services Section */}
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Hummingbot Services</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="hbot" />
                        <StreamingTerminal botId="dca-hbot" />
                    </div>
                </div>

                {/* Core APIs Section */}
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Core APIs & Services</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="api" />
                        <StreamingTerminal botId="orchestrator" />
                        <StreamingTerminal botId="gateway" />
                    </div>
                </div>

                {/* Infrastructure Section */}
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Infrastructure</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="postgres" />
                        <StreamingTerminal botId="mqtt" />
                        <StreamingTerminal botId="ws" />
                        <StreamingTerminal botId="brain" />
                    </div>
                </div>
            </div>
        </div>
    );
}
