'use client';

import React from 'react';
import {
    LayoutDashboard,
    Briefcase,
    Zap,
    ShieldAlert,
    Globe,
    BrainCircuit,
    BarChart3,
    GanttChartSquare,
    LayoutGrid,
    Settings2,
    Bell,
    Target,
    TrendingDown,
    Settings,
    AlertTriangle,
    Activity,
    LogOut,
    UserCircle,
    History,
    FileText,
    ChevronDown,
    ChevronRight,
    Terminal,
    ArrowUpDown,
    CandlestickChart,
    Layers,
    FileCode,
    Plug,
    Percent,
    Container,
    Archive,
    TrendingUp,
    Users,
    Building2,
    Shield,
    DollarSign,
    ClipboardList,
    Key,
    Brain,
    Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearTokens } from '@/lib/backend-api';
import { useStore } from '@/store/useStore';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export type TabType =
    | 'overview' | 'portfolio' | 'strategies' | 'risk' | 'engines'
    | 'cockpit' | 'macro' | 'ml' | 'analytics' | 'emergency'
    | 'trades' | 'orders' | 'alerts' | 'hyperopt' | 'drawdown' | 'history' | 'terminal';

interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

interface NavGroup {
    label: string;
    items: {
        id?: TabType | string;
        href?: string;
        label: string;
        icon: React.ElementType;
        color?: string;
        minRole?: "ADMIN" | "SUPER_ADMIN";
    }[];
}

