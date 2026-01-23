'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * NexoraDashboard - Legacy Entry Point
 * Now refactored to use standard URL-based routing.
 * This file handles the redirection to the modern industrial-standard routing architecture.
 */
export default function NexoraDashboard() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new multi-page architecture
        router.push('/nexora/overview');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-cyan-500 animate-pulse uppercase tracking-[0.3em]">
                    Initializing Tactical Routing...
                </p>
            </div>
        </div>
    );
}
