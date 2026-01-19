'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [showMfaInput, setShowMfaInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, loginWithMfa } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (showMfaInput) {
                // MFA Login Flow
                await loginWithMfa(email, password, mfaToken);
                handleLoginSuccess();
            } else {
                // Initial Login Flow
                const data = await login(email, password);

                if (data.mfa_required) {
                    setShowMfaInput(true);
                    setError('Please enter your MFA code');
                    setLoading(false);
                } else {
                    handleLoginSuccess();
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        console.log('[LoginForm] Login successful, initializing...');

        // Step 1: Initialize MQTT connection and start polling
        const store = useStore.getState();
        console.log('[LoginForm] Connecting to MQTT and starting data fetch...');
        store.connectSocket();

        // Step 2: Trigger initial data fetch
        setTimeout(() => {
            console.log('[LoginForm] Fetching initial data...');
            store.fetchBots();
            store.fetchPortfolio();
            store.fetchTrades();
            store.fetchOrders();
        }, 1000); // Small delay to ensure connection is established

        // Step 3: Determine redirect based on role
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('accessToken') : null;
        let redirectPath = '/';

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64).split('').map(c =>
                        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                    ).join('')
                );
                const payload = JSON.parse(jsonPayload);

                // Check role from token
                const role = payload.role || (payload.roles && payload.roles[0]);

                if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                    redirectPath = '/nexora';
                    console.log('[LoginForm] Admin user detected, redirecting to Nexora Mission Control');
                } else if (role === 'TRADER' || role === 'USER') {
                    redirectPath = '/user/dashboard';
                    console.log('[LoginForm] Trader user detected, redirecting to user dashboard');
                }
            } catch (e) {
                console.error('[LoginForm] Failed to parse token for role:', e);
            }
        }

        console.log(`[LoginForm] Redirecting to ${redirectPath}...`);
        router.push(redirectPath);
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800 shadow-2xl">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {showMfaInput ? 'Security Check' : 'Welcome Back'}
                </h1>
                <p className="text-slate-400">
                    {showMfaInput
                        ? 'Enter the code from your authenticator app'
                        : 'Sign in to your high-frequency trading terminal'}
                </p>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!showMfaInput ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Username</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Authentication Code</label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                            <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-500 transition-all outline-none font-mono tracking-widest text-center text-lg"
                                placeholder="000 000"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between text-sm pt-2">
                    {!showMfaInput && (
                        <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-300">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500" />
                            Remember me
                        </label>
                    )}
                    <Link href="/auth/forgot-password" className="text-blue-500 hover:text-blue-400 font-medium ml-auto">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            {showMfaInput ? 'Verifying...' : 'Signing in...'}
                        </>
                    ) : (
                        showMfaInput ? 'Verify Code' : 'Sign In'
                    )}
                </button>
            </form>

            <div className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-medium">
                    Contact Validation
                </Link>
            </div>
        </div>
    );
}
