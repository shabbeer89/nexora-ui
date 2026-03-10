'use client';

import { useState, useEffect } from 'react';
import Sidebar, { TabType } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Head from 'next/head';

type ApiStatus = 'checking' | 'stable' | 'degraded' | 'offline';

function useApiHealth() {
    const [status, setStatus] = useState<ApiStatus>('checking');
    const [paperMode, setPaperMode] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
                if (res.ok) {
                    setStatus('stable');
                } else {
                    setStatus('degraded');
                }
            } catch {
                setStatus('offline');
            }

            // Check paper trading mode
            try {
                const res = await fetch('/api/freqtrade/status', { signal: AbortSignal.timeout(4000) });
                if (res.ok) {
                    const data = await res.json();
                    const isPaper = data?.paper_trading === true ||
                        (data?.exchange_name || '').toLowerCase().includes('paper') ||
                        (data?.strategy || '').toLowerCase().includes('paper');
                    setPaperMode(isPaper);
                }
            } catch {
                // Can't determine paper mode
            }
        };

        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    return { status, paperMode };
}

const statusConfig: Record<ApiStatus, { label: string; dot: string; text: string }> = {
    checking: { label: 'CHECKING', dot: 'bg-slate-500 animate-pulse', text: 'text-slate-400' },
    stable: { label: 'STABLE', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-400' },
    degraded: { label: 'DEGRADED', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-400' },
    offline: { label: 'OFFLINE', dot: 'bg-rose-500', text: 'text-rose-400' },
};

export default function NexoraLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const { status, paperMode } = useApiHealth();

    const activeTab = (pathname.split('/')[2] || 'overview') as TabType;

    const setActiveTab = (tab: TabType) => {
        router.push(`/nexora/${tab}`);
    };

    const sc = statusConfig[status];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-x-hidden">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isExpanded={isSidebarExpanded}
                setIsExpanded={setIsSidebarExpanded}
            />

            <div className={cn(
                "flex-1 flex flex-col min-h-screen relative transition-all duration-500 ease-[cubic-bezier(0.23,1.3,0.32,1)]",
                isSidebarExpanded ? "ml-72" : "ml-20"
            )}>
                {/* Ambient Background Effects */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/5 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
                </div>

                {/* Paper Trading Banner */}
                {paperMode === true && (
                    <div className="relative z-20 bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 flex items-center justify-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                            PAPER TRADING MODE — No real funds at risk. FreqTrade is running simulations only.
                        </span>
                    </div>
                )}

                {/* Tactical Header */}
                <header className="relative z-10 border-b border-white/5 bg-slate-950/20 backdrop-blur-xl sticky top-0">
                    <div className="max-w-[1600px] mx-auto px-10 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-8 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase">
                                Mission Control <span className="text-cyan-500 mx-2">//</span> {activeTab === 'engines' ? 'Engines' : activeTab.replace(/([A-Z])/g, ' $1').trim()}
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-white/5 rounded-xl">
                                <div className="flex flex-col items-end">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">API Connectivity</div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)}></div>
                                        <span className={cn("text-[10px] font-black tracking-widest uppercase", sc.text)}>
                                            {sc.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Stage */}
                <main className="relative z-10 flex-1 overflow-y-auto">
                    <ErrorBoundary>
                        <div className="max-w-[1600px] mx-auto px-8 py-10">
                            {children}
                        </div>
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
