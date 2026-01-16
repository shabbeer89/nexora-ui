'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Archive, RefreshCw, Loader2, Clock, TrendingUp, TrendingDown, Play, Eye, Calendar } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import Link from 'next/link';

interface ArchivedBot {
    bot_id: string;
    bot_name: string;
    strategy?: string;
    connector?: string;
    trading_pair?: string;
    status: string;
    archived_at?: string;
    total_pnl?: number;
    total_trades?: number;
    run_duration?: string;
    start_time?: string;
    end_time?: string;
}

export default function ArchivedBotsPage() {
    const [archivedBots, setArchivedBots] = useState<ArchivedBot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBot, setSelectedBot] = useState<ArchivedBot | null>(null);
    const [botHistory, setBotHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchArchivedBots = useCallback(async () => {
        try {
            const response = await fetch('/api/bots?status=archived', {
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Filter for archived/stopped bots
                const archived = (data.bots || []).filter((b: any) =>
                    b.status === 'archived' || b.status === 'stopped' || b.status === 'exited'
                );
                setArchivedBots(archived);
                setError(null);
            } else {
                setError('Failed to fetch archived bots');
            }
        } catch (err: any) {
            console.error('[ArchivedBots] Failed to fetch:', err);
            setError(err.message || 'Failed to load archived bots');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBotHistory = useCallback(async (botId: string) => {
        setLoadingHistory(true);
        try {
            const response = await fetch(`/api/bots/runs?bot_id=${botId}`, {
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBotHistory(data.runs || []);
            }
        } catch (err: any) {
            console.error('[ArchivedBots] Failed to fetch history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchArchivedBots();
    }, [fetchArchivedBots]);

    const handleSelectBot = (bot: ArchivedBot) => {
        setSelectedBot(bot);
        fetchBotHistory(bot.bot_id);
    };

    const formatDuration = (start?: string, end?: string): string => {
        if (!start) return '-';
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diffMs = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Archive className="h-6 w-6 text-orange-500" />
                    Archived Bots
                </h1>
                <button
                    onClick={fetchArchivedBots}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            <p className="text-gray-400">
                View historical data from bots that have been stopped or archived.
                Analyze past performance and review trading history.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Archived Bots List */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-medium text-white">Archived Bots ({archivedBots.length})</h2>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                            </div>
                        ) : error ? (
                            <div className="p-4 text-red-400 text-sm">{error}</div>
                        ) : archivedBots.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No archived bots found</p>
                                <p className="text-xs mt-1">Stopped bots will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
                                {archivedBots.map((bot) => (
                                    <button
                                        key={bot.bot_id}
                                        onClick={() => handleSelectBot(bot)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50",
                                            selectedBot?.bot_id === bot.bot_id && "bg-orange-500/10 border-l-2 border-orange-500"
                                        )}
                                    >
                                        <div>
                                            <p className="text-white font-medium text-sm">{bot.bot_name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{bot.strategy || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{bot.trading_pair || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {bot.total_pnl !== undefined && (
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    bot.total_pnl >= 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {bot.total_pnl >= 0 ? '+' : ''}{bot.total_pnl.toFixed(2)}%
                                                </p>
                                            )}
                                            <span className="text-xs text-gray-500">{bot.status}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bot Details */}
                <div className="lg:col-span-2">
                    {selectedBot ? (
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedBot.bot_name}</h2>
                                        <p className="text-gray-400 text-sm">{selectedBot.strategy} • {selectedBot.connector}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                                        {selectedBot.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Total P&L</p>
                                        <p className={cn(
                                            "text-lg font-bold mt-1",
                                            (selectedBot.total_pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {(selectedBot.total_pnl || 0) >= 0 ? '+' : ''}{(selectedBot.total_pnl || 0).toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Total Trades</p>
                                        <p className="text-lg font-bold text-white mt-1">
                                            {selectedBot.total_trades || 0}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Run Duration</p>
                                        <p className="text-lg font-bold text-white mt-1">
                                            {formatDuration(selectedBot.start_time, selectedBot.end_time)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Trading Pair</p>
                                        <p className="text-lg font-bold text-white mt-1">
                                            {selectedBot.trading_pair || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Run History */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <h3 className="font-medium text-white">Run History</h3>
                                </div>

                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                    </div>
                                ) : botHistory.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No run history available
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-800">
                                        {botHistory.map((run, idx) => (
                                            <div key={run.id || idx} className="p-4 hover:bg-gray-800/30">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="h-4 w-4 text-gray-500" />
                                                        <div>
                                                            <p className="text-sm text-white">
                                                                {run.start_time ? new Date(run.start_time).toLocaleString() : 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Duration: {formatDuration(run.start_time, run.end_time)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {run.pnl !== undefined && (
                                                            <span className={cn(
                                                                "text-sm font-medium flex items-center gap-1",
                                                                run.pnl >= 0 ? "text-green-500" : "text-red-500"
                                                            )}>
                                                                {run.pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                                {run.pnl >= 0 ? '+' : ''}{run.pnl.toFixed(2)}%
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">
                                                            {run.total_trades || 0} trades
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                <Archive className="h-12 w-12 mb-4 opacity-50" />
                                <p>Select an archived bot to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
