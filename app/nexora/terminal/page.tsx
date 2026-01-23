'use client';

import { Suspense } from 'react';
import StreamingTerminal from '@/components/dashboard/StreamingTerminal';
import { Terminal } from 'lucide-react';

export default function TerminalPage() {
    return (
        <div className="space-y-6 h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-8">
                <div className="flex flex-col h-[500px] lg:h-full">
                    <div className="mb-2 flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nexora Orchestrator</span>
                        <span className="text-[9px] font-mono text-slate-600">logs/orchestrator.log</span>
                    </div>
                    <StreamingTerminal botId="nexora" />
                </div>

                <div className="flex flex-col h-[500px] lg:h-full">
                    <div className="mb-2 flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FreqTrade Engine</span>
                        <span className="text-[9px] font-mono text-slate-600">logs/freqtrade.log</span>
                    </div>
                    <StreamingTerminal botId="freqtrade" />
                </div>
            </div>
        </div>
    );
}
