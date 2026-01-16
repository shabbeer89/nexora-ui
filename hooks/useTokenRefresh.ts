/**
 * Token refresh hook for h-bot-ui
 *
 * Automatically refreshes JWT tokens before expiry.
 */


import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes (tokens expire in 30)
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check every minute

export function useTokenRefresh() {
    const refreshInterval = useRef<NodeJS.Timeout | null>(null);
    const { isAuthenticated, user, logout } = useStore();

    useEffect(() => {
        if (!isAuthenticated) {
            // Clear interval if user is not authenticated
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
                refreshInterval.current = null;
            }
            return;
        }

        // Function to refresh token
        const refreshToken = async () => {
            try {
                const refresh_token = localStorage.getItem('refresh_token');
                if (!refresh_token) {
                    console.warn('⚠️ No refresh token found');
                    logout();
                    return;
                }

                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token }),
                });

                if (!response.ok) {
                    throw new Error('Token refresh failed');
                }

                const data = await response.json();

                // Store both tokens
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                    console.log('✅ Access token refreshed successfully');
                }
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                    console.log('✅ Refresh token updated');
                }
            } catch (error) {
                console.error('❌ Token refresh failed:', error);

                // Clear tokens silently (refresh token likely expired)
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                // Redirect to login if not already there
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        };

        // Check token expiry and refresh if needed
        const checkAndRefreshToken = async () => {
            const token = localStorage.getItem('access_token');

            if (!token) {
                // No token, but don't force logout - user might be on login page
                return;
            }

            try {
                // Decode token to check expiry (without verification)
                const payload = JSON.parse(atob(token.split('.')[1]));
                const expiresAt = payload.exp * 1000; // Convert to milliseconds
                const now = Date.now();
                const timeUntilExpiry = expiresAt - now;

                // If token has already expired or expires in less than 5 minutes, try refresh
                if (timeUntilExpiry < 5 * 60 * 1000) {
                    console.log('🔄 Token expiring soon, refreshing...');
                    await refreshToken();
                }
            } catch (error) {
                console.error('Failed to decode token:', error);
                // Don't force logout on decode errors - might just be invalid format
            }
        };

        // Initial check
        checkAndRefreshToken();

        // Set up periodic check
        refreshInterval.current = setInterval(checkAndRefreshToken, TOKEN_CHECK_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [isAuthenticated, logout]);
}
