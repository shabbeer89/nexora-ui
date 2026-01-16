"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Key, Plus, Trash2, RefreshCw, Shield, ChevronDown, ChevronRight,
    Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle
} from "lucide-react";
import { backendApi } from "@/lib/backend-api";

interface Credential {
    connector: string;
    configured: boolean;
}

interface Account {
    name: string;
    credentials: string[];
    expanded?: boolean;
}

interface ConnectorConfig {
    fields: string[];
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [connectors, setConnectors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // New account form
    const [newAccountName, setNewAccountName] = useState("");
    const [creatingAccount, setCreatingAccount] = useState(false);

    // Credential form state
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [selectedConnector, setSelectedConnector] = useState<string>("");
    const [configFields, setConfigFields] = useState<string[]>([]);
    const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [savingCredential, setSavingCredential] = useState(false);
    const [deletingCredential, setDeletingCredential] = useState<string | null>(null);

    // Fetch accounts and their credentials
    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await backendApi.get('/accounts');

            if (Array.isArray(response.data)) {
                // Fetch credentials for each account
                const accountsWithCreds = await Promise.all(
                    response.data.map(async (accountName: string) => {
                        try {
                            const credResponse = await backendApi.get(`/accounts/${accountName}/credentials`);
                            return {
                                name: accountName,
                                credentials: Array.isArray(credResponse.data) ? credResponse.data : [],
                                expanded: false
                            };
                        } catch {
                            return { name: accountName, credentials: [], expanded: false };
                        }
                    })
                );
                setAccounts(accountsWithCreds);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch accounts');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch available connectors
    const fetchConnectors = useCallback(async () => {
        try {
            const response = await backendApi.get('/connectors');
            if (Array.isArray(response.data)) {
                setConnectors(response.data.sort());
            }
        } catch (err) {
            console.error('Failed to fetch connectors:', err);
        }
    }, []);

    // Create new account
    const handleCreateAccount = async () => {
        if (!newAccountName.trim()) return;

        setCreatingAccount(true);
        setError(null);

        try {
            await backendApi.post('/accounts', { accountName: newAccountName.trim() });
            setNewAccountName("");
            setSuccessMessage(`Account "${newAccountName}" created successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
            await fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to create account');
        } finally {
            setCreatingAccount(false);
        }
    };

    // Delete account
    const handleDeleteAccount = async (accountName: string) => {
        if (!confirm(`Delete account "${accountName}"? This will remove all credentials.`)) return;

        setError(null);

        try {
            await backendApi.delete('/accounts', { data: { accountName } });
            setSuccessMessage(`Account "${accountName}" deleted`);
            setTimeout(() => setSuccessMessage(null), 3000);
            await fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to delete account');
        }
    };

    // Add credential to account
    const handleAddCredential = async () => {
        if (!selectedAccount || !selectedConnector) return;

        setSavingCredential(true);
        setError(null);

        try {
            await backendApi.post(`/accounts/${selectedAccount}/credentials`, {
                connectorName: selectedConnector,
                credentials: credentialValues
            });

            setSuccessMessage(`Credential for "${selectedConnector}" added successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
            setSelectedConnector("");
            setConfigFields([]);
            setCredentialValues({});
            await fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to add credential');
        } finally {
            setSavingCredential(false);
        }
    };

    // Delete credential from account
    const handleDeleteCredential = async (accountName: string, connectorName: string) => {
        if (!confirm(`Delete "${connectorName}" credential from "${accountName}"?`)) return;

        setDeletingCredential(`${accountName}-${connectorName}`);
        setError(null);

        try {
            await backendApi.delete(`/accounts/${accountName}/credentials`, {
                data: { connectorName }
            });

            setSuccessMessage(`Credential for "${connectorName}" deleted`);
            setTimeout(() => setSuccessMessage(null), 3000);
            await fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to delete credential');
        } finally {
            setDeletingCredential(null);
        }
    };

    // Fetch config fields when connector is selected
    const handleConnectorSelect = async (connector: string) => {
        setSelectedConnector(connector);
        setCredentialValues({});

        if (!connector) {
            setConfigFields([]);
            return;
        }

        try {
            const response = await backendApi.get(`/accounts/${connector}/config-map`);
            if (Array.isArray(response.data)) {
                setConfigFields(response.data);
                // Initialize empty values
                const initialValues: Record<string, string> = {};
                response.data.forEach((field: string) => {
                    initialValues[field] = "";
                });
                setCredentialValues(initialValues);
            }
        } catch (err) {
            console.error('Failed to fetch config map:', err);
            setConfigFields([]);
        }
    };

    // Toggle account expansion
    const toggleAccountExpanded = (accountName: string) => {
        setAccounts(prev => prev.map(acc =>
            acc.name === accountName ? { ...acc, expanded: !acc.expanded } : acc
        ));
    };

    useEffect(() => {
        fetchAccounts();
        fetchConnectors();
    }, [fetchAccounts, fetchConnectors]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Accounts & Credentials</h2>
                    <p className="text-slate-400 mt-1">Manage trading accounts and exchange API keys</p>
                </div>
                <button
                    onClick={fetchAccounts}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Create Account Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-500" />
                    Create New Account
                </h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="Enter account name (e.g., main_trading)"
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateAccount()}
                    />
                    <button
                        onClick={handleCreateAccount}
                        disabled={!newAccountName.trim() || creatingAccount}
                        className="px-6 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors flex items-center gap-2"
                    >
                        {creatingAccount ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Create Account
                    </button>
                </div>
            </div>

            {/* Accounts List */}
            <div className="space-y-4">
                {accounts.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
                        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No accounts configured</p>
                        <p className="text-sm text-slate-600 mt-1">Create an account to start adding exchange credentials</p>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account.name} className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                            {/* Account Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                onClick={() => toggleAccountExpanded(account.name)}
                            >
                                <div className="flex items-center gap-3">
                                    {account.expanded ? (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    )}
                                    <Shield className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <h4 className="font-medium text-white">{account.name}</h4>
                                        <p className="text-sm text-slate-500">
                                            {account.credentials.length} credential{account.credentials.length !== 1 ? 's' : ''} configured
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {account.credentials.length > 0 && (
                                        <div className="flex gap-1">
                                            {account.credentials.slice(0, 3).map((cred) => (
                                                <span key={cred} className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded">
                                                    {cred}
                                                </span>
                                            ))}
                                            {account.credentials.length > 3 && (
                                                <span className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded">
                                                    +{account.credentials.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAccount(account.name);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        disabled={account.name === 'master_account'}
                                        title={account.name === 'master_account' ? 'Cannot delete master account' : 'Delete account'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {account.expanded && (
                                <div className="border-t border-slate-800 p-4 space-y-4">
                                    {/* Existing Credentials */}
                                    {account.credentials.length > 0 && (
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-slate-400">Configured Credentials</h5>
                                            <div className="grid gap-2">
                                                {account.credentials.map((cred) => (
                                                    <div
                                                        key={cred}
                                                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Key className="w-4 h-4 text-green-500" />
                                                            <span className="text-white">{cred}</span>
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteCredential(account.name, cred)}
                                                            disabled={deletingCredential === `${account.name}-${cred}`}
                                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                        >
                                                            {deletingCredential === `${account.name}-${cred}` ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Credential Form */}
                                    <div className="border-t border-slate-800 pt-4">
                                        <h5 className="text-sm font-medium text-slate-400 mb-3">Add New Credential</h5>

                                        <div className="space-y-4">
                                            {/* Connector Select */}
                                            <div>
                                                <label className="block text-sm text-slate-500 mb-1">Exchange/Connector</label>
                                                <select
                                                    value={selectedAccount === account.name ? selectedConnector : ""}
                                                    onChange={(e) => {
                                                        setSelectedAccount(account.name);
                                                        handleConnectorSelect(e.target.value);
                                                    }}
                                                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="">Select a connector...</option>
                                                    {connectors
                                                        .filter(c => !account.credentials.includes(c))
                                                        .map(connector => (
                                                            <option key={connector} value={connector}>
                                                                {connector}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            {/* Credential Fields */}
                                            {selectedAccount === account.name && selectedConnector && configFields.length > 0 && (
                                                <div className="space-y-3">
                                                    {configFields.map((field) => (
                                                        <div key={field}>
                                                            <label className="block text-sm text-slate-500 mb-1 capitalize">
                                                                {field.replace(/_/g, ' ')}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type={showSecrets[field] ? "text" : "password"}
                                                                    value={credentialValues[field] || ""}
                                                                    onChange={(e) => setCredentialValues(prev => ({
                                                                        ...prev,
                                                                        [field]: e.target.value
                                                                    }))}
                                                                    placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                                                                    className="w-full px-4 py-2 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowSecrets(prev => ({
                                                                        ...prev,
                                                                        [field]: !prev[field]
                                                                    }))}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                                >
                                                                    {showSecrets[field] ? (
                                                                        <EyeOff className="w-4 h-4" />
                                                                    ) : (
                                                                        <Eye className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={handleAddCredential}
                                                        disabled={savingCredential || !Object.values(credentialValues).every(v => v.trim())}
                                                        className="w-full py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {savingCredential ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Key className="w-4 h-4" />
                                                        )}
                                                        Save Credential
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
