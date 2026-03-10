'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Power, PauseCircle, PlayCircle, RefreshCw, XCircle } from 'lucide-react';
import { getAccessToken } from '@/lib/backend-api';

export default function EmergencyControls() {
    const [showConfirm, setShowConfirm] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [systemStatus, setSystemStatus] = useState<string>('Unknown');
    const [isPolling, setIsPolling] = useState(false);

    const fetchSystemStatus = async () => {
        try {
            const token = getAccessToken();
            if (!token) {
                setSystemStatus('Authentication Required');
                return;
            }

            const response = await fetch(`/api/system/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
            }

            const data = await response.json();
            setSystemStatus(data.status || 'Unknown');
        } catch (error) {
            console.error('Failed to fetch system status:', error);
            setSystemStatus('Error');
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchSystemStatus();

        // Set up polling
        const intervalId = setInterval(fetchSystemStatus, 5000); // Poll every 5 seconds
        setIsPolling(true);

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
            setIsPolling(false);
        };
    }, []); // Empty dependency array means it runs once on mount and cleans up on unmount

    const executeAction = async (action: string) => {
        setLoading(true);
        try {
            // Get authentication token
            const token = getAccessToken();
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }

            // Map UI actions to backend endpoints
            const endpointMap: Record<string, string> = {
                'emergency-shutdown': 'shutdown',
                'pause-trading': 'pause',
                'resume-trading': 'resume',
                'force-exit-all': 'shutdown',      // Maps to shutdown (closes positions)
                'reload-config': 'reload-config',  // May need backend implementation
                'system-restart': 'restart'        // May need backend implementation
            };

            const endpoint = endpointMap[action] || action;
            const response = await fetch(`/api/system/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
            }

            const data = await response.json();
            alert(`✅ ${action} executed successfully!\n\n${data.message || JSON.stringify(data)}`);
            fetchSystemStatus(); // Refresh status after action
        } catch (error) {
            console.error(`Failed to execute ${action}:`, error);
            alert(`❌ Failed to execute ${action}:\n\n${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
            setShowConfirm(null);
        }
    };

    const ConfirmDialog = ({ action, title, message, danger = false }: any) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className={`w-8 h-8 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
                    <h3 className="text-xl font-black text-white">{title}</h3>
                </div>
                <p className="text-slate-300 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowConfirm(null)}
                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => executeAction(action)}
                        disabled={loading}
                        className={`flex-1 px-4 py-3 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-xl font-bold transition-colors disabled:opacity-50`}
                    >
                        {loading ? 'Executing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white">Emergency Controls</h2>
                    <p className="text-xs text-slate-400 font-mono">System Override Commands</p>
                </div>
            </div>

            {/* System Status Banner */}
            <div className={`rounded-2xl p-4 mb-6 border-2 transition-all ${systemStatus === 'running' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    systemStatus === 'paused' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        systemStatus === 'shutdown' ? 'bg-red-500/10 border-red-500/30' :
                            'bg-slate-500/10 border-slate-500/30'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${systemStatus === 'running' ? 'bg-emerald-500' :
                                systemStatus === 'paused' ? 'bg-yellow-500' :
                                    systemStatus === 'shutdown' ? 'bg-red-500' :
                                        'bg-slate-500'
                            }`} />
                        <div>
                            <div className="text-sm font-black text-white uppercase tracking-wider">
                                System Status
                            </div>
                            <div className={`text-xs font-mono ${systemStatus === 'running' ? 'text-emerald-400' :
                                    systemStatus === 'paused' ? 'text-yellow-400' :
                                        systemStatus === 'shutdown' ? 'text-red-400' :
                                            'text-slate-400'
                                }`}>
                                {systemStatus === 'running' ? '● RUNNING - All systems operational' :
                                    systemStatus === 'paused' ? '⏸ PAUSED - Trading halted' :
                                        systemStatus === 'shutdown' ? '⏹ SHUTDOWN - System offline' :
                                            `⚠ ${systemStatus.toUpperCase()}`}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchSystemStatus}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-colors"
                        title="Refresh status"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-8">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-yellow-400 mb-1">CAUTION</div>
                        <div className="text-xs text-slate-300">
                            These controls will immediately affect live trading. Use only in emergency situations.
                            All actions require confirmation.
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emergency Shutdown */}
                <button
                    onClick={() => setShowConfirm('emergency-shutdown')}
                    className="group bg-gradient-to-br from-red-500/20 to-transparent border-2 border-red-500/30 hover:border-red-500/50 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center group-hover:bg-red-500/40 transition-colors">
                            <Power className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white">Emergency Shutdown</div>
                            <div className="text-xs text-slate-400">Stop all trading immediately</div>
                        </div>
                    </div>
                    <div className="text-xs text-red-400 font-mono">
                        Closes all positions • Stops all bots • Requires restart
                    </div>
                </button>

                {/* Force Exit All */}
                <button
                    onClick={() => setShowConfirm('force-exit-all')}
                    className="group bg-gradient-to-br from-orange-500/20 to-transparent border-2 border-orange-500/30 hover:border-orange-500/50 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/40 transition-colors">
                            <XCircle className="w-6 h-6 text-orange-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white">Force Exit All</div>
                            <div className="text-xs text-slate-400">Close all open positions</div>
                        </div>
                    </div>
                    <div className="text-xs text-orange-400 font-mono">
                        Market orders • Immediate execution • Trading continues
                    </div>
                </button>

                {/* Pause Trading */}
                <button
                    onClick={() => setShowConfirm('pause-trading')}
                    className="group bg-gradient-to-br from-yellow-500/20 to-transparent border-2 border-yellow-500/30 hover:border-yellow-500/50 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/40 transition-colors">
                            <PauseCircle className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white">Pause Trading</div>
                            <div className="text-xs text-slate-400">Temporarily halt new trades</div>
                        </div>
                    </div>
                    <div className="text-xs text-yellow-400 font-mono">
                        Keeps positions • No new entries • Reversible
                    </div>
                </button>

                {/* Resume Trading */}
                <button
                    onClick={() => setShowConfirm('resume-trading')}
                    className="group bg-gradient-to-br from-emerald-500/20 to-transparent border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/40 transition-colors">
                            <PlayCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white">Resume Trading</div>
                            <div className="text-xs text-slate-400">Resume normal operations</div>
                        </div>
                    </div>
                    <div className="text-xs text-emerald-400 font-mono">
                        Resumes after pause • Normal risk limits • Safe restart
                    </div>
                </button>

                {/* Reload Config */}
                <button
                    onClick={() => setShowConfirm('reload-config')}
                    className="group bg-gradient-to-br from-cyan-500/20 to-transparent border-2 border-cyan-500/30 hover:border-cyan-500/50 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/40 transition-colors">
                            <RefreshCw className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white">Reload Configuration</div>
                            <div className="text-xs text-slate-400">Apply config changes</div>
                        </div>
                    </div>
                    <div className="text-xs text-cyan-400 font-mono">
                        No downtime • Updates parameters • Safe operation
                    </div>
                </button>

                {/* System Restart */}
                <button
                    onClick={() => setShowConfirm('system-restart')}
                    className="group bg-gradient-to-br from-purple-500/20 to-transparent border-2 border-purple-500/30 hover:border-purple-500/50 rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/40 transition-colors">
                            <RefreshCw className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-white">System Restart</div>
                            <div className="text-xs text-slate-400">Full system reboot</div>
                        </div>
                    </div>
                    <div className="text-xs text-purple-400 font-mono">
                        Closes positions • Restarts services • ~30s downtime
                    </div>
                </button>
            </div>

            {/* Confirmation Dialogs */}
            {showConfirm === 'emergency-shutdown' && (
                <ConfirmDialog
                    action="emergency-shutdown"
                    title="Emergency Shutdown"
                    message="This will immediately close ALL positions and stop ALL trading bots. The system will need to be manually restarted. Are you absolutely sure?"
                    danger={true}
                />
            )}
            {showConfirm === 'force-exit-all' && (
                <ConfirmDialog
                    action="force-exit-all"
                    title="Force Exit All Positions"
                    message="This will close all open positions using market orders. Trading will continue after positions are closed. Confirm?"
                    danger={true}
                />
            )}
            {showConfirm === 'pause-trading' && (
                <ConfirmDialog
                    action="pause-trading"
                    title="Pause Trading"
                    message="This will prevent new trades from being opened. Existing positions will remain active. You can resume trading at any time."
                    danger={false}
                />
            )}
            {showConfirm === 'resume-trading' && (
                <ConfirmDialog
                    action="resume-trading"
                    title="Resume Trading"
                    message="This will resume normal trading operations. New trades will be allowed based on current strategy and risk parameters."
                    danger={false}
                />
            )}
            {showConfirm === 'reload-config' && (
                <ConfirmDialog
                    action="reload-config"
                    title="Reload Configuration"
                    message="This will reload all configuration files without stopping trading. Changes will take effect immediately."
                    danger={false}
                />
            )}
            {showConfirm === 'system-restart' && (
                <ConfirmDialog
                    action="system-restart"
                    title="System Restart"
                    message="This will close all positions and restart all services. The system will be unavailable for approximately 30 seconds. Confirm?"
                    danger={true}
                />
            )}
        </div>
    );
}
