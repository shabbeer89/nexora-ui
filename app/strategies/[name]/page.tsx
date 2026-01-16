'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { backendApi } from '@/lib/backend-api';
import { FiArrowLeft, FiRefreshCw, FiPlay, FiRotateCcw, FiPlus, FiCode, FiSettings, FiTrendingUp } from 'react-icons/fi';

interface StrategyVersion {
    version: string;
    created_at: string;
    changelog: string;
    is_deployed: boolean;
}

interface Strategy {
    name: string;
    description: string;
    deployed_version: string | null;
    total_versions: number;
    versions?: StrategyVersion[];
    code?: string;
    config?: Record<string, any>;
}

export default function StrategyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const name = params.name as string;

    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [versions, setVersions] = useState<StrategyVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'versions' | 'code' | 'config'>('versions');
    const [deploying, setDeploying] = useState<string | null>(null);
    const [showNewVersionModal, setShowNewVersionModal] = useState(false);

    const fetchStrategy = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [strategyRes, versionsRes] = await Promise.all([
                backendApi.get(`/strategies/${name}`),
                backendApi.get(`/strategies/${name}/versions`)
            ]);

            setStrategy(strategyRes.data.strategy || strategyRes.data);
            setVersions(versionsRes.data.versions || []);
        } catch (err) {
            console.error('Error fetching strategy:', err);
            setError(err instanceof Error ? err.message : 'Failed to load strategy');
        } finally {
            setLoading(false);
        }
    }, [name]);

    useEffect(() => {
        fetchStrategy();
    }, [fetchStrategy]);

    const handleDeploy = async (version: string) => {
        setDeploying(version);
        try {
            await backendApi.post(`/strategies/${name}/deploy`, { version });
            await fetchStrategy();
        } catch (err) {
            console.error('Error deploying version:', err);
            setError(err instanceof Error ? err.message : 'Failed to deploy version');
        } finally {
            setDeploying(null);
        }
    };

    const handleRollback = async () => {
        try {
            await backendApi.post(`/strategies/${name}/rollback`);
            await fetchStrategy();
        } catch (err) {
            console.error('Error rolling back:', err);
            setError(err instanceof Error ? err.message : 'Failed to rollback');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !strategy) {
        return (
            <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
                <p className="text-red-400">Error: {error || 'Strategy not found'}</p>
                <button
                    onClick={() => router.push('/strategies')}
                    className="mt-4 text-blue-400 hover:text-blue-300"
                >
                    ← Back to Strategies
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/strategies')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{strategy.name}</h1>
                        <p className="text-slate-400 mt-1">{strategy.description}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchStrategy}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <FiRefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowNewVersionModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FiPlus size={16} />
                        New Version
                    </button>
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {strategy.deployed_version ? (
                            <>
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 font-medium">
                                    Deployed: v{strategy.deployed_version}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                                <span className="text-gray-400">Not deployed</span>
                            </>
                        )}
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400">{versions.length} version(s)</span>
                    </div>
                    {strategy.deployed_version && (
                        <button
                            onClick={handleRollback}
                            className="px-4 py-2 bg-amber-600/20 text-amber-400 border border-amber-600/30 rounded-lg hover:bg-amber-600/30 transition-colors flex items-center gap-2"
                        >
                            <FiRotateCcw size={16} />
                            Rollback to Previous
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
                <button
                    onClick={() => setActiveTab('versions')}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'versions'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <FiTrendingUp size={14} />
                    Versions
                </button>
                <button
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'code'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <FiCode size={14} />
                    Code
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === 'config'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <FiSettings size={14} />
                    Config
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'versions' && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Version</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Changelog</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {versions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No versions yet. Create your first version!
                                    </td>
                                </tr>
                            ) : (
                                versions.map((v) => (
                                    <tr key={v.version} className="hover:bg-gray-800/30">
                                        <td className="px-6 py-4">
                                            <span className="text-white font-mono">v{v.version}</span>
                                            {v.is_deployed && (
                                                <span className="ml-2 px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(v.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {v.changelog || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!v.is_deployed && (
                                                <button
                                                    onClick={() => handleDeploy(v.version)}
                                                    disabled={deploying === v.version}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 ml-auto"
                                                >
                                                    {deploying === v.version ? (
                                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                                    ) : (
                                                        <>
                                                            <FiPlay size={12} />
                                                            Deploy
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'code' && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <pre className="bg-gray-950 rounded-lg p-4 overflow-x-auto text-sm">
                        <code className="text-green-400">
                            {strategy.code || '# No code available for this strategy'}
                        </code>
                    </pre>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <pre className="bg-gray-950 rounded-lg p-4 overflow-x-auto text-sm">
                        <code className="text-blue-400">
                            {strategy.config
                                ? JSON.stringify(strategy.config, null, 2)
                                : '// No configuration available'}
                        </code>
                    </pre>
                </div>
            )}

            {/* New Version Modal */}
            {showNewVersionModal && (
                <NewVersionModal
                    strategyName={name}
                    onClose={() => setShowNewVersionModal(false)}
                    onSuccess={() => {
                        setShowNewVersionModal(false);
                        fetchStrategy();
                    }}
                />
            )}
        </div>
    );
}

// New Version Modal Component
function NewVersionModal({
    strategyName,
    onClose,
    onSuccess
}: {
    strategyName: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [bump, setBump] = useState<'patch' | 'minor' | 'major'>('patch');
    const [changelog, setChangelog] = useState('');
    const [code, setCode] = useState('');
    const [autoDeploy, setAutoDeploy] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await backendApi.post(`/strategies/${strategyName}/versions`, {
                code: code || '# Updated code',
                config: {},
                bump,
                changelog,
                auto_deploy: autoDeploy
            });
            onSuccess();
        } catch (err) {
            console.error('Error creating version:', err);
            setError(err instanceof Error ? err.message : 'Failed to create version');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Create New Version</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-900/20 border border-red-900 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Version Bump
                        </label>
                        <select
                            value={bump}
                            onChange={(e) => setBump(e.target.value as 'patch' | 'minor' | 'major')}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        >
                            <option value="patch">Patch (1.0.0 → 1.0.1) - Bug fixes</option>
                            <option value="minor">Minor (1.0.0 → 1.1.0) - New features</option>
                            <option value="major">Major (1.0.0 → 2.0.0) - Breaking changes</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Changelog
                        </label>
                        <textarea
                            value={changelog}
                            onChange={(e) => setChangelog(e.target.value)}
                            placeholder="What changed in this version?"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white h-24"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Code (optional - leave blank to copy from previous version)
                        </label>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="# Python strategy code..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white font-mono text-sm h-48"
                        />
                    </div>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={autoDeploy}
                            onChange={(e) => setAutoDeploy(e.target.checked)}
                            className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                        />
                        <span className="text-gray-300">Deploy immediately after creation</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving && (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            )}
                            Create Version
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
