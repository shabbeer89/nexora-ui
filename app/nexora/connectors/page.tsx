'use client';

import React from 'react';
import { GatewayWalletPanel } from '@/components/gateway/GatewayWalletPanel';
import { Plug, Zap, ShieldCheck, Share2 } from 'lucide-react';

export default function NexoraConnectorsPage() {
    return (
        <div className="space-y-8">
            {/* Connection Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Plug className="w-8 h-8 text-blue-500" />
                        Exchange Links <span className="text-blue-500 font-mono text-sm not-italic ml-2">// CORE GATEWAY</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Secure connection bridge to global liquidity venues and decentralized protocols
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-xl border border-white/5 group">
                        <Zap className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Gateway Status</span>
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1">OPERATIONAL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Gateway Interface */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Wallets and API Keys */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <GatewayWalletPanel />
                    </div>
                </div>

                {/* Right: Connector Health & Security */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Security Vault
                                </h4>
                                <span className="text-[9px] font-mono text-cyan-500">AES-256-GCM</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                        All API keys and private seeds are stored in an encrypted vault. Nexora never transmits plaintext credentials.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Active Venues
                                </h4>
                            </div>
                            <div className="space-y-3">
                                {['Binance', 'Kraken', 'Uniswap V3', 'Jupiter'].map(venue => (
                                    <div key={venue} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-cyan-500/30 transition-all">
                                        <span className="text-[11px] font-black text-white uppercase">{venue}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-[9px] font-mono text-slate-500">LINKED</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
