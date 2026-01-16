'use client';

/**
 * AuthProvider - Session Expiry Notification Handler
 * ===================================================
 * Handles session expiry events and shows toast notifications.
 * Does NOT handle auth redirects (that's AuthGuard's job).
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { onSessionExpired, clearTokens } from '@/lib/backend-api';
import { useStore } from '@/store/useStore';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { logout } = useStore();
    const hasShownExpiredToast = useRef(false);

    useEffect(() => {
        // Register callback for when session expires (triggered by 401 interceptor)
        const handleSessionExpired = () => {
            // Prevent multiple toasts
            if (hasShownExpiredToast.current) return;
            hasShownExpiredToast.current = true;

            console.log('[AuthProvider] Session expired, showing toast');

            // Show toast notification with longer duration
            toast.error('Session Expired', {
                description: 'Your session has expired. Please log in again.',
                duration: 8000,
                action: {
                    label: 'Login',
                    onClick: () => window.location.href = '/login'
                }
            });

            // Clean up auth state
            clearTokens();
            logout();

            // Reset toast flag after a delay
            setTimeout(() => {
                hasShownExpiredToast.current = false;
            }, 10000);
        };

        onSessionExpired(handleSessionExpired);
    }, [logout]);

    return <>{children}</>;
}

export default AuthProvider;
