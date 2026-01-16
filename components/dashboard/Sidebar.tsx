"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Activity, Settings, LineChart, Wallet,
    Terminal, FlaskConical, LogOut, ShieldAlert, ClipboardList,
    Layers, ChevronDown, ChevronRight, Store, Building2, BarChart3,
    Users, FileText, Shield, ArrowUpDown, CandlestickChart, DollarSign,
    Settings2, FileCode, Archive, Plug, Percent, Container, Key,
    TrendingUp, Target, History, ChevronLeft, Menu
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";

// SIMPLIFIED NAVIGATION FOR END USERS (TRADER role)
const endUserNavigation = [
    { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { name: "Profit", href: "/user/profit", icon: TrendingUp },
    { name: "Opportunities", href: "/user/opportunities", icon: Target },
    { name: "Connect Exchange", href: "/connectors", icon: Plug },
    {
        name: "History",
        href: "/user/history",
        icon: History,
        children: [
            { name: "Login History", href: "/user/history/login" },
            { name: "Trade History", href: "/user/history/trades" }
        ]
    },
];

// FULL NAVIGATION FOR ADMINS (existing structure)
const mainNavigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Bots", href: "/orchestration", icon: Terminal },

    { name: "Orders", href: "/orders", icon: ClipboardList },
    { name: "Positions", href: "/positions", icon: DollarSign },
    { name: "Portfolio", href: "/portfolio", icon: Wallet },
    { name: "Capital", href: "/capital", icon: TrendingUp },
    { name: "Activity", href: "/activity", icon: Activity },
];

// Strategy & Tools links
const toolsNavigation = [
    { name: "Manual Trade", href: "/trading/manual", icon: ArrowUpDown },
    { name: "Charts", href: "/charts", icon: CandlestickChart },
    { name: "Strategies", href: "/strategies", icon: Layers },
    { name: "Controllers", href: "/controllers", icon: Settings2 },
    { name: "Scripts", href: "/scripts", icon: FileCode },
    { name: "Connectors", href: "/connectors", icon: Plug },
    { name: "Backtesting", href: "/backtesting", icon: FlaskConical },
    { name: "Risk", href: "/risk", icon: ShieldAlert },
    { name: "Funding", href: "/funding", icon: Percent },
    { name: "Docker", href: "/docker", icon: Container },
    { name: "Archived Bots", href: "/archived-bots", icon: Archive },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

// Admin panel links - role restricted
const adminPanelNavigation = [
    { name: "Admin Dashboard", href: "/admin", icon: Shield, minRole: 'ADMIN' as const },
    { name: "Users", href: "/admin/users", icon: Users, minRole: 'ADMIN' as const },
    { name: "Organizations", href: "/admin/organizations", icon: Building2, minRole: 'SUPER_ADMIN' as const },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText, minRole: 'ADMIN' as const },
];

