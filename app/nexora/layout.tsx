'use client';

import { useState } from 'react';
import Sidebar, { TabType } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

export default function NexoraLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Derive active tab from pathname
    // e.g. /nexora/overview -> overview
    const activeTab = (pathname.split('/')[2] || 'overview') as TabType;

    const setActiveTab = (tab: TabType) => {
        router.push(`/nexora/${tab}`);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-x-hidden">
            {/* Professional Grouped Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isExpanded={isSidebarExpanded}
                setIsExpanded={setIsSidebarExpanded}
            />

            {/* Content Area */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen relative transition-all duration-300 ease-in-out",
                isSidebarExpanded ? "ml-72" : "ml-20"
            )}>
                {/* Ambient Background Effects */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/5 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
                </div>

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
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">STABLE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Stage */}
                <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-10">
                    {children}
                </main>

                {/* Strategic Footer */}
                <footer className="relative z-10 mt-20 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl">
                    <div className="max-w-[1600px] mx-auto px-8 py-12">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Core Engine v1.0.42-STABLE</div>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-cyan-500/80">CEX: SOL-Trend-AI</div>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-purple-500/80">DEX: USDC-SOL-Yield</div>
                            </div>

                            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
                                <a href="/docs" target="_blank" className="text-slate-500 hover:text-cyan-400 transition-colors">Documentation</a>
                                <a href="#" className="text-slate-500 hover:text-white transition-colors">Protocol Status</a>
                                <div className="px-4 py-2 border border-white/10 rounded-full bg-white/5 text-slate-400">
                                    Local Node: <span className="text-white">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
