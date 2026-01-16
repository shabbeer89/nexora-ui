'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import { backendApi } from '@/lib/backend-api';

interface Strategy {
    name: string;
    description: string;
    deployed_version: string | null;
    total_versions: number;
    created_at: string;
}

export default function StrategiesPage() {
    const router = useRouter();
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStrategies = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await backendApi.get('/strategies');
            setStrategies(response.data.strategies || []);
        } catch (err) {
            console.error('Error fetching strategies:', err);
            setError(err instanceof Error ? err.message : 'Failed to load strategies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategies();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Strategy Library</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your trading strategies with versioning and A/B testing
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchStrategies}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => router.push('/strategies/new')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FiPlus />
                        New Strategy
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
                <button className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white">
                    All Strategies
                </button>
                <button
                    onClick={() => router.push('/strategies/experiments')}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white"
                >
                    A/B Experiments
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && strategies.length === 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
                    <p className="text-gray-400 text-lg mb-4">No strategies found</p>
                    <p className="text-gray-500 mb-6">Create your first strategy to get started</p>
                    <button
                        onClick={() => router.push('/strategies/new')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <FiPlus />
                        Create Strategy
                    </button>
                </div>
            )}

            {/* Strategies Grid */}
            {!loading && !error && strategies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {strategies.map((strategy) => (
                        <div
                            key={strategy.name}
                            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-blue-600 transition-colors cursor-pointer"
                            onClick={() => router.push(`/strategies/${strategy.name}`)}
                        >
                            {/* Strategy Name */}
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {strategy.name}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {strategy.description || 'No description'}
                            </p>

                            {/* Status */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {strategy.deployed_version ? (
                                        <>
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                            <span className="text-sm text-green-400">
                                                Deployed: v{strategy.deployed_version}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                            <span className="text-sm text-gray-400">Not deployed</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Versions */}
                            <div className="pt-4 border-t border-gray-800">
                                <div className="text-sm text-gray-400">
                                    {strategy.total_versions} version{strategy.total_versions !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
