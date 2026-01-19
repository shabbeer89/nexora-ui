'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Info, LayoutGrid, List } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DynamicConfigEditorProps {
    botId: string;
    initialConfig: Record<string, any>;
    onUpdate?: () => void;
    isRunning?: boolean;
}

export default function DynamicConfigEditor({ botId, initialConfig, onUpdate, isRunning }: DynamicConfigEditorProps) {
    const [config, setConfig] = useState<Record<string, any>>(initialConfig);
    const [originalConfig, setOriginalConfig] = useState<Record<string, any>>(initialConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    useEffect(() => {
        setConfig(initialConfig);
        setOriginalConfig(initialConfig);
        setIsDirty(false);
    }, [initialConfig]);

    const handleInputChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        // Check if actually dirty
        const isNowDirty = JSON.stringify(newConfig) !== JSON.stringify(originalConfig);
        setIsDirty(isNowDirty);
    };

    const handleSave = async () => {
        if (!isDirty) return;

        setIsSaving(true);
        try {
            await backendApi.patch(`/bots/${botId}/config`, { config });
            setOriginalConfig(config);
            setIsDirty(false);
            toast.success('Configuration updated successfully');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Failed to update config:', error);
            toast.error(error.response?.data?.detail || 'Failed to update configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setConfig(originalConfig);
        setIsDirty(false);
    };

    const isNumeric = (val: any) => !isNaN(parseFloat(val)) && isFinite(val);

    const renderInput = (key: string, value: any) => {
        const type = typeof value;

        if (type === 'boolean') {
            return (
                <button
                    onClick={() => handleInputChange(key, !value)}
                    className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        value ? "bg-blue-600" : "bg-slate-700"
                    )}
                >
                    <span className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        value ? "translate-x-5" : "translate-x-1"
                    )} />
                </button>
            );
        }

        if (isRunning && key.toLowerCase().includes('pair')) {
            // Usually pairs shouldn't be edited while running
            return <span className="text-slate-400 font-mono text-sm">{String(value)}</span>;
        }

        if (type === 'number' || isNumeric(value)) {
            return (
                <input
                    type="number"
                    value={value}
                    step="any"
                    onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none font-mono"
                />
            );
        }

        return (
            <input
                type="text"
                value={String(value)}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none font-mono"
            />
        );
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-500" />
                        Dynamic Parameter Matrix
                    </h3>
                    <div className="flex bg-slate-800 p-0.5 rounded-lg border border-white/5">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isDirty && (
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Discard Changes
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg",
                            isDirty
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                        )}
                    >
                        {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Commit Changes
                    </button>
                </div>
            </div>

            {isRunning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Hot Reloading Active</p>
                        <p className="text-xs text-amber-200/70">Bot is currently running. Some structural changes (like trading pairs) are locked, but execution parameters can be adjusted in real-time.</p>
                    </div>
                </div>
            )}

            {/* Input Groups */}
            <div className={cn(
                "grid gap-4",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
                {Object.entries(config).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => (
                    <div key={key} className={cn(
                        "group p-3 bg-slate-900/40 border border-white/5 rounded-xl transition-all hover:bg-slate-900/60 hover:border-white/10",
                        viewMode === 'list' && "flex items-center justify-between gap-6"
                    )}>
                        <div className={cn("space-y-1", viewMode === 'list' ? "flex-1" : "mb-3")}>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <Info className="w-2.5 h-2.5 text-slate-700 cursor-help" />
                            </div>
                            <div className="text-[8px] font-mono text-slate-600 group-hover:text-slate-500 truncate max-w-[200px]">
                                {key}
                            </div>
                        </div>
                        <div className={cn(viewMode === 'list' ? "w-48" : "w-full")}>
                            {renderInput(key, value)}
                        </div>
                    </div>
                ))}
            </div>

            {!Object.keys(config).length && (
                <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl opacity-30">
                    <p>No configuration parameters available for this strategy.</p>
                </div>
            )}
        </div>
    );
}

// Re-using Lucide Settings icon locally as it might not be exported from parent
function Settings(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
