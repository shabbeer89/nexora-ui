'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { backendApi } from '@/lib/backend-api';

interface Strategy {
    name: string;
    description: string;
    deployed_version: string | null;
}

export default function NewExperimentPage() {
    const router = useRouter();
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [strategyA, setStrategyA] = useState('');
    const [strategyB, setStrategyB] = useState('');
    const [allocatedCapital, setAllocatedCapital] = useState(10000);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [durationHours, setDurationHours] = useState(24);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await backendApi.get('/strategies');
                setStrategies(response.data.strategies || []);
            } catch (err) {
                console.error('Error fetching strategies:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStrategies();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                name: name.toLowerCase().replace(/\s+/g, '_'),
                description,
                strategy_a: strategyA,
                strategy_b: strategyB,
                allocated_capital: allocatedCapital,
                split_ratio: splitRatio,
                duration_hours: durationHours
            };

            const response = await backendApi.post('/strategies/experiments', payload);

            if (response.data.status === 'success' || response.data.experiment) {
                router.push('/strategies/experiments');
            } else {
                throw new Error(response.data.error || 'Failed to create experiment');
            }
        } catch (err) {
            console.error('Error creating experiment:', err);
            setError(err instanceof Error ? err.message : 'Failed to create experiment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/strategies/experiments')}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create A/B Experiment</h1>
                    <p className="text-slate-400 mt-1">Compare two strategies with controlled testing</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Experiment Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="grid_vs_dca_comparison"
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Testing grid vs DCA strategy on BTC-USDT"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        />
                    </div>
                </div>

                {/* Strategy Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Strategy A (Control)</label>
                        <select
                            value={strategyA}
                            onChange={(e) => setStrategyA(e.target.value)}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        >
                            <option value="">Select strategy...</option>
                            {strategies.map((s) => (
                                <option key={s.name} value={s.name}>
                                    {s.name} {s.deployed_version && `(v${s.deployed_version})`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Strategy B (Variant)</label>
                        <select
                            value={strategyB}
                            onChange={(e) => setStrategyB(e.target.value)}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        >
                            <option value="">Select strategy...</option>
                            {strategies.map((s) => (
                                <option key={s.name} value={s.name} disabled={s.name === strategyA}>
                                    {s.name} {s.deployed_version && `(v${s.deployed_version})`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Capital & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Total Capital ($)</label>
                        <input
                            type="number"
                            value={allocatedCapital}
                            onChange={(e) => setAllocatedCapital(Number(e.target.value))}
                            min={100}
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Duration</label>
                        <select
                            value={durationHours}
                            onChange={(e) => setDurationHours(Number(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        >
                            <option value={6}>6 hours</option>
                            <option value={24}>24 hours</option>
                            <option value={72}>3 days</option>
                            <option value={168}>1 week</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">
                            Split Ratio: {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
                        </label>
                        <input
                            type="range"
                            value={splitRatio}
                            onChange={(e) => setSplitRatio(Number(e.target.value))}
                            min={0.1}
                            max={0.9}
                            step={0.1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Strategy A: ${Math.round(allocatedCapital * splitRatio)}</span>
                            <span>Strategy B: ${Math.round(allocatedCapital * (1 - splitRatio))}</span>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                        type="button"
                        onClick={() => router.push('/strategies/experiments')}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !strategyA || !strategyB || strategyA === strategyB}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        )}
                        Create Experiment
                    </button>
                </div>
            </form>
        </div>
    );
}
