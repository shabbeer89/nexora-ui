/**
 * useAuth Hook with Role-Based Access Control & Automatic Token Refresh
 * ===================================================================
 * Provides auth state, role checking, permissions, and handles token lifecycle.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getAccessToken, setTokens } from '@/lib/backend-api';

// Role hierarchy (higher index = more permissions)
export const ROLES = ['VIEWER', 'TRADER', 'ADMIN', 'SUPER_ADMIN'] as const;
export type UserRole = typeof ROLES[number];

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    organizationId?: string;
    organizationName?: string;
    scopes?: string[]; // Added scopes from JWT
}

interface UseAuthReturn {
    user: AuthUser | null;
    isAuthenticated: boolean;
    role: UserRole | null;
    organizationId: string | null;

    // Role checks
    isViewer: boolean;
    isTrader: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;

    // Permission helpers
    hasRole: (requiredRole: UserRole) => boolean;
    hasAnyRole: (roles: UserRole[]) => boolean;
    canControlBots: boolean;    // Start/Stop/Pause
    canConfigureSystem: boolean; // Edit configs
    canAccessAdmin: boolean;
    canManageUsers: boolean;
    canManageOrganizations: boolean;

    // Actions
    login: (username: string, password: string) => Promise<any>;
    loginWithMfa: (username: string, password: string, mfaToken: string) => Promise<any>;
    logout: () => void;
    refreshAccessToken: () => Promise<string>;
}

// Singleton to prevent multiple refresh attempts across hook instances
let refreshPromise: Promise<string> | null = null;

/**
 * Extract user info from JWT token
 */
function parseToken(token: string): Partial<AuthUser> | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        const payload = JSON.parse(jsonPayload);

        // Handle both 'role' (string) and 'roles' (array) from JWT
        let role: UserRole = 'VIEWER';
        if (payload.role) {
            role = payload.role as UserRole;
        } else if (payload.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
            // Use first role from array, map common variants
            const firstRole = payload.roles[0].toUpperCase();
            if (firstRole === 'ADMIN' || firstRole === 'SUPER_ADMIN') {
                role = firstRole as UserRole;
            } else if (firstRole === 'TRADER' || firstRole === 'USER') {
                role = 'TRADER';
            } else {
                role = 'VIEWER';
            }
        }

        return {
            id: payload.sub || payload.user_id,
            email: payload.sub || payload.email,
            name: payload.name || (payload.sub?.split('@')[0] || 'User'),
            role: role,
            organizationId: payload.org_id || payload.organization_id,
            organizationName: payload.org_name || payload.organization_name
        };
    } catch {
        return null;
    }
}

/**
 * useAuth - Role-based authentication hook with Auto-Refresh
 */
