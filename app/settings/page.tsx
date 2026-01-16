"use client";

import { useState, useEffect } from "react";
import { Save, Key, Shield, Bell, Monitor, Plus, Trash2, Eye, EyeOff, RefreshCw, AlertCircle, Settings2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { backendApi } from "@/lib/backend-api";
import { toast } from "sonner";
import { TradingSettingsPanel } from "@/components/trading";

const tabs = [
    { id: 'general', name: 'General', icon: Monitor },
    { id: 'exchanges', name: 'Exchanges', icon: Key },
    { id: 'trading', name: 'Trading', icon: Settings2 },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
];

interface ExchangeCredential {
    id: string;
    name: string;
    account: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('exchanges');
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    // Exchange data
    const [accounts, setAccounts] = useState<string[]>([]);
    const [credentials, setCredentials] = useState<ExchangeCredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add exchange modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState('master_account');
    const [connectorName, setConnectorName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [addingCredential, setAddingCredential] = useState(false);

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const fetchExchangeData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch accounts
            const accountsRes = await backendApi.get('/accounts');
            const accountsList = accountsRes.data || [];
            setAccounts(accountsList);

            // Fetch credentials for each account
            const allCredentials: ExchangeCredential[] = [];
            for (const account of accountsList) {
                try {
                    const credsRes = await backendApi.get(`/accounts/${account}/credentials`);
                    const creds = credsRes.data || [];
                    creds.forEach((connectorName: string) => {
                        allCredentials.push({
                            id: `${account}-${connectorName}`,
                            name: connectorName,
                            account: account
                        });
                    });
                } catch {
                    // Account might not have credentials
                }
            }
            setCredentials(allCredentials);
        } catch (err) {
            console.error('Error fetching exchange data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load exchange data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchangeData();
    }, []);

    const toggleKeyVisibility = (id: string) => {
        setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddCredential = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingCredential(true);

        try {
            await backendApi.post(`/accounts/add-credential/${selectedAccount}/${connectorName}`, {
                api_key: apiKey,
                api_secret: apiSecret
            });

            toast.success(`${connectorName} connected successfully`);
            setShowAddModal(false);
            setConnectorName('');
            setApiKey('');
            setApiSecret('');
            await fetchExchangeData();
        } catch (err) {
            console.error('Error adding credential:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to add credential');
        } finally {
            setAddingCredential(false);
        }
    };

    const handleDeleteCredential = async (account: string, connector: string) => {
        if (!confirm(`Delete ${connector} credentials from ${account}?`)) return;

        try {
            await backendApi.post(`/accounts/delete-credential/${account}/${connector}`);
            toast.success('Credential deleted');
            await fetchExchangeData();
        } catch (err) {
            console.error('Error deleting credential:', err);
            toast.error('Failed to delete credential');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            // Note: This endpoint may need to be created
            await backendApi.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Error changing password:', err);
            toast.error('Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-slate-400 mt-1">Manage your bot configuration and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-blue-500/10 text-blue-500"
                                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                    )}
                                >
                                    <tab.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-500" : "text-slate-500")} />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'exchanges' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-white">Connected Exchanges</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchExchangeData}
                                        disabled={loading}
                                        className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                                    >
                                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                    </button>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Connect Exchange
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <p className="text-red-400">{error}</p>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                                </div>
                            ) : credentials.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
                                    <Key className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white">No exchanges connected</h3>
                                    <p className="text-slate-400 mt-2">Connect your first exchange to start trading</p>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Connect Exchange
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {credentials.map((cred) => (
                                        <div key={cred.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white">
                                                        {cred.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-white">{cred.name}</h4>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-xs text-slate-400">Account: {cred.account}</span>
                                                            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                                                                Connected
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCredential(cred.account, cred.name)}
                                                    className="text-slate-500 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">Connector</label>
                                                    <code className="flex-1 rounded bg-slate-950 px-2 py-1.5 text-sm text-slate-300 font-mono block">
                                                        {cred.name}
                                                    </code>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1">Credentials</label>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="flex-1 rounded bg-slate-950 px-2 py-1.5 text-sm text-slate-300 font-mono">
                                                            {showKey[cred.id] ? 'api_key: ******, api_secret: ******' : '••••••••••••••••'}
                                                        </code>
                                                        <button
                                                            onClick={() => toggleKeyVisibility(cred.id)}
                                                            className="text-slate-500 hover:text-white"
                                                        >
                                                            {showKey[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {['Dark', 'Light', 'System'].map((theme) => (
                                        <button
                                            key={theme}
                                            className={cn(
                                                "flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                                                theme === 'Dark'
                                                    ? "border-blue-500 bg-blue-500/10 text-blue-500"
                                                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white"
                                            )}
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-lg font-medium text-white mb-4">Language & Region</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                                        <select className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-blue-500 focus:outline-none">
                                            <option>English (US)</option>
                                            <option>Spanish</option>
                                            <option>Chinese</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
                                        <select className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-blue-500 focus:outline-none">
                                            <option>UTC (Coordinated Universal Time)</option>
                                            <option>EST (Eastern Standard Time)</option>
                                            <option>PST (Pacific Standard Time)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                                    <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your account</p>
                                </div>
                                <button className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20">
                                    Enabled
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Current Password"
                                        required
                                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                    />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        required
                                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        required
                                        className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="w-full flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {changingPassword ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Update Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'trading' && (
                        <div className="space-y-6">
                            <TradingSettingsPanel />
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                            <p className="text-slate-400">Notification settings coming soon.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Exchange Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Connect Exchange</h3>
                        <form onSubmit={handleAddCredential} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Account</label>
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                >
                                    {accounts.map((acc) => (
                                        <option key={acc} value={acc}>{acc}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Exchange</label>
                                <select
                                    value={connectorName}
                                    onChange={(e) => setConnectorName(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                >
                                    <option value="">Select exchange...</option>
                                    <option value="binance">Binance</option>
                                    <option value="kucoin">KuCoin</option>
                                    <option value="gate_io">Gate.io</option>
                                    <option value="bybit">Bybit</option>
                                    <option value="okx">OKX</option>
                                    <option value="hyperliquid">Hyperliquid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">API Key</label>
                                <input
                                    type="text"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    required
                                    placeholder="Enter your API key"
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">API Secret</label>
                                <input
                                    type="password"
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    required
                                    placeholder="Enter your API secret"
                                    className="w-full rounded-lg bg-slate-950 border border-slate-800 py-2.5 px-3 text-white"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingCredential}
                                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {addingCredential && (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    )}
                                    Connect
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
