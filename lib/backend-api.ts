/**
 * Backend API Client
 * ==================
 * Unified API client that routes through Next.js API layer.
 * All requests go to /api/* which handles routing based on BACKEND_MODE.
 */

import axios from 'axios';

// API Response Interfaces
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: {
        id: string;
        username: string;
        tier: string;
    };
}

// Always use Next.js API routes as gateway
export const backendApi = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper functions for token management
export const setTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }
};

export const clearTokens = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_credentials'); // Clear legacy auth
    }
};

export const getAccessToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    }
    return null;
};

export const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken');
    }
    return null;
};

/**
 * Extract expiry timestamp from JWT token
 * @returns Expiry time in milliseconds, or null if invalid
 */
export const getTokenExpiry = (): number | null => {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return payload.exp ? payload.exp * 1000 : null; // Convert to ms
    } catch {
        return null;
    }
};

/**
 * Check if the current access token is expired or expiring soon
 * @param bufferMs Buffer time in milliseconds (default: 60 seconds)
 * @returns true if token is expired or expiring within buffer time
 */
export const isTokenExpiringSoon = (bufferMs = 60000): boolean => {
    const expiry = getTokenExpiry();
    if (!expiry) return true; // No token or invalid = treat as expired
    return Date.now() > expiry - bufferMs;
};

/**
 * Check if access token exists and is valid (not expired)
 */
export const hasValidToken = (): boolean => {
    const token = getAccessToken();
    if (!token) return false;
    return !isTokenExpiringSoon(0); // Check if actually expired (no buffer)
};

// Session expired event - components can subscribe to this
let sessionExpiredCallback: (() => void) | null = null;

export const onSessionExpired = (callback: () => void) => {
    sessionExpiredCallback = callback;
};

const notifySessionExpired = () => {
    if (sessionExpiredCallback) {
        sessionExpiredCallback();
    }
};

// Add auth header interceptor
backendApi.interceptors.request.use((config) => {
    // Get access token
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Flag to prevent infinite loops
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Add response interceptor for token refresh
backendApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return backendApi(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                console.log('[Token Refresh] Attempting refresh, has refresh_token:', !!refreshToken);
                if (!refreshToken) {
                    console.log('[Token Refresh] No refresh token found in localStorage');
                    throw new Error('No refresh token available');
                }

                console.log('[Token Refresh] Calling /api/auth/refresh...');
                const response = await axios.post('/api/auth/refresh', {
                    refresh_token: refreshToken
                });

                console.log('[Token Refresh] Refresh successful, got new tokens');
                const { access_token, refresh_token } = response.data;

                setTokens(access_token, refresh_token);
                backendApi.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;

                processQueue(null, access_token);

                // Retry original request
                originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
                return backendApi(originalRequest);

            } catch (err: any) {
                console.error('[Token Refresh] FAILED:', err.message, err.response?.data);
                processQueue(err, null);
                clearTokens();
                // Notify listeners about session expiry (for toast notifications)
                notifySessionExpired();
                // Redirect to login if on client side
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        // Enhanced error logging
        console.error('[Backend API Error]', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.error || error.response?.data?.detail || error.message,
            data: error.response?.data
        });

        return Promise.reject(error);
    }
);

export default backendApi;

