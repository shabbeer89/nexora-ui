"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Shield, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
    AlertOctagon, Activity, RotateCcw, XCircle
} from "lucide-react";
import { backendApi } from "@/lib/backend-api";
import { toast } from "sonner";

interface GuardianStatus {
    active: boolean;
    circuit_breaker_triggered: boolean;
    last_check?: string;
    monitored_bots?: number;
    alerts?: Array<{
        level: string;
        message: string;
        timestamp: string;
    }>;
}

export function RiskGuardianPanel() {
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [status, setStatus] = useState<GuardianStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await backendApi.get("/risk/guardian");
            setStatus(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to fetch Guardian status");
            // Set mock status for display purposes
            setStatus({
                active: true,
                circuit_breaker_triggered: false,
                monitored_bots: 0
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleResetCircuitBreaker = async () => {
        if (!confirm("Are you sure you want to reset the circuit breaker? This will resume all trading operations.")) {
            return;
        }

        setResetting(true);
        try {
            await backendApi.post("/risk/guardian", { action: "reset_circuit_breaker" });
            toast.success("Circuit breaker reset successfully");
            await fetchStatus();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reset circuit breaker");
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-white">Risk Guardian</h3>
                </div>
                <div className="flex items-center gap-2">
                    {status?.active && (
                        <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Active
                        </span>
                    )}
                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {loading && !status ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                ) : (
                    <>
                        {/* Circuit Breaker Status */}
                        <div className={`p-4 rounded-lg border ${status?.circuit_breaker_triggered
                                ? "bg-red-500/10 border-red-500/30"
                                : "bg-green-500/10 border-green-500/30"
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {status?.circuit_breaker_triggered ? (
                                        <AlertOctagon className="w-6 h-6 text-red-500" />
                                    ) : (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    )}
                                    <div>
                                        <p className={`font-medium ${status?.circuit_breaker_triggered ? "text-red-400" : "text-green-400"
                                            }`}>
                                            Circuit Breaker: {status?.circuit_breaker_triggered ? "TRIGGERED" : "Normal"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {status?.circuit_breaker_triggered
                                                ? "Trading halted due to risk threshold breach"
                                                : "All systems operating normally"
                                            }
                                        </p>
                                    </div>
                                </div>

                                {status?.circuit_breaker_triggered && (
                                    <button
                                        onClick={handleResetCircuitBreaker}
                                        disabled={resetting}
                                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {resetting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RotateCcw className="w-4 h-4" />
                                        )}
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-slate-500">Monitored Bots</p>
                                <p className="text-xl font-bold text-white mt-1">
                                    {status?.monitored_bots ?? 0}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-slate-500">Status</p>
                                <p className={`text-xl font-bold mt-1 ${status?.active ? "text-green-400" : "text-slate-500"}`}>
                                    {status?.active ? "Active" : "Inactive"}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-slate-500">Last Check</p>
                                <p className="text-sm font-medium text-white mt-1">
                                    {status?.last_check
                                        ? new Date(status.last_check).toLocaleTimeString()
                                        : "N/A"
                                    }
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <p className="text-xs text-slate-500">Active Alerts</p>
                                <p className="text-xl font-bold text-white mt-1">
                                    {status?.alerts?.length ?? 0}
                                </p>
                            </div>
                        </div>

                        {/* Alerts */}
                        {status?.alerts && status.alerts.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-400">Recent Alerts</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {status.alerts.map((alert, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg flex items-start gap-3 ${alert.level === "critical"
                                                    ? "bg-red-500/10 border border-red-500/20"
                                                    : alert.level === "warning"
                                                        ? "bg-yellow-500/10 border border-yellow-500/20"
                                                        : "bg-slate-800/50"
                                                }`}
                                        >
                                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.level === "critical" ? "text-red-500" :
                                                    alert.level === "warning" ? "text-yellow-500" : "text-slate-500"
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white">{alert.message}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(alert.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
