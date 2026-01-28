'use client';

import { useState } from 'react';
import {
    UserCircle,
    LogOut,
    Settings,
    Key,
    AlertTriangle,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

interface BottomDrawerProps {
    isExpanded: boolean;
    handleLogout: () => void;
    setActiveTab: (tab: any) => void;
}

export default function BottomDrawer({ isExpanded, handleLogout, setActiveTab }: BottomDrawerProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    return (
        <>
            {/* Drawer Overlay */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Drawer Content */}
            <div
                className={cn(
                    "fixed bottom-0 bg-slate-900/95 backdrop-blur-2xl border-t-2 border-white/10 shadow-2xl transition-all duration-300 ease-out z-50",
                    isExpanded ? "left-0 w-72" : "left-0 w-20",
                    isDrawerOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className={cn("p-6 space-y-4", !isExpanded && "flex flex-col items-center")}>
                    {/* User Section */}
                    <div className="w-full">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all hover:bg-white/[0.05] group",
                                isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3"
                            )}
                        >
                            <UserCircle className="w-6 h-6 text-slate-400 group-hover:text-white" />
                            {isExpanded && (
                                <div className="flex-1 text-left">
                                    <p className="text-xs font-black text-white uppercase tracking-tight">Operator Instance</p>
                                    <p className="text-[10px] font-mono text-slate-500 truncate">ID: NX-8842-A</p>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={handleLogout}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all hover:bg-red-500/10 group mt-2",
                                isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3 text-red-500"
                            )}
                        >
                            <LogOut className={cn("w-6 h-6", isExpanded ? "text-slate-400 group-hover:text-red-500" : "text-red-500")} />
                            {isExpanded && (
                                <span className="text-xs font-black text-slate-400 group-hover:text-red-500 uppercase tracking-widest">Terminate Session</span>
                            )}
                        </button>
                    </div>

                    {/* System Controls */}
                    <div className={cn("pt-4 border-t border-white/10 space-y-2", !isExpanded && "w-full")}>
                        <button
                            onClick={() => router.push('/settings')}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all hover:bg-white/[0.05] group",
                                isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3",
                                pathname === '/settings' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Settings className={cn("w-5 h-5", pathname === '/settings' ? "text-cyan-500" : "text-slate-500 group-hover:text-white")} />
                            {isExpanded && <span className="text-xs font-black uppercase tracking-widest">System Settings</span>}
                        </button>

                        <button
                            onClick={() => router.push('/settings/accounts')}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all hover:bg-white/[0.05] group",
                                isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3",
                                pathname === '/settings/accounts' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Key className={cn("w-5 h-5", pathname === '/settings/accounts' ? "text-blue-500" : "text-slate-500 group-hover:text-white")} />
                            {isExpanded && <span className="text-xs font-black uppercase tracking-widest">API Connectivity</span>}
                        </button>
                    </div>

                    {/* Status & Emergency */}
                    <div className={cn("pt-4 border-t border-white/10", !isExpanded && "w-full flex flex-col items-center")}>
                        {isExpanded ? (
                            <>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                                        <span className="text-xs font-black text-emerald-500/80 tracking-widest uppercase">Nodes: OK</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-600">v1.2.4</span>
                                </div>
                                <button
                                    onClick={() => { setActiveTab('emergency'); setIsDrawerOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-600/30 rounded-xl text-red-400 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10"
                                >
                                    <AlertTriangle className="w-5 h-5" />
                                    Global Emergency
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50 mb-4" title="Nodes: OK" />
                                <button
                                    onClick={() => { setActiveTab('emergency'); setIsDrawerOpen(false); }}
                                    className="p-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-600/30 rounded-xl text-red-400 transition-all shadow-lg shadow-red-500/10"
                                    title="Global Emergency"
                                >
                                    <AlertTriangle className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Drawer Toggle Button */}
            <div className={cn("mt-auto border-t border-white/5 bg-slate-950/50", isExpanded ? "p-4" : "p-2")}>
                <button
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 rounded-xl transition-all group",
                        isExpanded ? "px-4 py-3 hover:bg-white/[0.05]" : "p-3 hover:bg-white/[0.05]",
                        isDrawerOpen ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                    )}
                >
                    {isDrawerOpen ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronUp className="w-5 h-5" />
                    )}
                    {isExpanded && (
                        <span className="text-xs font-black uppercase tracking-widest">
                            {isDrawerOpen ? 'Close Panel' : 'System Panel'}
                        </span>
                    )}
                </button>
            </div>
        </>
    );
}
