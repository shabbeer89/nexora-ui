'use client';

import { useEffect, useState } from 'react';
import { nexoraAPI } from '@/lib/nexora-api';
import { useWebSocket } from '@/hooks/useWebSocket';

interface EngineStatus {
    status: string;
    timestamp: string;
    services: {
        orchestrator: boolean;
        risk_manager: boolean;
        freqtrade: boolean;
        hummingbot: boolean;
    };
}

export default function EngineControl() {
    const [systemStatus, setSystemStatus] = useState<EngineStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws';
    const { onMessage } = useWebSocket(wsUrl);

    useEffect(() => {
        fetchStatus();
    }, []);

    useEffect(() => {
        const unsubscribe = onMessage((message) => {
            if (message.type === 'system_status_update') {
                console.log('[EngineControl] System Status Update:', message.data);
                setSystemStatus(message.data);
            }
        });

        return () => unsubscribe();
    }, [onMessage]);

    const fetchStatus = async () => {
        try {
            const status = await nexoraAPI.getStatus();
            setSystemStatus(status);
            setError(null);
        } catch (err) {
            setError('Failed to fetch engine status');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (service: string, action: string) => {
        // Placeholder for real actions via proxy
        console.log(`[EngineControl] Triggering ${action} on ${service}`);
        // In a real scenario, this would call specialized proxy endpoints
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning Protocols</span>
                </div>
            </div>
        );
    }

    const engines = [
        {
            id: 'freqtrade',
            name: 'FreqTrade CEX Engine',
            online: systemStatus?.services.freqtrade,
            type: 'SPOT / PERPETUAL',
            provider: 'Docker Instance (fbot)',
            latency: '12ms'
        },
        {
            id: 'hummingbot',
            name: 'HummingBot DEX Engine',
            online: systemStatus?.services.hummingbot,
            type: 'AMM / CLMM',
            provider: 'Docker Instance (hbot)',
            latency: '24ms'
        }
    ];

    const coreServices = [
        { name: 'Core Orchestrator', active: systemStatus?.services.orchestrator },
        { name: 'Risk Sentinel', active: systemStatus?.services.risk_manager },
        { name: 'WebSocket Bridge', active: true },
    ];

    return (
        <div className="space-y-10">
            {/* Core Infrastructure Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coreServices.map((service, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{service.name}</span>
                            <div className="text-xs font-bold text-white uppercase">{service.active ? 'Operational' : 'Offline'}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${service.active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-red-500/50'}`}></div>
                    </div>
                ))}
            </div>

            {/* Engine Command Center */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {engines.map((engine) => (
                    <div key={engine.id} className="relative group">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${engine.id === 'freqtrade' ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-indigo-500'} rounded-[2rem] blur opacity-10 group-hover:opacity-25 transition-duration-500`}></div>
                        <div className="relative bg-[#0b1120] border border-white/10 rounded-[2rem] p-8 overflow-hidden">
                            {/* Accent Background */}
                            <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-10 ${engine.id === 'freqtrade' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>

                            <div className="flex items-start justify-between mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${engine.id === 'freqtrade' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            <span className="font-black">{engine.id === 'freqtrade' ? 'C' : 'D'}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-tight">{engine.name}</h3>
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{engine.provider} • {engine.type}</p>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${engine.online ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${engine.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{engine.online ? 'CONNECTED' : 'SEVERED'}</span>
                                </div>
                            </div>

                            {/* Telemetry Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-10">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Latency</div>
                                    <div className="text-sm font-black text-white">{engine.online ? engine.latency : '--'}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Threads</div>
                                    <div className="text-sm font-black text-white">{engine.online ? 'Active (8)' : '--'}</div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Memory</div>
                                    <div className="text-sm font-black text-white">{engine.online ? '242MB' : '--'}</div>
                                </div>
                            </div>

                            {/* Action Matrix */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleAction(engine.id, 'restart')}
                                    disabled={!engine.online}
                                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-30 transition-all"
                                >
                                    🔄 REBOOT ENGINE
                                </button>
                                <button
                                    onClick={() => handleAction(engine.id, 'logs')}
                                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all"
                                >
                                    📄 STREAM LOGS
                                </button>
                                <button
                                    onClick={() => handleAction(engine.id, 'start')}
                                    disabled={engine.online}
                                    className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-400 disabled:opacity-30 transition-all"
                                >
                                    ▶ START
                                </button>
                                <button
                                    onClick={() => handleAction(engine.id, 'stop')}
                                    disabled={!engine.online}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-100 disabled:opacity-30 transition-all"
                                >
                                    ⏹ FORCE STOP
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Neural Net Status Logs (Fake terminal for aesthetics) */}
            <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-4">System Event Stream</span>
                    </div>
                    <div className="text-[9px] font-mono text-cyan-500 uppercase">Live: T-Minus 00:00:42</div>
                </div>
                <div className="p-8 font-mono text-[11px] space-y-2 h-64 overflow-y-auto custom-scrollbar">
                    <p className="text-emerald-500/80">[SYSTEM] <span className="text-white/60">Established handshake with Nexora Bridge</span></p>
                    <p className="text-blue-500/80">[FREQTRADE] <span className="text-white/60">Poll: Strategy 'SOL-Momentum-v4' responding (OK)</span></p>
                    <p className="text-purple-500/80">[HUMMINGBOT] <span className="text-white/60">Gateway proxy verified at http://localhost:15888</span></p>
                    <p className="text-slate-500">[KERNEL] <span className="text-white/40">Garbage collection cycle completed (142ms)</span></p>
                    <p className="text-amber-500/80">[RISK] <span className="text-white/60">Exposure audit: 45.2% (Within threshold)</span></p>
                    <p className="text-white/20">... listening for tactical telemetry ...</p>
                </div>
            </div>
        </div>
    );
}
