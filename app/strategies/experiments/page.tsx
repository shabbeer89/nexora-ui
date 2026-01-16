'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiRefreshCw, FiPlay, FiSquare } from 'react-icons/fi';
import { backendApi } from '@/lib/backend-api';

interface Experiment {
    id: string;
    name: string;
    description: string;
    strategy_a: string;
    strategy_b: string;
    status: 'pending' | 'running' | 'completed' | 'cancelled';
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

export default function ExperimentsPage() {
    const router = useRouter();
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchExperiments = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await backendApi.get('/strategies/experiments');
            setExperiments(response.data.experiments || []);
        } catch (err) {
            console.error('Error fetching experiments:', err);
            setError(err instanceof Error ? err.message : 'Failed to load experiments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiments();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'text-green-400 bg-green-900/20';
            case 'completed': return 'text-blue-400 bg-blue-900/20';
            case 'cancelled': return 'text-red-400 bg-red-900/20';
            default: return 'text-gray-400 bg-gray-900/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">A/B Experiments</h1>
                    <p className="text-slate-400 mt-1">
                        Compare strategy performance with controlled experiments
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchExperiments}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => router.push('/strategies/experiments/new')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FiPlus />
                        New Experiment
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
                <button
                    onClick={() => router.push('/strategies')}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white"
                >
                    All Strategies
                </button>
                <button className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white">
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
            {!loading && !error && experiments.length === 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
                    <p className="text-gray-400 text-lg mb-4">No experiments found</p>
                    <p className="text-gray-500 mb-6">
                        Create your first A/B experiment to compare strategy performance
                    </p>
                    <button
                        onClick={() => router.push('/strategies/experiments/new')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <FiPlus />
                        Create Experiment
                    </button>
                </div>
            )}

            {/* Experiments List */}
            {!loading && !error && experiments.length > 0 && (
                <div className="space-y-4">
                    {experiments.map((experiment) => (
                        <div
                            key={experiment.id}
                            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-blue-600 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {experiment.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {experiment.description}
                                    </p>
                                </div>

                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                                    {experiment.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="text-xs text-gray-400 mb-1">Strategy A</div>
                                    <div className="text-white font-medium">{experiment.strategy_a}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="text-xs text-gray-400 mb-1">Strategy B</div>
                                    <div className="text-white font-medium">{experiment.strategy_b}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                <div className="text-sm text-gray-400">
                                    Created {new Date(experiment.created_at).toLocaleDateString()}
                                </div>

                                <button
                                    onClick={() => router.push(`/strategies/experiments/${experiment.id}`)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    View Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
