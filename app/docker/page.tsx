'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Container, RefreshCw, Loader2, Play, Square, RotateCcw, Trash2, Terminal, Clock, HardDrive, AlertCircle } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    state: 'running' | 'stopped' | 'exited' | 'created' | 'paused';
    created_at?: string;
    ports?: string;
    cpu_usage?: number;
    memory_usage?: number;
}

export default function DockerPage() {
    const [containers, setContainers] = useState<DockerContainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [selectedContainer, setSelectedContainer] = useState<DockerContainer | null>(null);
    const [logs, setLogs] = useState<string>('');
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchContainers = useCallback(async () => {
        try {
            const response = await backendApi.get('/docker');
            if (response.data?.containers) {
                setContainers(response.data.containers);
                setError(null);
            } else if (response.data?.error) {
                setError(response.data.error);
            }
        } catch (err: any) {
            console.error('[Docker] Failed to fetch:', err);
            setError('Failed to load containers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContainers();
        const interval = setInterval(fetchContainers, 10000);
        return () => clearInterval(interval);
    }, [fetchContainers]);

    const handleAction = async (containerId: string, action: 'start' | 'stop' | 'restart' | 'remove') => {
        setActionInProgress(`${containerId}:${action}`);
        try {
            const response = await backendApi.post('/docker', { containerId, action });
            if (response.data?.success) {
                toast.success(`Container ${action} successful`);
                fetchContainers();
            } else {
                toast.error(response.data?.error || `Failed to ${action} container`);
            }
        } catch (err: any) {
            console.error('[Docker] Action error:', err);
            toast.error(`Failed to ${action} container`);
        } finally {
            setActionInProgress(null);
        }
    };

    const fetchLogs = async (container: DockerContainer) => {
        setSelectedContainer(container);
        setLoadingLogs(true);
        setLogs('');
        try {
            const response = await backendApi.post('/docker', {
                containerId: container.id,
                action: 'logs'
            });
            if (response.data?.data) {
                setLogs(response.data.data);
            }
        } catch (err: any) {
            console.error('[Docker] Logs error:', err);
            setLogs('Failed to fetch logs');
        } finally {
            setLoadingLogs(false);
        }
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case 'running': return 'bg-green-500';
            case 'stopped': case 'exited': return 'bg-red-500';
            case 'paused': return 'bg-yellow-500';
            case 'created': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const runningCount = containers.filter(c => c.state === 'running').length;
    const stoppedCount = containers.filter(c => c.state === 'stopped' || c.state === 'exited').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Container className="h-6 w-6 text-cyan-500" />
                    Docker Containers
                </h1>
                <button
                    onClick={fetchContainers}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            <p className="text-gray-400">
                Manage Docker containers running Hummingbot instances. Start, stop, restart, or view logs for each container.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Total Containers</p>
                    <p className="text-2xl font-bold text-white mt-1">{containers.length}</p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Running</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">{runningCount}</p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Stopped</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">{stoppedCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Containers List */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-medium text-white">Containers</h2>
                        </div>

                        {loading && containers.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-12 text-red-400">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                {error}
                            </div>
                        ) : containers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Container className="h-12 w-12 mb-3 opacity-50" />
                                <p>No containers found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {containers.map((container) => {
                                    const isActionLoading = actionInProgress?.startsWith(container.id);

                                    return (
                                        <div
                                            key={container.id}
                                            className={cn(
                                                "p-4 hover:bg-gray-800/30",
                                                selectedContainer?.id === container.id && "bg-cyan-500/10"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className={cn("w-3 h-3 rounded-full mt-1.5", getStateColor(container.state))} />
                                                    <div>
                                                        <p className="text-white font-medium">{container.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{container.image}</p>
                                                        <p className="text-xs text-gray-600 mt-1">ID: {container.id.substring(0, 12)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {container.state !== 'running' && (
                                                        <button
                                                            onClick={() => handleAction(container.id, 'start')}
                                                            disabled={isActionLoading}
                                                            className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                                            title="Start"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {container.state === 'running' && (
                                                        <button
                                                            onClick={() => handleAction(container.id, 'stop')}
                                                            disabled={isActionLoading}
                                                            className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30"
                                                            title="Stop"
                                                        >
                                                            <Square className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleAction(container.id, 'restart')}
                                                        disabled={isActionLoading}
                                                        className="p-1.5 rounded bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30"
                                                        title="Restart"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => fetchLogs(container)}
                                                        className="p-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                        title="View Logs"
                                                    >
                                                        <Terminal className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(container.id, 'remove')}
                                                        disabled={isActionLoading}
                                                        className="p-1.5 rounded bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-gray-700"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {container.status}
                                                </span>
                                                {container.ports && (
                                                    <span className="flex items-center gap-1">
                                                        <HardDrive className="h-3 w-3" />
                                                        {container.ports}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Logs Panel */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden sticky top-6">
                        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-gray-500" />
                            <h2 className="font-medium text-white">
                                {selectedContainer ? `Logs: ${selectedContainer.name}` : 'Container Logs'}
                            </h2>
                        </div>

                        {selectedContainer ? (
                            loadingLogs ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                </div>
                            ) : (
                                <pre className="p-4 text-xs font-mono text-gray-400 overflow-auto max-h-[400px] whitespace-pre-wrap">
                                    {logs || 'No logs available'}
                                </pre>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Terminal className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">Select a container to view logs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
