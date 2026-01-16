"use client";

import { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, BarChart2, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RiskSettings {
    // Kill Switch - stops bot when PnL hits threshold
    killSwitchEnabled: boolean;
    killSwitchMode: 'amount' | 'percent';
    killSwitchMaxLoss: number;
    killSwitchMaxProfit?: number;

    // Daily Loss Limit
    dailyLossLimitEnabled: boolean;
    dailyLossLimit: number;

    // Max Drawdown
    maxDrawdownEnabled: boolean;
    maxDrawdownPercent: number;

    // Inventory Skew (for PMM)
    inventorySkewEnabled: boolean;
    inventoryTargetBasePct: number;

    // Position Sizing
    maxPositionSizeEnabled: boolean;
    maxPositionSizeType: 'amount' | 'percent';
    maxPositionSizeValue: number;

    // Order Limits
    maxOpenOrdersEnabled: boolean;
    maxOpenOrdersValue: number;

    // Max Global Exposure (Correlation)
    maxGlobalExposureEnabled: boolean;
    maxGlobalExposureValue: number;
}

interface RiskSettingsFormProps {
    settings: RiskSettings;
    onChange: (settings: RiskSettings) => void;
    strategy?: string;
}

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
    killSwitchEnabled: true,
    killSwitchMode: 'percent',
    killSwitchMaxLoss: 10, // 10% max loss
    killSwitchMaxProfit: undefined,
    dailyLossLimitEnabled: false,
    dailyLossLimit: 100, // $100
    maxDrawdownEnabled: true,
    maxDrawdownPercent: 15, // 15% max drawdown
    inventorySkewEnabled: true,
    inventoryTargetBasePct: 50, // 50% target
    maxPositionSizeEnabled: false,
    maxPositionSizeType: 'amount',
    maxPositionSizeValue: 1000,
    maxOpenOrdersEnabled: false,
    maxOpenOrdersValue: 5,
    maxGlobalExposureEnabled: false,
    maxGlobalExposureValue: 5000,
};

