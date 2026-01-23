'use client';

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from '@/components/ui/toast-provider';
import { usePathname } from 'next/navigation';
import { cn } from "@/utils/cn";
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isNexoraDashboard = pathname?.startsWith('/nexora');

    return (
        <ErrorBoundary>
            <AuthGuard>
                <AuthProvider>
                    <div className="flex min-h-screen bg-slate-950">
                        <main className="flex-1 flex flex-col min-w-0">
                            <div className={cn(
                                "flex-1 overflow-x-hidden",
                                isNexoraDashboard ? "" : "container mx-auto p-4 md:p-6"
                            )}>
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
