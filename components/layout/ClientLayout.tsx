'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useStore } from "@/store/useStore";
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast-provider';
import { usePathname } from 'next/navigation';
import { cn } from "@/utils/cn";
import { Menu } from "lucide-react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, sidebarCollapsed, toggleMobileSidebar } = useStore();
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

    const showSidebar = isAuthenticated && !isAuthPage;

    return (
        <ErrorBoundary>
            <AuthGuard>
                <AuthProvider>
                    <div className="flex min-h-screen bg-slate-950">
                        {showSidebar && <Sidebar />}
                        <main className={cn(
                            "flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0",
                            showSidebar ? (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''
                        )}>
                            {/* Mobile Header */}
                            {showSidebar && (
                                <header className="lg:hidden flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-4 sticky top-0 z-30">
                                    <div className="flex items-center gap-2">
                                        <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                                        <h1 className="text-lg font-bold text-white tracking-tight">
                                            He Bot
                                        </h1>
                                    </div>
                                    <button
                                        onClick={() => toggleMobileSidebar(true)}
                                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Menu className="w-6 h-6" />
                                    </button>
                                </header>
                            )}
                            <div className="flex-1 container mx-auto p-4 md:p-6 overflow-x-hidden">
                                {children}
                            </div>
                        </main>
                    </div>
                    <ToastProvider />
                </AuthProvider>
            </AuthGuard>
        </ErrorBoundary>
    );
}