export function RiskSettingsForm({ settings, onChange, strategy }: RiskSettingsFormProps) {
    const updateSetting = <K extends keyof RiskSettings>(key: K, value: RiskSettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6">
            {/* Kill Switch */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Shield className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white">Kill Switch</h4>
                            <p className="text-sm text-slate-400">Auto-stop bot when PnL hits threshold</p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.killSwitchEnabled}
                        onChange={(v) => updateSetting('killSwitchEnabled', v)}
                    />
                </div>

                {settings.killSwitchEnabled && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Mode</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateSetting('killSwitchMode', 'percent')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                        settings.killSwitchMode === 'percent'
                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    )}
                                >
                                    Percentage
                                </button>
                                <button
                                    onClick={() => updateSetting('killSwitchMode', 'amount')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                        settings.killSwitchMode === 'amount'
                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    )}
                                >
                                    Amount ($)
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Max Loss</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.killSwitchMaxLoss}
                                    onChange={(e) => updateSetting('killSwitchMaxLoss', parseFloat(e.target.value) || 0)}
                                    className="w-24 rounded-lg bg-slate-950 border border-slate-800 py-2 px-3 text-white text-center"
                                    min={0}
                                    step={settings.killSwitchMode === 'percent' ? 0.5 : 10}
                                />
                                <span className="text-slate-400">
                                    {settings.killSwitchMode === 'percent' ? '%' : 'USD'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Loss Limit */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white">Daily Loss Limit</h4>
                            <p className="text-sm text-slate-400">Pause trading after daily loss exceeded</p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.dailyLossLimitEnabled}
                        onChange={(v) => updateSetting('dailyLossLimitEnabled', v)}
                    />
                </div>

                {settings.dailyLossLimitEnabled && (
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Max Daily</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={settings.dailyLossLimit}
                                    onChange={(e) => updateSetting('dailyLossLimit', parseFloat(e.target.value) || 0)}
                                    className="w-24 rounded-lg bg-slate-950 border border-slate-800 py-2 px-3 text-white text-center"
                                    min={0}
                                    step={10}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Max Drawdown */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <TrendingDown className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white">Max Drawdown</h4>
                            <p className="text-sm text-slate-400">Stop if loss from peak exceeds %</p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.maxDrawdownEnabled}
                        onChange={(v) => updateSetting('maxDrawdownEnabled', v)}
                    />
                </div>

                {settings.maxDrawdownEnabled && (
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Max %</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.maxDrawdownPercent}
                                    onChange={(e) => updateSetting('maxDrawdownPercent', parseFloat(e.target.value) || 0)}
                                    className="w-24 rounded-lg bg-slate-950 border border-slate-800 py-2 px-3 text-white text-center"
                                    min={1}
                                    max={100}
                                    step={1}
                                />
                                <span className="text-slate-400">%</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {(strategy === 'pmm' || !strategy) && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <BarChart2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Inventory Skew</h4>
                                <p className="text-sm text-slate-400">Balance base/quote inventory ratio</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.inventorySkewEnabled}
                            onChange={(v) => updateSetting('inventorySkewEnabled', v)}
                        />
                    </div>

                    {settings.inventorySkewEnabled && (
                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-4">
                                <label className="text-sm text-slate-400 w-24">Target Base</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        value={settings.inventoryTargetBasePct}
                                        onChange={(e) => updateSetting('inventoryTargetBasePct', parseInt(e.target.value))}
                                        className="w-32"
                                        min={10}
                                        max={90}
                                        step={5}
                                    />
                                    <span className="text-white font-mono w-12 text-center">
                                        {settings.inventoryTargetBasePct}%
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Target {settings.inventoryTargetBasePct}% base / {100 - settings.inventoryTargetBasePct}% quote
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Position Sizing */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Shield className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white">Position Sizing</h4>
                            <p className="text-sm text-slate-400">Limit Max Position Size</p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.maxPositionSizeEnabled}
                        onChange={(v) => updateSetting('maxPositionSizeEnabled', v)}
                    />
                </div>

                {settings.maxPositionSizeEnabled && (
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateSetting('maxPositionSizeType', 'percent')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                        settings.maxPositionSizeType === 'percent'
                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    )}
                                >
                                    % of Equity
                                </button>
                                <button
                                    onClick={() => updateSetting('maxPositionSizeType', 'amount')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                        settings.maxPositionSizeType === 'amount'
                                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    )}
                                >
                                    Fixed Amount
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Max Size</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.maxPositionSizeValue}
                                    onChange={(e) => updateSetting('maxPositionSizeValue', parseFloat(e.target.value) || 0)}
                                    className="w-24 rounded-lg bg-slate-950 border border-slate-800 py-2 px-3 text-white text-center"
                                    min={0}
                                />
                                <span className="text-slate-400">
                                    {settings.maxPositionSizeType === 'percent' ? '%' : 'USD'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Limits */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white">Order Limits</h4>
                            <p className="text-sm text-slate-400">Max Open Orders</p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.maxOpenOrdersEnabled}
                        onChange={(v) => updateSetting('maxOpenOrdersEnabled', v)}
                    />
                </div>
                {settings.maxOpenOrdersEnabled && (
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Max Count</label>
                            <input
                                type="number"
                                value={settings.maxOpenOrdersValue}
                                onChange={(e) => updateSetting('maxOpenOrdersValue', parseInt(e.target.value) || 1)}
                                className="w-24 rounded-lg bg-slate-950 border border-slate-800 py-2 px-3 text-white text-center"
                                min={1}
                                step={1}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Max Global Exposure (Correlation Proxy) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-500/10">
                            <Shield className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-white">Max Correlation Exposure</h4>
                            <p className="text-sm text-slate-400">Limit total value in specific asset class</p>
                        </div>
                    </div>
                    <ToggleSwitch
                        enabled={settings.maxGlobalExposureEnabled}
                        onChange={(v) => updateSetting('maxGlobalExposureEnabled', v)}
                    />
                </div>
                {settings.maxGlobalExposureEnabled && (
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400 w-24">Max Value</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={settings.maxGlobalExposureValue}
                                    onChange={(e) => updateSetting('maxGlobalExposureValue', parseFloat(e.target.value) || 0)}
                                    className="w-24 rounded-lg bg-slate-950 border border-slate-800 py-2 px-3 text-white text-center"
                                    min={0}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Help Note */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 text-sm">
                <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="text-slate-400">
                    <p className="font-medium text-slate-300">Industry-standard risk controls</p>
                    <p className="mt-1">
                        These settings help protect your capital during adverse market conditions.
                        Kill Switch and Max Drawdown are recommended for all strategies.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Toggle Switch Component
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                enabled ? "bg-blue-500" : "bg-slate-700"
            )}
        >
            <div
                className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                    enabled ? "left-6" : "left-0.5"
                )}
            />
        </button>
    );
}
