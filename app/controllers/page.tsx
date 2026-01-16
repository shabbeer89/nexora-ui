'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings2, Plus, RefreshCw, Loader2, Edit, Trash2, Play, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

interface Controller {
    name: string;
    type: string;
    description?: string;
    configs: ControllerConfig[];
}

interface ControllerConfig {
    id: string;
    name: string;
    controller_name: string;
    parameters: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export default function ControllersPage() {
    const [controllers, setControllers] = useState<Controller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedController, setExpandedController] = useState<string | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<ControllerConfig | null>(null);
    const [configJson, setConfigJson] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const fetchControllers = useCallback(async () => {
        try {
            const response = await fetch('/api/controllers', {
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setControllers(data.controllers || []);
                setError(null);
            } else {
                setError('Failed to fetch controllers');
            }
        } catch (err: any) {
            console.error('[Controllers] Failed to fetch:', err);
            setError(err.message || 'Failed to load controllers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchControllers();
    }, [fetchControllers]);

    const handleSelectConfig = (config: ControllerConfig) => {
        setSelectedConfig(config);
        setConfigJson(JSON.stringify(config.parameters, null, 2));
    };

    const handleSaveConfig = async () => {
        if (!selectedConfig) return;

        setSaving(true);
        try {
            const parsedConfig = JSON.parse(configJson);

            await fetch(`/api/controllers/${selectedConfig.controller_name}/configs/${selectedConfig.id}`, {
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
            fetchControllers();
        } catch (err: any) {
            console.error('[Controllers] Save failed:', err);
            toast.error(err.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfig = async (config: ControllerConfig) => {
        if (!confirm(`Delete configuration "${config.name}"?`)) return;

        try {
            await fetch(`/api/controllers/${config.controller_name}/configs/${config.id}`, {
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
            fetchControllers();
        } catch (err: any) {
            console.error('[Controllers] Delete failed:', err);
            toast.error('Failed to delete configuration');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings2 className="h-6 w-6 text-purple-500" />
                    Strategy Controllers
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchControllers}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            <p className="text-gray-400">
                Manage strategy controllers and their configurations. Controllers define the trading logic
                that bots use to execute strategies.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controllers List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-medium text-white">Available Controllers</h2>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                            </div>
                        ) : error ? (
                            <div className="p-4 text-red-400 text-sm">{error}</div>
                        ) : controllers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No controllers found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {controllers.map((controller) => (
                                    <div key={controller.name}>
                                        <button
                                            onClick={() => setExpandedController(
                                                expandedController === controller.name ? null : controller.name
                                            )}
                                            className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 text-left"
                                        >
                                            <div>
                                                <p className="text-white font-medium">{controller.name}</p>
                                                <p className="text-xs text-gray-500">{controller.type}</p>
                                            </div>
                                            {expandedController === controller.name ? (
                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-500" />
                                            )}
                                        </button>

                                        {expandedController === controller.name && (
                                            <div className="bg-gray-800/30 px-3 py-2 space-y-2">
                                                {controller.configs?.length > 0 ? (
                                                    controller.configs.map((config) => (
                                                        <div
                                                            key={config.id}
                                                            className={cn(
                                                                "flex items-center justify-between p-2 rounded cursor-pointer",
                                                                selectedConfig?.id === config.id
                                                                    ? "bg-purple-600/20 border border-purple-500/50"
                                                                    : "hover:bg-gray-700/50"
                                                            )}
                                                            onClick={() => handleSelectConfig(config)}
                                                        >
                                                            <span className="text-sm text-gray-300">{config.name}</span>
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
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-500 py-2">No configurations</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Config Editor */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h2 className="font-medium text-white flex items-center gap-2">
                                <Code className="h-4 w-4 text-gray-500" />
                                {selectedConfig ? `Configuration: ${selectedConfig.name}` : 'Select a Configuration'}
                            </h2>
                            {selectedConfig && (
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 text-sm"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    Save
                                </button>
                            )}
                        </div>

                        {selectedConfig ? (
                            <div className="p-4">
                                <textarea
                                    value={configJson}
                                    onChange={(e) => setConfigJson(e.target.value)}
                                    className="w-full h-96 bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-purple-500"
                                    spellCheck={false}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                <Settings2 className="h-12 w-12 mb-4 opacity-50" />
                                <p>Select a controller configuration to edit</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
