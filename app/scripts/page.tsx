'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileCode, Plus, RefreshCw, Loader2, Edit, Trash2, Play, Code, Eye } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

interface Script {
    name: string;
    path?: string;
    description?: string;
    configs: ScriptConfig[];
}

interface ScriptConfig {
    id: string;
    name: string;
    script_name: string;
    parameters: Record<string, any>;
    created_at?: string;
}

export default function ScriptsPage() {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedScript, setSelectedScript] = useState<string | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<ScriptConfig | null>(null);
    const [configJson, setConfigJson] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'configs' | 'code'>('configs');
    const [scriptCode, setScriptCode] = useState<string>('');

    const fetchScripts = useCallback(async () => {
        try {
            const response = await fetch('/api/scripts', {
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setScripts(data.scripts || []);
                setError(null);
            } else {
                setError('Failed to fetch scripts');
            }
        } catch (err: any) {
            console.error('[Scripts] Failed to fetch:', err);
            setError(err.message || 'Failed to load scripts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScripts();
    }, [fetchScripts]);

    const handleSelectScript = async (scriptName: string) => {
        setSelectedScript(scriptName);
        setSelectedConfig(null);
        setConfigJson('');

        // Optionally fetch script source code
        try {
            const response = await fetch(`/api/scripts/${scriptName}`, {
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setScriptCode(data.content || '# Script source not available');
            }
        } catch {
            setScriptCode('# Unable to load script source');
        }
    };

    const handleSelectConfig = (config: ScriptConfig) => {
        setSelectedConfig(config);
        setConfigJson(JSON.stringify(config.parameters, null, 2));
        setViewMode('configs');
    };

    const handleSaveConfig = async () => {
        if (!selectedConfig || !selectedScript) return;

        setSaving(true);
        try {
            const parsedConfig = JSON.parse(configJson);

            await fetch(`/api/scripts/${selectedScript}/configs/${selectedConfig.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa('admin:admin')}`
                },
                body: JSON.stringify({
                    parameters: parsedConfig
                })
            });

            toast.success('Configuration saved successfully');
            fetchScripts();
        } catch (err: any) {
            console.error('[Scripts] Save failed:', err);
            toast.error(err.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfig = async (config: ScriptConfig) => {
        if (!confirm(`Delete configuration "${config.name}"?`)) return;

        try {
            await fetch(`/api/scripts/${config.script_name}/configs/${config.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });

            toast.success('Configuration deleted');
            if (selectedConfig?.id === config.id) {
                setSelectedConfig(null);
                setConfigJson('');
            }
            fetchScripts();
        } catch (err: any) {
            console.error('[Scripts] Delete failed:', err);
            toast.error('Failed to delete configuration');
        }
    };

    const selectedScriptData = scripts.find(s => s.name === selectedScript);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileCode className="h-6 w-6 text-green-500" />
                    V2 Scripts
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchScripts}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            <p className="text-gray-400">
                Manage V2 strategy scripts and their configurations. Scripts define executable trading
                strategies that can be deployed to bots.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Scripts List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-medium text-white">Available Scripts</h2>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                            </div>
                        ) : error ? (
                            <div className="p-4 text-red-400 text-sm">{error}</div>
                        ) : scripts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No scripts found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
                                {scripts.map((script) => (
                                    <button
                                        key={script.name}
                                        onClick={() => handleSelectScript(script.name)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 text-left hover:bg-gray-800/50",
                                            selectedScript === script.name && "bg-green-500/10 border-l-2 border-green-500"
                                        )}
                                    >
                                        <div>
                                            <p className="text-white font-medium text-sm">{script.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {script.configs?.length || 0} configs
                                            </p>
                                        </div>
                                        <FileCode className="h-4 w-4 text-gray-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Script Details */}
                <div className="lg:col-span-3">
                    {selectedScript && selectedScriptData ? (
                        <div className="space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex bg-gray-800 rounded-lg p-0.5 w-fit">
                                <button
                                    onClick={() => setViewMode('configs')}
                                    className={cn(
                                        "px-4 py-2 text-sm rounded-md transition-colors",
                                        viewMode === 'configs'
                                            ? "bg-green-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Configurations
                                </button>
                                <button
                                    onClick={() => setViewMode('code')}
                                    className={cn(
                                        "px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                                        viewMode === 'code'
                                            ? "bg-green-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <Eye className="h-4 w-4" />
                                    Source Code
                                </button>
                            </div>

                            {viewMode === 'configs' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Configs List */}
                                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                        <div className="p-4 border-b border-gray-800">
                                            <h2 className="font-medium text-white">{selectedScript} Configs</h2>
                                        </div>

                                        {selectedScriptData.configs?.length > 0 ? (
                                            <div className="divide-y divide-gray-800">
                                                {selectedScriptData.configs.map((config) => (
                                                    <div
                                                        key={config.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 cursor-pointer",
                                                            selectedConfig?.id === config.id
                                                                ? "bg-green-600/20"
                                                                : "hover:bg-gray-800/50"
                                                        )}
                                                        onClick={() => handleSelectConfig(config)}
                                                    >
                                                        <span className="text-sm text-gray-300">{config.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteConfig(config);
                                                                }}
                                                                className="p-1 text-gray-500 hover:text-red-400"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                No configurations
                                            </div>
                                        )}
                                    </div>

                                    {/* Config Editor */}
                                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                                            <h2 className="font-medium text-white">
                                                {selectedConfig ? selectedConfig.name : 'Select Config'}
                                            </h2>
                                            {selectedConfig && (
                                                <button
                                                    onClick={handleSaveConfig}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-3 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                                                >
                                                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                                    Save
                                                </button>
                                            )}
                                        </div>

                                        {selectedConfig ? (
                                            <textarea
                                                value={configJson}
                                                onChange={(e) => setConfigJson(e.target.value)}
                                                className="w-full h-64 bg-gray-950 p-4 text-sm font-mono text-gray-300 focus:outline-none"
                                                spellCheck={false}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center py-16 text-gray-500">
                                                Select a configuration to edit
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                    <div className="p-4 border-b border-gray-800">
                                        <h2 className="font-medium text-white flex items-center gap-2">
                                            <Code className="h-4 w-4 text-gray-500" />
                                            {selectedScript}.py
                                        </h2>
                                    </div>
                                    <pre className="p-4 text-sm font-mono text-gray-300 overflow-auto max-h-[600px]">
                                        {scriptCode}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                <FileCode className="h-12 w-12 mb-4 opacity-50" />
                                <p>Select a script to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