export default function Sidebar({ activeTab, setActiveTab, isExpanded, setIsExpanded }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { role, isAdmin, isSuperAdmin } = useAuth();
    const logout = useStore(state => state.logout);
    const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

    const toggleGroup = (label: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsExpanded(true);
    };

    const handleMouseLeave = () => {
        closeTimeoutRef.current = setTimeout(() => {
            setIsExpanded(false);
            closeTimeoutRef.current = null;
        }, 1000); // 1 second delay
    };

    const handleLogout = () => {
        clearTokens();
        logout();
        router.push('/login');
    };

    const navGroups: NavGroup[] = [
        {
            label: "Mission Control",
            items: [
                { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, color: 'text-cyan-400' },
                { id: 'cockpit', label: 'Market Overview', icon: Activity, color: 'text-emerald-400' },
                { href: '/nexora/activity', label: 'Global Activity', icon: Activity, color: 'text-blue-400' },
                { href: '/nexora/charts', label: 'Live Charts', icon: CandlestickChart, color: 'text-purple-400' },
            ]
        },
        {
            label: "Execution Engine",
            items: [
                { id: 'engines', label: 'Fleet Orchestration', icon: LayoutGrid, color: 'text-cyan-400' },
                { id: 'strategies', label: 'Alpha Engines', icon: Zap, color: 'text-yellow-400' },
                { href: '/nexora/orchestration', label: 'Trading Bots', icon: Brain, color: 'text-emerald-400' },
                { href: '/nexora/manual', label: 'Manual Trade', icon: ArrowUpDown, color: 'text-slate-400' },
                { id: 'trades', label: 'Active Trades', icon: Briefcase, color: 'text-blue-400' },
                { id: 'orders', label: 'Advanced Orders', icon: GanttChartSquare, color: 'text-indigo-400' },
                { id: 'terminal', label: 'System Terminal', icon: Terminal, color: 'text-blue-500' },
            ]
        },
        {
            label: "Intelligence Lab",
            items: [
                { id: 'ml', label: 'FreqAI models', icon: BrainCircuit, color: 'text-purple-400' },
                { id: 'macro', label: 'Global Macro', icon: Globe, color: 'text-sky-400' },
                { id: 'hyperopt', label: 'Optimization', icon: Target, color: 'text-orange-400' },
                { href: '/nexora/backtesting', label: 'Backtesting', icon: Layers, color: 'text-slate-400' },
                { href: '/nexora/scripts', label: 'Strategy Scripts', icon: FileCode, color: 'text-yellow-600' },
            ]
        },
        {
            label: "Finance & Performance",
            items: [
                { href: '/nexora/portfolio-global', label: 'Total Portfolio', icon: Wallet, color: 'text-emerald-500' },
                { href: '/nexora/capital', label: 'Capital Manager', icon: TrendingUp, color: 'text-blue-500' },
                { href: '/nexora/funding', label: 'Funding Rates', icon: Percent, color: 'text-purple-400' },
                { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-cyan-400' },
                { id: 'history', label: 'Trade History', icon: History, color: 'text-slate-400' },
            ]
        },
        {
            label: "Risk & Protection",
            items: [
                { id: 'risk', label: 'Risk Guardian', icon: ShieldAlert, color: 'text-rose-400' },
                { id: 'drawdown', label: 'Drawdown Control', icon: TrendingDown, color: 'text-red-400' },
                { id: 'emergency', label: 'Kill Switch', icon: AlertTriangle, color: 'text-red-600' },
            ]
        },
        {
            label: "Operations",
            items: [
                { href: '/nexora/connectors', label: 'Exchange Links', icon: Plug, color: 'text-blue-400' },
                { href: '/nexora/docker', label: 'Docker Control', icon: Container, color: 'text-cyan-600' },
                { id: 'alerts', label: 'System Alerts', icon: Bell, color: 'text-amber-400' },
                { href: '/nexora/archived-bots', label: 'Archives', icon: Archive, color: 'text-slate-500' },
            ]
        },
        {
            label: "Administrative",
            items: [
                { href: '/nexora/admin', label: 'Admin Hub', icon: Shield, color: 'text-purple-500', minRole: 'ADMIN' },
                { href: '/nexora/admin/users', label: 'User Control', icon: Users, color: 'text-indigo-400', minRole: 'ADMIN' },
                { href: '/nexora/admin/audit-logs', label: 'Security Logs', icon: FileText, color: 'text-slate-400', minRole: 'ADMIN' },
                { href: '/nexora/admin/organizations', label: 'Organizations', icon: Building2, color: 'text-blue-400', minRole: 'SUPER_ADMIN' },
            ]
        }
    ];

    return (
        <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "fixed left-0 top-0 h-screen bg-slate-950 border-r border-white/5 flex flex-col z-50 transition-all duration-300 ease-in-out",
                isExpanded ? "w-72" : "w-20"
            )}
        >
            {/* Logo Section */}
            <div className={cn("p-6 border-b border-white/5 flex items-center transition-all", isExpanded ? "px-8" : "justify-center px-0")}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <span className="font-black text-white text-sm">NX</span>
                    </div>
                    {isExpanded && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Nexora</h1>
                            <p className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest mt-1">Mission Control</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6">
                {navGroups.map((group, gIdx) => (
                    <div key={gIdx} className="mb-6 px-2">
                        {isExpanded ? (
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-[0.2em] mb-1 transition-colors group/header"
                            >
                                <span>{group.label}</span>
                                {collapsedGroups[group.label] ? (
                                    <ChevronRight className="w-3 h-3 group-hover/header:text-cyan-500" />
                                ) : (
                                    <ChevronDown className="w-3 h-3 group-hover/header:text-cyan-500" />
                                )}
                            </button>
                        ) : (
                            <div className="h-px bg-white/5 mx-2 my-4" />
                        )}

                        {(!isExpanded || !collapsedGroups[group.label]) && (
                            <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                                {group.items.map((item) => {
                                    // Role-based visibility check
                                    if (item.minRole === 'ADMIN' && !isAdmin && !isSuperAdmin) return null;
                                    if (item.minRole === 'SUPER_ADMIN' && !isSuperAdmin) return null;

                                    const Icon = item.icon;
                                    const isActive = item.href ? pathname === item.href : activeTab === item.id;

                                    const handleClick = () => {
                                        if (item.href) {
                                            router.push(item.href);
                                        } else if (item.id) {
                                            setActiveTab(item.id as TabType);
                                        }
                                    };

                                    return (
                                        <button
                                            key={item.href || (item.id as string)}
                                            onClick={handleClick}
                                            title={!isExpanded ? item.label : undefined}
                                            className={cn(
                                                "w-full flex items-center rounded-2xl transition-all group relative",
                                                isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3",
                                                isActive
                                                    ? "bg-white/5 text-white"
                                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "w-5 h-5 transition-colors flex-shrink-0",
                                                isActive ? item.color : "group-hover:text-slate-300"
                                            )} />
                                            {isExpanded && (
                                                <span className="text-xs font-bold uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                            )}

                                            {isActive && (
                                                <div className={cn(
                                                    "absolute bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,1)]",
                                                    isExpanded ? "left-[-16px] w-1 h-6" : "right-1 w-1 h-1"
                                                )} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer / Status Area */}
            <div className={cn("mt-auto flex flex-col border-t border-white/5 bg-slate-950/50 transition-all", isExpanded ? "p-4" : "p-2 items-center")}>
                {/* User Section */}
                <div className="mb-4 w-full">
                    <button
                        onClick={() => setActiveTab('overview')} // Or settings if implemented
                        className={cn(
                            "w-full flex items-center rounded-xl transition-all hover:bg-white/[0.05] group",
                            isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3"
                        )}
                    >
                        <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        {isExpanded && (
                            <div className="flex-1 text-left">
                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Operator Instance</p>
                                <p className="text-[9px] font-mono text-slate-500 truncate">ID: NX-8842-A</p>
                            </div>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center rounded-xl transition-all hover:bg-red-500/10 group mt-1",
                            isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3 text-red-500"
                        )}
                    >
                        <LogOut className={cn("w-5 h-5", isExpanded ? "text-slate-400 group-hover:text-red-500" : "text-red-500")} />
                        {isExpanded && (
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-red-500 uppercase tracking-widest">Terminate Session</span>
                        )}
                    </button>

                    {/* Integrated System Controls */}
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                        <button
                            onClick={() => router.push('/settings')}
                            className={cn(
                                "w-full flex items-center rounded-xl transition-all hover:bg-white/[0.05] group",
                                isExpanded ? "px-4 py-3 gap-3" : "justify-center p-3",
                                pathname === '/settings' ? "bg-white/5 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Settings className={cn("w-5 h-5", pathname === '/settings' ? "text-cyan-500" : "text-slate-500 group-hover:text-white")} />
                            {isExpanded && <span className="text-[10px] font-black uppercase tracking-widest">System Settings</span>}
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
                            {isExpanded && <span className="text-[10px] font-black uppercase tracking-widest">API Connectivity</span>}
                        </button>
                    </div>
                </div>

                {isExpanded ? (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500/80 tracking-widest uppercase">Nodes: OK</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-600">v1.2.4</span>
                        </div>
                        <button
                            onClick={() => setActiveTab('emergency')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Global Emergency
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Nodes: OK" />
                        <button
                            onClick={() => setActiveTab('emergency')}
                            className="p-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-red-500 transition-all"
                            title="Global Emergency"
                        >
                            <AlertTriangle className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
