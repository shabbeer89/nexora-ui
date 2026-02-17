'use client';

import StrategyList from '@/components/nexora/StrategyList';
import { Zap } from 'lucide-react';

export default function StrategiesPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                    <Zap className="w-8 h-8 text-yellow-500" />
                    Strategy Designs <span className="text-yellow-500 font-mono text-sm not-italic ml-2">// ALPHA LOGIC</span>
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    Manage algorithm profiles and backtested script configurations
                </p>
            </div>
            <StrategyList />
        </div>
    );
}