export function Sidebar() {
    const pathname = usePathname();
    const {
        appMode,
        toggleAppMode,
        sidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        toggleMobileSidebar
    } = useStore();
    const { isAdmin, isSuperAdmin, isTrader, hasRole } = useAuth();
    const [adminExpanded, setAdminExpanded] = useState(false);
    const [adminPanelExpanded, setAdminPanelExpanded] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState(false);

    // Auto-expand sections if user is on that page
    const isOnToolsPage = toolsNavigation.some(item => pathname === item.href);
    const isOnAdminPage = pathname?.startsWith('/admin');
    const isOnHistoryPage = pathname?.startsWith('/user/history');

    // Determine which navigation to show based on role
    const showSimplifiedNav = isTrader && !isAdmin;

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => toggleMobileSidebar(false)}
                />
            )}

            <div className={cn(
                "flex h-full flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out fixed top-0 z-50",
                sidebarCollapsed ? "w-20" : "w-64",
                // Mobile responsiveness
                mobileSidebarOpen ? "left-0" : "-left-full lg:left-0",
                "shadow-2xl lg:shadow-none"
            )}>
                <div className="flex h-16 items-center border-b border-slate-800 px-4 overflow-hidden">
                    <div className={cn(
                        "flex items-center gap-3 transition-all duration-300",
                        sidebarCollapsed ? "justify-center w-full" : "justify-start"
                    )}>
                        <div className="relative w-8 h-8 flex-shrink-0 animate-pulse-subtle">
                            <img
                                src="/icon.png"
                                alt="He Bot Logo"
                                className="w-full h-full object-contain rounded-lg shadow-lg shadow-blue-500/20"
                            />
                        </div>
                        {!sidebarCollapsed && (
                            <h1 className="text-xl font-bold truncate tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                He Bot
                            </h1>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <div className="flex items-center ml-auto">
                            {/* Mobile close button */}
                            <button
                                onClick={() => toggleMobileSidebar(false)}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Desktop toggle button */}
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors hidden lg:block"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <button
                            onClick={toggleSidebar}
                            className="absolute right-0 top-0 bottom-0 left-0 w-full h-full opacity-0 z-10"
                        />
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
                    {/* SIMPLIFIED NAVIGATION FOR END USERS (TRADER) */}
                    {showSimplifiedNav ? (
                        <div className="space-y-1">
                            {endUserNavigation.map((item) => {
                                if (item.children) {
                                    // History dropdown
                                    const isActive = pathname?.startsWith(item.href);
                                    return (
                                        <div key={item.name}>
                                            <button
                                                onClick={() => setHistoryExpanded(!historyExpanded)}
                                                className={cn(
                                                    "w-full group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "text-white"
                                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                                )}
                                            >
                                                <div className="flex items-center">
                                                    <item.icon className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} aria-hidden="true" />
                                                    {!sidebarCollapsed && item.name}
                                                </div>
                                                {!sidebarCollapsed && (
                                                    (historyExpanded || isOnHistoryPage) ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )
                                                )}
                                            </button>
                                            {!sidebarCollapsed && (historyExpanded || isOnHistoryPage) && (
                                                <div className="ml-8 space-y-1 mt-1">
                                                    {item.children.map((child) => {
                                                        const childActive = pathname === child.href;
                                                        return (
                                                            <Link
                                                                key={child.name}
                                                                href={child.href}
                                                                onClick={() => toggleMobileSidebar(false)}
                                                                className={cn(
                                                                    "block rounded-md px-3 py-2 text-sm transition-colors",
                                                                    childActive
                                                                        ? "text-white font-medium"
                                                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                                                )}
                                                            >
                                                                {child.name}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => toggleMobileSidebar(false)}
                                        className={cn(
                                            "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "text-white"
                                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                        )}
                                        style={isActive ? { backgroundColor: 'var(--color-primary)' } : {}}
                                    >
                                        <item.icon
                                            className={cn("h-5 w-5 flex-shrink-0", !sidebarCollapsed && "mr-3")}
                                            style={isActive ? { color: 'var(--color-primary)' } : {}}
                                            aria-hidden="true"
                                        />
                                        {!sidebarCollapsed && item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        /* FULL NAVIGATION FOR ADMINS */
                        <>
                            {/* Main Trading Links */}
                            <div className="space-y-1">
                                {!sidebarCollapsed && (
                                    <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Trading
                                    </p>
                                )}
                                {mainNavigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => toggleMobileSidebar(false)}
                                            className={cn(
                                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-slate-800 text-blue-400"
                                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-5 w-5 flex-shrink-0",
                                                    !sidebarCollapsed && "mr-3",
                                                    isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
                                                )}
                                                aria-hidden="true"
                                            />
                                            {!sidebarCollapsed && item.name}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Tools Section - Collapsible */}
                            <div className="mt-6 space-y-1">
                                <button
                                    onClick={() => { !sidebarCollapsed && setAdminExpanded(!adminExpanded); toggleMobileSidebar(false); }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors",
                                        sidebarCollapsed && "justify-center"
                                    )}
                                >
                                    {!sidebarCollapsed ? (
                                        <>
                                            <span>Tools</span>
                                            {(adminExpanded || isOnToolsPage) ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </>
                                    ) : (
                                        <Layers className="w-5 h-5" />
                                    )}
                                </button>

                                {!sidebarCollapsed && (adminExpanded || isOnToolsPage) && (
                                    <div className="space-y-1 pl-2">
                                        {toolsNavigation.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => toggleMobileSidebar(false)}
                                                    title={sidebarCollapsed ? item.name : ""}
                                                    className={cn(
                                                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                        isActive
                                                            ? "bg-slate-800 text-blue-400"
                                                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                                        sidebarCollapsed && "justify-center"
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            "h-4 w-4 flex-shrink-0",
                                                            !sidebarCollapsed && "mr-3",
                                                            isActive ? "text-blue-400" : "text-slate-500 group-hover:text-white"
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {!sidebarCollapsed && item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Admin Panel - Only visible to admins */}
                            {isAdmin && (
                                <div className="mt-6 space-y-1">
                                    <button
                                        onClick={() => { !sidebarCollapsed && setAdminPanelExpanded(!adminPanelExpanded); toggleMobileSidebar(false); }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors",
                                            sidebarCollapsed && "justify-center"
                                        )}
                                    >
                                        {!sidebarCollapsed ? (
                                            <>
                                                <span>Admin Panel</span>
                                                {(adminPanelExpanded || isOnAdminPage) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </>
                                        ) : (
                                            <Shield className="w-5 h-5" />
                                        )}
                                    </button>

                                    {!sidebarCollapsed && (adminPanelExpanded || isOnAdminPage) && (
                                        <div className="space-y-1 pl-2">
                                            {adminPanelNavigation
                                                .filter(item => item.minRole === 'ADMIN' || (item.minRole === 'SUPER_ADMIN' && isSuperAdmin))
                                                .map((item) => {
                                                    const isActive = pathname === item.href;
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            onClick={() => toggleMobileSidebar(false)}
                                                            title={sidebarCollapsed ? item.name : ""}
                                                            className={cn(
                                                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                                isActive
                                                                    ? "bg-purple-900/30 text-purple-400"
                                                                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                                                sidebarCollapsed && "justify-center"
                                                            )}
                                                        >
                                                            <item.icon
                                                                className={cn(
                                                                    "h-4 w-4 flex-shrink-0",
                                                                    !sidebarCollapsed && "mr-3",
                                                                    isActive ? "text-purple-400" : "text-slate-500 group-hover:text-white"
                                                                )}
                                                                aria-hidden="true"
                                                            />
                                                            {!sidebarCollapsed && item.name}
                                                        </Link>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </nav>

                <div className={cn("border-t border-slate-800 p-4 space-y-4", sidebarCollapsed && "px-2")}>
                    {/* Admin-only items - hide for end users */}
                    {!showSimplifiedNav && (
                        <>
                            {/* Trading Mode Toggle */}
                            <div
                                className={cn(
                                    "rounded-lg p-3 border transition-all cursor-pointer",
                                    appMode === 'paper'
                                        ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                                        : "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
                                )}
                                onClick={toggleAppMode}
                            >
                                <div className={cn("flex items-center justify-between", sidebarCollapsed && "justify-center")}>
                                    <div className="flex items-center gap-2">
                                        {appMode === 'paper' ? (
                                            <FlaskConical className="w-4 h-4 text-amber-400" />
                                        ) : (
                                            <Activity className="w-4 h-4 text-green-400" />
                                        )}
                                        {!sidebarCollapsed && (
                                            <span className={cn(
                                                "text-xs font-bold",
                                                appMode === 'paper' ? "text-amber-400" : "text-green-400"
                                            )}>
                                                {appMode === 'paper' ? 'PAPER' : 'LIVE'}
                                            </span>
                                        )}
                                    </div>
                                    {!sidebarCollapsed && (
                                        <div className={cn(
                                            "relative w-8 h-4 rounded-full transition-colors",
                                            appMode === 'paper' ? "bg-amber-500/30" : "bg-green-500/30"
                                        )}>
                                            <div className={cn(
                                                "absolute top-0.5 h-3 w-3 rounded-full shadow-lg transition-all duration-200",
                                                appMode === 'paper'
                                                    ? "left-0.5 bg-amber-500"
                                                    : "left-4.5 bg-green-500"
                                            )}></div>
                                        </div>
                                    )}
                                </div>
                                {!sidebarCollapsed && (
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {appMode === 'paper' ? 'No real money at risk' : '⚠️ Real funds active'}
                                    </p>
                                )}
                            </div>

                            {/* Settings Link */}
                            <Link
                                href="/settings"
                                className={cn(
                                    "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                    pathname === '/settings'
                                        ? "bg-slate-800 text-blue-400"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                    sidebarCollapsed && "justify-center"
                                )}
                                title={sidebarCollapsed ? "Settings" : ""}
                            >
                                <Settings className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
                                {!sidebarCollapsed && "Settings"}
                            </Link>

                            {/* Accounts Link */}
                            <Link
                                href="/settings/accounts"
                                className={cn(
                                    "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                    pathname === '/settings/accounts'
                                        ? "bg-slate-800 text-blue-400"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                    sidebarCollapsed && "justify-center"
                                )}
                                title={sidebarCollapsed ? "API Keys" : ""}
                            >
                                <Key className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
                                {!sidebarCollapsed && "API Keys"}
                            </Link>

                            {/* Status Indicator */}
                            <div className={cn("flex items-center px-2", sidebarCollapsed && "justify-center")}>
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                {!sidebarCollapsed && <span className="text-xs text-slate-400 ml-2">System Online</span>}
                            </div>
                        </>
                    )}

                    {/* Sign Out - always visible */}
                    <button
                        onClick={() => {
                            const { clearTokens } = require('@/lib/backend-api');
                            const { useStore } = require('@/store/useStore');
                            clearTokens();
                            useStore.getState().logout();
                            window.location.href = '/login';
                        }}
                        className={cn(
                            "flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors",
                            sidebarCollapsed && "justify-center"
                        )}
                        title={sidebarCollapsed ? "Sign Out" : ""}
                    >
                        <LogOut className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
                        {!sidebarCollapsed && "Sign Out"}
                    </button>
                </div>
            </div>
        </>
    );
}
