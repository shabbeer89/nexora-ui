'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, TrendingUp, TrendingDown, Search, Filter, RefreshCw, X } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface BotRun {
    id: number;
    bot_name: string;
    account_name: string;
    strategy_type: string;
    strategy_name: string;
    run_status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
    deployment_status: string;
    start_time: string;
    end_time?: string;
    total_pnl?: number;
}

interface BotRunStats {
    total_runs: number;
    running: number;
    completed: number;
    failed: number;
    archived: number;
}

export default function BotRunsPage() {
    const [runs, setRuns] = useState<BotRun[]>([]);
    const [stats, setStats] = useState<BotRunStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [strategyFilter, setStrategyFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');

    useEffect(() => {
        fetchBotRuns();
        fetchStats();
    }, []);

    const fetchBotRuns = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/bots/runs?limit=100');
            if (!response.ok) {
                throw new Error('Failed to fetch bot runs');
            }
            const data = await response.json();
            setRuns(data.runs || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/bots/runs/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            const data = await response.json();
            setStats(data);
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
        }
    };

    // Get unique strategies for filter dropdown
    const strategies = useMemo(() => {
        const unique = [...new Set(runs.map(r => r.strategy_name || 'Unknown'))];
        return unique.filter(Boolean).sort();
    }, [runs]);

    // Filter runs
    const filteredRuns = useMemo(() => {
        return runs.filter(run => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!run.bot_name.toLowerCase().includes(search) &&
                    !run.account_name.toLowerCase().includes(search) &&
                    !(run.strategy_name || '').toLowerCase().includes(search)) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== 'all' && run.run_status !== statusFilter) {
                return false;
            }

            // Strategy filter
            if (strategyFilter !== 'all' && (run.strategy_name || 'Unknown') !== strategyFilter) {
                return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const runDate = new Date(run.start_time);
                const now = new Date();

                if (dateFilter === 'today') {
                    if (runDate.toDateString() !== now.toDateString()) return false;
                } else if (dateFilter === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (runDate < weekAgo) return false;
                } else if (dateFilter === 'month') {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (runDate < monthAgo) return false;
                }
            }

            return true;
        });
    }, [runs, searchTerm, statusFilter, strategyFilter, dateFilter]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setStrategyFilter('all');
        setDateFilter('all');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'all' || strategyFilter !== 'all' || dateFilter !== 'all';

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'RUNNING': 'default',
            'COMPLETED': 'outline',
            'FAILED': 'destructive',
            'ARCHIVED': 'secondary',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const formatDuration = (start: string, end?: string) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours}h ${diffMins}m`;
    };

    if (loading && runs.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bot Deployment History</h1>
                    <p className="text-muted-foreground mt-2">
                        Track bot deployments, runs, and performance over time
                    </p>
                </div>
                <Button onClick={fetchBotRuns} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_runs}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Running</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Archived</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filter Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search bot name, account, strategy..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-md border bg-background text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="RUNNING">Running</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                        <select
                            value={strategyFilter}
                            onChange={(e) => setStrategyFilter(e.target.value)}
                            className="px-3 py-2 rounded-md border bg-background text-sm"
                        >
                            <option value="all">All Strategies</option>
                            {strategies.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 rounded-md border bg-background text-sm"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                        Showing {filteredRuns.length} of {runs.length} runs
                    </div>
                </CardContent>
            </Card>

            {/* Bot Runs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Bot Runs</CardTitle>
                    <CardDescription>Complete history of bot deployments and executions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bot Name</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Strategy</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Started</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">PnL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRuns.map((run) => (
                                <TableRow key={run.id}>
                                    <TableCell className="font-medium">{run.bot_name}</TableCell>
                                    <TableCell>{run.account_name}</TableCell>
                                    <TableCell>
                                        <div className="max-w-[200px] truncate">
                                            {run.strategy_name || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(run.run_status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(run.start_time).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Clock className="h-3 w-3" />
                                            {formatDuration(run.start_time, run.end_time)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {run.total_pnl !== undefined ? (
                                            <div className={`flex items-center justify-end gap-1 ${run.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {run.total_pnl >= 0 ? (
                                                    <TrendingUp className="h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3" />
                                                )}
                                                ${Math.abs(run.total_pnl).toFixed(2)}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {runs.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            No bot runs found. Deploy a bot to see its history here.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
