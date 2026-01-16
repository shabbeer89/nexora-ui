"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Settings2, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
    Percent, ArrowUpDown, Save
} from "lucide-react";
import { backendApi } from "@/lib/backend-api";
import { toast } from "sonner";

interface TradingSettingsProps {
    accountName?: string;
    connectorName?: string;
}

export function TradingSettingsPanel({
    accountName = "master_account",
    connectorName = "binance_paper_trade"
}: TradingSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Leverage settings
    const [tradingPair, setTradingPair] = useState("BTC-USDT");
    const [leverage, setLeverage] = useState(10);

    // Position mode settings
    const [positionMode, setPositionMode] = useState<"HEDGE" | "ONEWAY">("ONEWAY");
    const [currentPositionMode, setCurrentPositionMode] = useState<string | null>(null);

    // Fetch current position mode
    const fetchPositionMode = useCallback(async () => {
        setLoading(true);
        try {
            const response = await backendApi.get(
                `/trading/position-mode?account_name=${encodeURIComponent(accountName)}&connector_name=${encodeURIComponent(connectorName)}`
            );
            if (response.data?.position_mode) {
                setCurrentPositionMode(response.data.position_mode);
                setPositionMode(response.data.position_mode);
            }
        } catch (error) {
            console.error("Failed to fetch position mode:", error);
        } finally {
            setLoading(false);
        }
    }, [accountName, connectorName]);

    useEffect(() => {
        fetchPositionMode();
    }, [fetchPositionMode]);

    // Set leverage
    const handleSetLeverage = async () => {
        if (!tradingPair || leverage < 1 || leverage > 125) {
            toast.error("Invalid leverage (must be 1-125)");
            return;
        }

        setSaving(true);
        try {
            await backendApi.post("/trading/leverage", {
                account_name: accountName,
                connector_name: connectorName,
                trading_pair: tradingPair,
                leverage
            });
            toast.success(`Leverage set to ${leverage}x for ${tradingPair}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to set leverage");
        } finally {
            setSaving(false);
        }
    };

    // Set position mode
    const handleSetPositionMode = async () => {
        setSaving(true);
        try {
            await backendApi.post("/trading/position-mode", {
                account_name: accountName,
                connector_name: connectorName,
                position_mode: positionMode
            });
            setCurrentPositionMode(positionMode);
            toast.success(`Position mode set to ${positionMode}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to set position mode");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-white">Trading Settings</h3>
                </div>
                <button
                    onClick={fetchPositionMode}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Leverage Settings */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Percent className="w-4 h-4" />
                        <span className="text-sm font-medium">Leverage</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Trading Pair</label>
                            <input
                                type="text"
                                value={tradingPair}
                                onChange={(e) => setTradingPair(e.target.value)}
                                placeholder="BTC-USDT"
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Leverage (1-125x)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="125"
                                    value={leverage}
                                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-white font-mono text-sm w-12 text-right">{leverage}x</span>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleSetLeverage}
                                disabled={saving}
                                className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Position Mode */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ArrowUpDown className="w-4 h-4" />
                            <span className="text-sm font-medium">Position Mode</span>
                        </div>
                        {currentPositionMode && (
                            <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                                Current: {currentPositionMode}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPositionMode("ONEWAY")}
                            className={`p-4 rounded-lg border text-left transition-all ${positionMode === "ONEWAY"
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-white">One-Way Mode</span>
                                {positionMode === "ONEWAY" && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Single position per symbol. Long or short, not both.
                            </p>
                        </button>
                        <button
                            onClick={() => setPositionMode("HEDGE")}
                            className={`p-4 rounded-lg border text-left transition-all ${positionMode === "HEDGE"
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-white">Hedge Mode</span>
                                {positionMode === "HEDGE" && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Hold long and short positions simultaneously.
                            </p>
                        </button>
                    </div>

                    {positionMode !== currentPositionMode && (
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-yellow-400">
                                Changing position mode requires closing all positions first.
                            </span>
                            <button
                                onClick={handleSetPositionMode}
                                disabled={saving}
                                className="ml-auto px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Saving..." : "Confirm Change"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
