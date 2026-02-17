'use client';

import PerformanceAnalytics from '@/components/nexora/PerformanceAnalytics';
import { BarChart3 } from 'lucide-react';

export default function EnginesPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-emerald-500" />
                    Engine Performance <span className="text-emerald-500 font-mono text-sm not-italic ml-2">// INSTITUTIONAL ANALYTICS</span>
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    Aggregated risk-adjusted metrics and global alpha trajectory
                </p>
            </div>
            <PerformanceAnalytics />
        </div>
    );
}