export function useAuth(): UseAuthReturn {
    const { isAuthenticated, user, login: storeLogin, logout: storeLogout } = useStore();

    // Memoize auth user from store or token
    const authUser = useMemo<AuthUser | null>(() => {
        if (typeof window === 'undefined') return null;

        // Start with store user
        if (user && isAuthenticated) {
            // If store user is missing details, try to parse token to fill gaps?
            // But existing logic preferred token parsing always? 
            // Let's stick to existing logic: parse token if available, merge with store.
            const token = getAccessToken();
            // If no token but store says authenticated, we might be in inconsistent state, but let's trust store for now or token.
        }

        const token = getAccessToken();
        if (!token) return null;

        const parsed = parseToken(token);
        if (!parsed) return null;

        return {
            id: parsed.id || user?.id || '',
            email: parsed.email || user?.email || '',
            name: parsed.name || user?.name || 'User',
            role: parsed.role || 'TRADER',
            organizationId: parsed.organizationId,
            organizationName: parsed.organizationName
        };
    }, [isAuthenticated, user]);

    // Role calculations
    const role = authUser?.role || null;
    const roleIndex = role ? ROLES.indexOf(role) : -1;

    const hasRole = useCallback((requiredRole: UserRole): boolean => {
        if (!role) return false;
        const requiredIndex = ROLES.indexOf(requiredRole);
        return roleIndex >= requiredIndex;
    }, [role, roleIndex]);

    const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
        if (!role) return false;
        return roles.includes(role);
    }, [role]);

    // --- Token Refresh Logic ---

    const logout = useCallback(() => {
        storeLogout();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
        console.log('[Auth] Logged out');
    }, [storeLogout]);

    const refreshAccessToken = useCallback(async (): Promise<string> => {
        // Prevent duplicate refresh requests
        if (refreshPromise) {
            return refreshPromise;
        }

        refreshPromise = (async () => {
            try {
                const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                console.log('[Auth] Refreshing access token...');

                // Use Next.js API proxy instead of direct localhost:8000
                // Match existing pattern from backend-api.ts or use direct if instructed?
                // Instructions used 'http://localhost:8000/auth/refresh'. 
                // BUT current app uses '/api' proxy (backend-api.ts).
                // I should use '/api/auth/refresh' to be safe with Docker/Production routing.

                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });

                if (!response.ok) {
                    throw new Error('Token refresh failed');
                }

                const data = await response.json();
                const newAccessToken = data.access_token;

                // Update storage
                // Support both naming conventions for compatibility
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', newAccessToken);
                    localStorage.setItem('access_token', newAccessToken);
                    if (data.refresh_token) {
                        localStorage.setItem('refreshToken', data.refresh_token);
                        localStorage.setItem('refresh_token', data.refresh_token);
                    }
                }

                // Emit event for WebSocket to reconnect
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('tokenRefreshed', {
                        detail: { accessToken: newAccessToken }
                    }));
                }

                console.log('[Auth] ✅ Token refreshed successfully');

                return newAccessToken;
            } catch (error) {
                console.error('[Auth] Token refresh failed:', error);
                // Force logout on refresh failure
                logout();
                throw error;
            } finally {
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    }, [logout]);

    const login = useCallback(async (username: string, password: string) => {
        try {
            // Use /api proxy
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: formData // Use form data for OAuth2 compliance as per LoginForm
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();

            // If MFA required, return data without setting tokens yet
            if (data.mfa_required) {
                return data;
            }

            // Save tokens
            setTokens(data.access_token, data.refresh_token);

            // Update Store
            const parsed = parseToken(data.access_token);
            const userObj = {
                id: parsed?.id || username,
                email: parsed?.email || username,
                name: parsed?.name || username
            };
            storeLogin(userObj);

            console.log('[Auth] ✅ Login successful');
            return data;

        } catch (error) {
            console.error('[Auth] Login error:', error);
            throw error;
        }
    }, [storeLogin]);

    const loginWithMfa = useCallback(async (username: string, password: string, mfaToken: string) => {
        try {
            const response = await fetch('/api/auth/login/mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, mfa_token: mfaToken })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'MFA Login failed');
            }

            const data = await response.json();

            // Save tokens
            setTokens(data.access_token, data.refresh_token);

            // Update Store
            const parsed = parseToken(data.access_token);
            const userObj = {
                id: parsed?.id || username,
                email: parsed?.email || username,
                name: parsed?.name || username
            };
            storeLogin(userObj);

            console.log('[Auth] ✅ MFA Login successful');
            return data;
        } catch (error) {
            console.error('[Auth] MFA Login error:', error);
            throw error;
        }
    }, [storeLogin]);


    // Automatic refresh interval (25 minutes for 30-minute token)
    useEffect(() => {
        const refreshToken = typeof window !== 'undefined' ? (localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token')) : null;
        if (!refreshToken) return;

        // Refresh token 5 minutes before expiry
        const refreshIntervalMs = (30 - 5) * 60 * 1000; // 25 minutes

        const intervalId = setInterval(() => {
            refreshAccessToken().catch(err => {
                console.error('[Auth] Scheduled refresh failed:', err);
            });
        }, refreshIntervalMs);

        // Also refresh on tab visibility change (user returns to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
                if (accessToken) {
                    try {
                        const payload = JSON.parse(atob(accessToken.split('.')[1]));
                        const expiresIn = payload.exp * 1000 - Date.now();
                        // Refresh if less than 10 minutes remaining
                        if (expiresIn < 10 * 60 * 1000) {
                            refreshAccessToken();
                        }
                    } catch (e) {
                        console.error('[Auth] Failed to decode token:', e);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshAccessToken, isAuthenticated]); // Re-run if auth state changes

    return {
        user: authUser,
        isAuthenticated: isAuthenticated && !!authUser,
        role,
        organizationId: authUser?.organizationId || null,

        // Role checks
        isViewer: role === 'VIEWER',
        isTrader: role === 'TRADER',
        isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
        isSuperAdmin: role === 'SUPER_ADMIN',

        // Permission helpers
        hasRole,
        hasAnyRole,
        canControlBots: role === 'TRADER' || role === 'ADMIN' || role === 'SUPER_ADMIN',
        canConfigureSystem: role === 'ADMIN' || role === 'SUPER_ADMIN',
        canAccessAdmin: hasRole('ADMIN'),
        canManageUsers: hasRole('ADMIN'),
        canManageOrganizations: role === 'SUPER_ADMIN',

        // Actions
        login,
        loginWithMfa,
        logout,
        refreshAccessToken
    };
}
