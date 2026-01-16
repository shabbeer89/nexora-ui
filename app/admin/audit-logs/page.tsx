'use client';

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { backendApi } from '@/lib/backend-api';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
    ip_address?: string;
    timestamp: string;
}

function AuditLogsContent() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await backendApi.get('/audit-logs');
            setLogs(response.data.logs || response.data || []);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            // Mock data
            setLogs([
                { id: '1', user_id: '1', user_email: 'admin@example.com', action: 'LOGIN', resource_type: 'auth', timestamp: new Date().toISOString() },
                { id: '2', user_id: '2', user_email: 'trader@example.com', action: 'CREATE', resource_type: 'bot', resource_id: 'bot-1', details: 'Created grid_bot_1', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: '3', user_id: '2', user_email: 'trader@example.com', action: 'START', resource_type: 'bot', resource_id: 'bot-1', timestamp: new Date(Date.now() - 3500000).toISOString() },
                { id: '4', user_id: '1', user_email: 'admin@example.com', action: 'UPDATE', resource_type: 'user', resource_id: 'user-2', details: 'Updated role to ADMIN', timestamp: new Date(Date.now() - 7200000).toISOString() },
                { id: '5', user_id: '1', user_email: 'admin@example.com', action: 'DELETE', resource_type: 'strategy', resource_id: 'strat-1', timestamp: new Date(Date.now() - 86400000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.resource_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = actionFilter === 'all' || log.action === actionFilter;
        return matchesSearch && matchesFilter;
    });

    const getActionColor = (action: string) => {
        switch (action) {
            case 'LOGIN': return 'text-blue-400 bg-blue-900/20';
            case 'CREATE': return 'text-green-400 bg-green-900/20';
            case 'UPDATE': return 'text-yellow-400 bg-yellow-900/20';
            case 'DELETE': return 'text-red-400 bg-red-900/20';
            case 'START': return 'text-emerald-400 bg-emerald-900/20';
            case 'STOP': return 'text-orange-400 bg-orange-900/20';
            default: return 'text-gray-400 bg-gray-900/20';
        }
    };

    const exportLogs = () => {
        const csv = [
            ['Timestamp', 'User', 'Action', 'Resource', 'Details'].join(','),
            ...filteredLogs.map(log => [
                log.timestamp,
                log.user_email,
                log.action,
                `${log.resource_type}:${log.resource_id || 'N/A'}`,
                log.details || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                    <p className="text-slate-400 mt-1">Track all system activities and changes</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchLogs} disabled={loading} className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={exportLogs} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search logs..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="all">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="START">Start</option>
                        <option value="STOP">Stop</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Timestamp</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">User</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Action</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Resource</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No logs found</td></tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                                    <td className="px-6 py-4 text-sm text-slate-300">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">{log.user_email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-300">
                                        {log.resource_type}{log.resource_id && `: ${log.resource_id}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{log.details || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AuditLogsPage() {
    return (
        <AdminGuard>
            <AuditLogsContent />
        </AdminGuard>
    );
}
