'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ListPlus, Trash2, Search, Save, RefreshCw, AlertCircle, CheckCircle2, TrendingUp, Filter } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PairInfo {
    symbol: string;
    volume: number;
    change24h: number;
    is_active: boolean;
    reason?: string;
}

export default function PairlistTuner() {
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [blacklist, setBlacklist] = useState<string[]>([]);
    const [availablePairs, setAvailablePairs] = useState<PairInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const fetchPairlist = useCallback(async () => {
        setLoading(true);
        try {
            const response = await backendApi.get('/freqtrade/pairlist');
            if (response.data) {
                setWhitelist(response.data.whitelist || []);
                setBlacklist(response.data.blacklist || []);
                setAvailablePairs(response.data.available || []);
            }
        } catch (err) {
            console.error('Failed to fetch pairlist:', err);
            // Fallback for demonstration
            setWhitelist(['SOL/USDT', 'BTC/USDT', 'ETH/USDT']);
            setBlacklist(['XRP/USDT']);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPairlist();
    }, [fetchPairlist]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await backendApi.post('/freqtrade/pairlist', { whitelist, blacklist });
            toast.success('Pairlist updated successfully');
            setIsDirty(false);
        } catch (err) {
            toast.error('Failed to update pairlist');
        } finally {
            setSaving(false);
        }
    };

    const addToWhitelist = (pair: string) => {
        if (!whitelist.includes(pair)) {
            setWhitelist([...whitelist, pair]);
            setIsDirty(true);
        }
    };

    const removeFromWhitelist = (pair: string) => {
        setWhitelist(whitelist.filter(p => p !== pair));
        setIsDirty(true);
    };

    const addToBlacklist = (pair: string) => {
        if (!blacklist.includes(pair)) {
            setBlacklist([...blacklist, pair]);
            setIsDirty(true);
        }
    };

    const removeFromBlacklist = (pair: string) => {
        setBlacklist(blacklist.filter(p => p !== pair));
        setIsDirty(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Control */}
            <div className="flex items-center justify-between p-6 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl">
                <div>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-1">Pairlist Tuner</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Dynamic Whitelist & Blacklist Management</p>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <button
                            onClick={fetchPairlist}
                            className="px-4 py-2 text-xs font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            isDirty
                                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        )}
                    >
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Commit Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Assets Panel */}
                <div className="lg:col-span-1 flex flex-col bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Market Discovery</h4>
                            <span className="text-[9px] font-mono text-cyan-500">TOP 100 VOL</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filter pairs..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center opacity-30">
                                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                                <span className="text-[10px] uppercase font-black tracking-tighter">Scanning Exchange</span>
                            </div>
                        ) : availablePairs.filter(p => p.symbol.toLowerCase().includes(searchTerm.toLowerCase())).map((pair) => (
                            <div key={pair.symbol} className="group p-3 flex items-center justify-between rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                                <div>
                                    <div className="text-sm font-bold text-white">{pair.symbol}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">${(pair.volume / 1000000).toFixed(1)}M Vol</span>
                                        <span className={cn("text-[9px] font-mono", pair.change24h >= 0 ? "text-emerald-500" : "text-red-500")}>
                                            {pair.change24h >= 0 ? '+' : ''}{pair.change24h}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                    <button
                                        onClick={() => addToWhitelist(pair.symbol)}
                                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                        title="Add to Whitelist"
                                    >
                                        <ListPlus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tactical Whitelist Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Whitelist */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-emerald-500/[0.02]">
                            <div>
                                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Active Whitelist
                                </h4>
                                <p className="text-[9px] text-slate-500 mt-1 uppercase">Assets approved for execution</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-lg">
                                {whitelist.length} ASSETS
                            </span>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-wrap gap-3">
                                {whitelist.map((pair) => (
                                    <div key={pair} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-slate-950/50 border border-white/10 rounded-2xl group hover:border-emerald-500/50 transition-all">
                                        <span className="text-xs font-bold text-white tracking-tight">{pair}</span>
                                        <button
                                            onClick={() => removeFromWhitelist(pair)}
                                            className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {whitelist.length === 0 && (
                                    <div className="w-full py-10 text-center border-2 border-dashed border-slate-800 rounded-3xl opacity-30">
                                        <p className="text-xs uppercase tracking-widest">Whitelist Empty - Strategy will not trade</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Blacklist */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden opacity-80">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-red-500/[0.02]">
                            <div>
                                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Global Blacklist
                                </h4>
                                <p className="text-[9px] text-slate-500 mt-1 uppercase">Force-halted assets</p>
                            </div>
                            <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black rounded-lg">
                                {blacklist.length} BLOCKED
                            </span>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-wrap gap-3">
                                {blacklist.map((pair) => (
                                    <div key={pair} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-slate-950/50 border border-white/10 rounded-2xl group hover:border-red-500/50 transition-all">
                                        <span className="text-xs font-bold text-slate-300 line-through">{pair}</span>
                                        <button
                                            onClick={() => removeFromBlacklist(pair)}
                                            className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
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
