'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiPlay, FiSquare, FiRefreshCw } from 'react-icons/fi';
import { backendApi } from '@/lib/backend-api';

interface ExperimentReport {
    experiment_id: string;
    status: 'pending' | 'running' | 'completed' | 'cancelled';
    strategy_a_results: {
        pnl: number;
        pnl_pct: number;
        trades: number;
        win_rate: number;
        sharpe: number;
    };
    strategy_b_results: {
        pnl: number;
        pnl_pct: number;
        trades: number;
        win_rate: number;
        sharpe: number;
    };
    winner?: 'a' | 'b' | 'tie';
    statistical_significance?: number;
    runtime_hours?: number;
}

interface Experiment {
    id: string;
    name: string;
    description: string;
    strategy_a: string;
    strategy_b: string;
    allocated_capital: number;
    split_ratio: number;
    duration_hours: number;
    status: 'pending' | 'running' | 'completed' | 'cancelled';
    created_at: string;
    started_at?: string;
}

export default function ExperimentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [experiment, setExperiment] = useState<Experiment | null>(null);
    const [report, setReport] = useState<ExperimentReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [expRes, reportRes] = await Promise.all([
                backendApi.get(`/strategies/experiments/${id}`),
                backendApi.get(`/strategies/experiments/${id}/report`)
            ]);

            setExperiment(expRes.data.experiment || expRes.data);
            setReport(reportRes.data.report || reportRes.data);
        } catch (err) {
            console.error('Error fetching experiment:', err);
            setError(err instanceof Error ? err.message : 'Failed to load experiment');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStart = async () => {
        setActionLoading(true);
        try {
            await backendApi.post(`/strategies/experiments/${id}/start`);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start experiment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStop = async () => {
        setActionLoading(true);
        try {
            await backendApi.post(`/strategies/experiments/${id}/stop`);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to stop experiment');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !experiment) {
        return (
            <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
                <p className="text-red-400">Error: {error || 'Experiment not found'}</p>
                <button
                    onClick={() => router.push('/strategies/experiments')}
                    className="mt-4 text-blue-400 hover:text-blue-300"
                >
                    ← Back to Experiments
                </button>
            </div>
        );
    }

    const capitalA = experiment.allocated_capital * experiment.split_ratio;
    const capitalB = experiment.allocated_capital * (1 - experiment.split_ratio);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/strategies/experiments')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{experiment.name}</h1>
                        <p className="text-slate-400 mt-1">{experiment.description}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                        <FiRefreshCw size={16} />
                        Refresh
                    </button>
                    {experiment.status === 'pending' && (
                        <button
                            onClick={handleStart}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <FiPlay size={16} />
                            )}
                            Start Experiment
                        </button>
                    )}
                    {experiment.status === 'running' && (
                        <button
                            onClick={handleStop}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <FiSquare size={16} />
                            )}
                            Stop Experiment
                        </button>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${experiment.status === 'running' ? 'bg-green-900/50 text-green-400' :
                                experiment.status === 'completed' ? 'bg-blue-900/50 text-blue-400' :
                                    experiment.status === 'cancelled' ? 'bg-red-900/50 text-red-400' :
                                        'bg-gray-900/50 text-gray-400'
                            }`}>
                            {experiment.status.toUpperCase()}
                        </span>
                        {report?.runtime_hours && (
                            <span className="text-gray-400 text-sm">
                                Runtime: {report.runtime_hours.toFixed(1)}h / {experiment.duration_hours}h
                            </span>
                        )}
                    </div>
                    {report?.winner && report.winner !== 'tie' && (
                        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg px-4 py-2">
                            <span className="text-yellow-400 font-medium">
                                🏆 Winner: Strategy {report.winner.toUpperCase()}
                                {report.statistical_significance && ` (p<${report.statistical_significance})`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strategy A */}
                <div className={`bg-gray-900 rounded-xl border ${report?.winner === 'a' ? 'border-yellow-500' : 'border-gray-800'
                    } p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Strategy A</h3>
                        {report?.winner === 'a' && <span className="text-yellow-400">🏆</span>}
                    </div>
                    <p className="text-blue-400 font-mono mb-4">{experiment.strategy_a}</p>
                    <div className="text-sm text-gray-400 mb-4">Capital: ${capitalA.toLocaleString()}</div>

                    {report?.strategy_a_results && (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">PnL</span>
                                <span className={report.strategy_a_results.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    ${report.strategy_a_results.pnl.toFixed(2)} ({report.strategy_a_results.pnl_pct.toFixed(2)}%)
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Trades</span>
                                <span className="text-white">{report.strategy_a_results.trades}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Win Rate</span>
                                <span className="text-white">{(report.strategy_a_results.win_rate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Sharpe Ratio</span>
                                <span className="text-white">{report.strategy_a_results.sharpe.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Strategy B */}
                <div className={`bg-gray-900 rounded-xl border ${report?.winner === 'b' ? 'border-yellow-500' : 'border-gray-800'
                    } p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Strategy B</h3>
                        {report?.winner === 'b' && <span className="text-yellow-400">🏆</span>}
                    </div>
                    <p className="text-purple-400 font-mono mb-4">{experiment.strategy_b}</p>
                    <div className="text-sm text-gray-400 mb-4">Capital: ${capitalB.toLocaleString()}</div>

                    {report?.strategy_b_results && (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">PnL</span>
                                <span className={report.strategy_b_results.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    ${report.strategy_b_results.pnl.toFixed(2)} ({report.strategy_b_results.pnl_pct.toFixed(2)}%)
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Trades</span>
                                <span className="text-white">{report.strategy_b_results.trades}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Win Rate</span>
                                <span className="text-white">{(report.strategy_b_results.win_rate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Sharpe Ratio</span>
                                <span className="text-white">{report.strategy_b_results.sharpe.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts placeholder */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Equity Curve Comparison</h3>
                <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-lg">
                    {experiment.status === 'pending' ? (
                        <p>Start the experiment to see comparison charts</p>
                    ) : (
                        <p>📊 Chart visualization coming soon</p>
                    )}
                </div>
            </div>
        </div>
    );
}
