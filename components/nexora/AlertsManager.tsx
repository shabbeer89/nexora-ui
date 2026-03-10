'use client';

import { useState, useEffect } from 'react';
import { Send, MessageSquare, Mail, Bell, CheckCircle, XCircle } from 'lucide-react';

interface AlertConfig {
    telegram: { enabled: boolean; bot_token: string; chat_id: string; status: string };
    discord: { enabled: boolean; webhook_url: string; status: string };
    email: { enabled: boolean; smtp_host: string; from_email: string; to_emails: string[]; status: string };
}

interface AlertHistory {
    id: string;
    type: string;
    channel: string;
    message: string;
    timestamp: string;
    status: string;
}

export default function AlertsManager() {
    const [config, setConfig] = useState<AlertConfig | null>(null);
    const [history, setHistory] = useState<AlertHistory[]>([]);
    const [testing, setTesting] = useState<string | null>(null);

    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/alerts/config');
            const data = await response.json();
            setConfig(data);
        } catch (error) {
            console.error('Failed to fetch config:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/alerts/history');
            const data = await response.json();
            setHistory(data.alerts || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchHistory();
    }, []);

    const testAlert = async (channel: string) => {
        setTesting(channel);
        try {
            await fetch(`/api/alerts/test/${channel}`, {
                method: 'POST',
            });
            alert(`Test ${channel} alert sent!`);
            fetchHistory();
        } catch (error) {
            alert(`Failed to send test ${channel} alert`);
        } finally {
            setTesting(null);
        }
    };

    const toggleChannel = async (channel: string, enabled: boolean) => {
        try {
            await fetch(`/api/alerts/config/${channel}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });
            fetchConfig();
        } catch (error) {
            alert(`Failed to update ${channel} config`);
        }
    };

    if (!config) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-slate-800 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-cyan-400" />
                        Alerts Manager
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Multi-Channel Notification System
                    </p>
                </div>
            </div>

            {/* Alert Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Telegram */}
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Send className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">Telegram</div>
                                <div className="text-xs text-slate-400">Real-time alerts</div>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${config?.telegram?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Status</div>
                            <div className={`text-sm font-bold ${config?.telegram?.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {config?.telegram?.status || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Chat ID</div>
                            <div className="text-sm font-mono text-white">{config?.telegram?.chat_id || 'Not configured'}</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => toggleChannel('telegram', !config?.telegram?.enabled)}
                            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${config?.telegram?.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}
                        >
                            {config?.telegram?.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                            onClick={() => testAlert('telegram')}
                            disabled={testing === 'telegram'}
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-bold text-sm border border-blue-500/30 transition-colors disabled:opacity-50"
                        >
                            {testing === 'telegram' ? 'Sending...' : 'Test'}
                        </button>
                    </div>
                </div>

                {/* Discord */}
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">Discord</div>
                                <div className="text-xs text-slate-400">Webhook notifications</div>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${config?.discord?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Status</div>
                            <div className={`text-sm font-bold ${config?.discord?.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {config?.discord?.status || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Webhook</div>
                            <div className="text-sm font-mono text-white truncate">{config?.discord?.webhook_url || 'Not configured'}</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => toggleChannel('discord', !config?.discord?.enabled)}
                            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${config?.discord?.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}
                        >
                            {config?.discord?.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                            onClick={() => testAlert('discord')}
                            disabled={testing === 'discord'}
                            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-bold text-sm border border-purple-500/30 transition-colors disabled:opacity-50"
                        >
                            {testing === 'discord' ? 'Sending...' : 'Test'}
                        </button>
                    </div>
                </div>

                {/* Email */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">Email</div>
                                <div className="text-xs text-slate-400">Daily summaries</div>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${config?.email?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Status</div>
                            <div className={`text-sm font-bold ${config?.email?.status === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {config?.email?.status || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Recipients</div>
                            <div className="text-sm font-mono text-white">{config?.email?.to_emails?.length || 0} configured</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => toggleChannel('email', !config?.email?.enabled)}
                            className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${config?.email?.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}
                        >
                            {config?.email?.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                            onClick={() => testAlert('email')}
                            disabled={testing === 'email'}
                            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-bold text-sm border border-cyan-500/30 transition-colors disabled:opacity-50"
                        >
                            {testing === 'email' ? 'Sending...' : 'Test'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert History */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                    Recent Alerts ({history.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {history.slice(0, 20).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.status === 'sent' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {alert.status === 'sent' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-cyan-400 uppercase">{alert.channel}</span>
                                    <span className="text-xs text-slate-500">•</span>
                                    <span className="text-xs text-slate-400">{alert.type}</span>
                                </div>
                                <div className="text-sm text-white truncate">{alert.message}</div>
                                <div className="text-xs text-slate-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
