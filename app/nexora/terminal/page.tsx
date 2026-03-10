'use client';

import { Suspense } from 'react';
import StreamingTerminal from '@/components/dashboard/StreamingTerminal';
import { Terminal, Shield, Cpu, Activity, Database, Network } from 'lucide-react';

export default function TerminalPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Terminal className="w-8 h-8 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        System Terminal
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1 uppercase tracking-[0.2em]">
                        Unified Control Plane • Real-time Log Stream
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Stream Active</span>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {/* Nexora Core Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Nexora Core Control</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="nexora-api" className="h-[400px]" />
                        <StreamingTerminal botId="nexora-orchestrator" className="h-[400px]" />
                        <StreamingTerminal
                            botId="nexora-brain"
                            className="h-[400px]"
                        />
                    </div>
                </div>

                {/* Trading Intelligence Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Trading Intelligence (Freqtrade)</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Main Freqtrade Service Logs */}
                        <StreamingTerminal botId="freqtrade" className="h-[400px]" />

                        {/* FreqAI Specific */}
                        <StreamingTerminal
                            botId="freqai"
                            className="h-[400px]"
                        />

                        {/* Primary Strategy */}
                        <StreamingTerminal botId="simple-trend" className="h-[400px]" />
                    </div>
                </div>

                {/* Execution Layer Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Execution Layer (Hummingbot)</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="hummingbot" className="h-[400px]" />
                        <StreamingTerminal botId="nexora-dca-bot" className="h-[400px]" />
                        <StreamingTerminal botId="hummingbot-api" className="h-[400px]" />
                    </div>
                </div>

                {/* Infrastructure Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Database className="w-4 h-4 text-slate-500" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Infrastructure Nodes</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="postgres" className="h-[400px]" />
                        <StreamingTerminal botId="mqtt" className="h-[400px]" />
                        <StreamingTerminal botId="ws" className="h-[400px]" />
                    </div>
                </div>

                {/* DEX Bot Instances Section (NEW) */}
                <div>
                    <div className="flex items-center gap-2 mb-6 px-1 pt-4 border-t border-slate-800">
                        <Network className="w-4 h-4 text-purple-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live DEX Bot Instances (Hummingbot)</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <StreamingTerminal botId="nexora_momentum_lp" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_range_mm" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_cross_arb" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_hedged" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_funding_arb" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_token_snipe" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_flash_recovery" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_breakout" className="h-[450px]" />
                        <StreamingTerminal botId="nexora_weekend_mm" className="h-[450px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
