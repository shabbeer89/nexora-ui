'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary
 * Wraps the entire Nexora layout so a single component crash
 * doesn't whitepage the entire app.
 */
export default class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
        // TODO: Send to Sentry when configured
        // captureException(error, { extra: info });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#020617] flex items-center justify-center p-8">
                    <div className="max-w-lg w-full bg-slate-900/60 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-10 text-center shadow-[0_0_60px_rgba(239,68,68,0.1)]">
                        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>

                        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                            Component Error
                        </h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                            A component crashed. The rest of the system is unaffected.
                        </p>

                        {this.state.error && (
                            <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-6 text-left overflow-auto max-h-32">
                                <code className="text-[10px] font-mono text-rose-300/80 break-all whitespace-pre-wrap">
                                    {this.state.error.message}
                                </code>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={this.handleReset}
                                aria-label="Retry loading this component"
                                className="flex items-center gap-2 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                            <button
                                onClick={() => window.location.replace('/nexora/overview')}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Go to Overview
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
