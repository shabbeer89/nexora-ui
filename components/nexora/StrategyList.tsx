'use client';

import { useState, useEffect } from 'react';
import { FileCode, Play, Plus, Search, Zap, Cpu, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StrategyList() {
    const [scripts, setScripts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/scripts')
            .then(res => res.json())
            .then(data => {
                setScripts(data.scripts || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = scripts.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-900/40 rounded-3xl border border-white/5">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Scan script registry..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Strategy
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(script => (
                    <div key={script.name} className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                                <FileCode className="w-6 h-6" />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-600 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                                <button className="p-2 text-slate-600 hover:text-cyan-400 transition-colors"><Play className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{script.name}</h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase mb-6">
                            {script.configs?.length || 0} active configurations
                        </p>

                        <div className="space-y-2">
                            {script.configs?.slice(0, 2).map((cfg: any) => (
                                <div key={cfg.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-mono">
                                    <span className="text-slate-400">{cfg.name}</span>
                                    <span className="text-cyan-500">{cfg.pair || 'BTC/USDT'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
