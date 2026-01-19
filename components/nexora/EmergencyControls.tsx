'use client';

import { useState } from 'react';
import { AlertTriangle, Power, PauseCircle, PlayCircle, RefreshCw, XCircle } from 'lucide-react';

export default function EmergencyControls() {
    const [showConfirm, setShowConfirm] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const executeAction = async (action: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8888/api/system/${action}`, {
                method: 'POST',
            });
            const data = await response.json();
            alert(`${action} executed successfully`);
        } catch (error) {
            alert(`Failed to execute ${action}: ${error}`);
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
