"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { getAccessToken, getRefreshToken, hasValidToken, clearTokens } from '@/lib/backend-api';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/login', '/signup', '/auth/forgot-password'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, login, connectSocket, fetchBots, fetchGroups } = useStore();
    const [mounted, setMounted] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const verifyAuth = async () => {
            const isPublicPath = publicPaths.includes(pathname || '');
            const token = getAccessToken();
            const refreshToken = getRefreshToken();

            // If we are on a public path, we don't need to check auth strongly,
            // but if we are already logged in, we might want to redirect to dashboard
            if (isPublicPath) {
                if (token && isAuthenticated) {
                    router.push('/');
                }
                setIsVerifying(false);
                return;
            }

            // If not authenticated (no token), redirect to login
            // We also check if the token is actually valid (not expired)
            if (!hasValidToken()) {
                // Using hasValidToken checks expiration too
                // If invalid/expired, we should treat as unauthenticated
                if (token) {
                    console.log('[AuthGuard] Token found but expired or invalid');
                    clearTokens(); // Cleanup stale token
                }
                router.push('/login');
                setIsVerifying(false);
                return;
            }

            // If we have token but state says not authenticated, try to restore session
            if (!isAuthenticated && token) {
                try {
                    const userEmail = extractEmailFromToken(token);
                    login({
                        id: userEmail,
                        email: userEmail,
                        name: userEmail.split('@')[0]
                    });
                } catch (e) {
                    console.error('Session restore failed', e);
                }
            }

            setIsVerifying(false);
        };

        verifyAuth();
    }, [pathname, router, mounted, isAuthenticated, login]);

    // Global initialization effect
    useEffect(() => {
        if (mounted && isAuthenticated && !publicPaths.includes(pathname || '')) {
            console.log('[AuthGuard] 🚀 Global Init: Connecting socket and fetching bots/groups');
            connectSocket();
            fetchBots();
            fetchGroups();
        }
    }, [mounted, isAuthenticated, pathname, connectSocket, fetchBots, fetchGroups]);

    // Helper to extract email from JWT
    const extractEmailFromToken = (token: string): string => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).sub || 'user@example.com';
        } catch (e) {
            return 'user@example.com';
        }
    };

    if (!mounted || isVerifying) {
        // Show loading spinner while verifying auth state
        if (!publicPaths.includes(pathname || '')) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-950">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            );
        }
    }

    // If on public path, render children regardless of auth status (login page handles its own redirect if needed)
    if (publicPaths.includes(pathname || '')) {
        return <>{children}</>;
    }

    // If authenticated, render children
    // If not authenticated but logic hasn't redirected yet (rare race condition), render null
    // If authenticated, render children
    // If not authenticated (no token), we show a loading state while the redirection happens.
    // This prevents the "flash of white/null" that the user sees.
    const token = typeof window !== 'undefined' ? getAccessToken() : null;
    if (!token && !isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="text-slate-400 text-sm">Session expired. Redirecting to login...</p>
            </div>
        );
    }

    return <>{children}</>;
}
