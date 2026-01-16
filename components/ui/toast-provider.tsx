/**
 * Toast Provider Component
 * =========================
 * Provides toast notifications throughout the app.
 * Uses Sonner for sleek, modern notifications.
 */

'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
    return (
        <SonnerToaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
                style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    color: '#f1f5f9',
                    backdropFilter: 'blur(10px)',
                },
                classNames: {
                    toast: 'group toast',
                    title: 'text-sm font-medium',
                    description: 'text-xs text-slate-400',
                    actionButton: 'bg-blue-600 text-white',
                    cancelButton: 'bg-slate-700 text-white',
                    success: 'border-green-500/30 bg-green-950/50',
                    error: 'border-red-500/30 bg-red-950/50',
                    warning: 'border-yellow-500/30 bg-yellow-950/50',
                    info: 'border-blue-500/30 bg-blue-950/50',
                },
            }}
            richColors
            expand={false}
            closeButton
        />
    );
}

// Re-export toast function for convenience
export { toast } from 'sonner';
