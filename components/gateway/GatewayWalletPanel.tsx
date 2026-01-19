"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Wallet, RefreshCw, Loader2, Plus, Trash2, Eye, EyeOff,
    AlertTriangle, CheckCircle2, Link2, ExternalLink
} from "lucide-react";
import { backendApi } from "@/lib/backend-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TokenBalance {
    symbol: string;
    balance: string;
    value_usd: number;
    allowance: string;
    spender?: string;
}

interface GatewayWallet {
    chain: string;
    address: string;
    balance?: string;
    native_balance?: string;
    tokens?: TokenBalance[];
}

interface Chain {
    name: string;
    networks: string[];
}

export function GatewayWalletPanel() {
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [wallets, setWallets] = useState<GatewayWallet[]>([]);
    const [chains, setChains] = useState<Chain[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Add wallet form
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedChain, setSelectedChain] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    const fetchWallets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await backendApi.get("/gateway/wallets");
            setWallets(Array.isArray(response.data) ? response.data : response.data?.wallets || []);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to fetch wallets");
            setWallets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchChains = useCallback(async () => {
        try {
            const response = await backendApi.get("/gateway/chains");
            setChains(Array.isArray(response.data) ? response.data : response.data?.chains || []);
        } catch (err) {
            console.error("Failed to fetch chains:", err);
            // Fallback chains
            setChains([
                { name: "ethereum", networks: ["mainnet", "goerli"] },
                { name: "polygon", networks: ["mainnet", "mumbai"] },
                { name: "arbitrum", networks: ["mainnet"] },
                { name: "solana", networks: ["mainnet-beta", "devnet"] }
            ]);
        }
    }, []);

    useEffect(() => {
        fetchWallets();
        fetchChains();
    }, [fetchWallets, fetchChains]);

    const handleAddWallet = async () => {
        if (!selectedChain || !privateKey) {
            toast.error("Chain and private key are required");
            return;
        }

        setAdding(true);
        try {
            await backendApi.post("/gateway/wallets", {
                chain: selectedChain,
                private_key: privateKey
            });
            toast.success("Wallet added successfully");
            setShowAddForm(false);
            setSelectedChain("");
            setPrivateKey("");
            await fetchWallets();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to add wallet");
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteWallet = async (chain: string, address: string) => {
        if (!confirm(`Remove wallet ${address.slice(0, 8)}...${address.slice(-6)} from ${chain}?`)) {
            return;
        }

        setDeleting(`${chain}-${address}`);
        try {
            await backendApi.delete("/gateway/wallets", {
                data: { chain, address }
            });
            toast.success("Wallet removed");
            await fetchWallets();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to remove wallet");
        } finally {
            setDeleting(null);
        }
    };

    const getExplorerUrl = (chain: string, address: string): string => {
        const explorers: Record<string, string> = {
            ethereum: `https://etherscan.io/address/${address}`,
            polygon: `https://polygonscan.com/address/${address}`,
            arbitrum: `https://arbiscan.io/address/${address}`,
            solana: `https://solscan.io/account/${address}`,
            avalanche: `https://snowtrace.io/address/${address}`,
            bsc: `https://bscscan.com/address/${address}`
        };
        return explorers[chain.toLowerCase()] || "#";
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-white">Gateway Wallets</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        Add Wallet
                    </button>
                    <button
                        onClick={fetchWallets}
                        disabled={loading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Add Wallet Form */}
            {showAddForm && (
                <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Blockchain</label>
                                <select
                                    value={selectedChain}
                                    onChange={(e) => setSelectedChain(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-green-500"
                                >
                                    <option value="">Select chain...</option>
                                    {chains.map((chain) => (
                                        <option key={chain.name} value={chain.name}>
                                            {chain.name.charAt(0).toUpperCase() + chain.name.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Private Key</label>
                                <div className="relative">
                                    <input
                                        type={showPrivateKey ? "text" : "password"}
                                        value={privateKey}
                                        onChange={(e) => setPrivateKey(e.target.value)}
                                        placeholder="Enter private key"
                                        className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-green-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                            <p className="text-xs text-yellow-400">
                                Never share your private key. It is stored encrypted on this server.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setPrivateKey("");
                                }}
                                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddWallet}
                                disabled={adding || !selectedChain || !privateKey}
                                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                                Add Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Wallet className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No Gateway wallets configured</p>
                        <p className="text-xs mt-1">Add a wallet to use DeFi connectors</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {wallets.map((wallet) => (
                            <div key={`${wallet.chain}-${wallet.address}`} className="space-y-3">
                                <div
                                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-white/10 hover:bg-slate-800/60 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-white uppercase tracking-tight">
                                                    {wallet.chain}
                                                </span>
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-black rounded-md border border-green-500/20 uppercase">
                                                    Mainnet
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-slate-500 font-mono">
                                                    {wallet.address.slice(0, 12)}...{wallet.address.slice(-10)}
                                                </p>
                                                <a
                                                    href={getExplorerUrl(wallet.chain, wallet.address)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-600 hover:text-cyan-400 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-500 uppercase">Native Balance</div>
                                            <div className="text-sm font-black text-white">{wallet.native_balance || '0.00'} {wallet.chain.toUpperCase()}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteWallet(wallet.chain, wallet.address)}
                                            className="p-2.5 rounded-xl bg-red-500/5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Token Matrix */}
                                <div className="ml-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                                    {(wallet.tokens || [
                                        { symbol: 'USDC', balance: '14,242.00', value_usd: 14242.00, allowance: 'Unlimited', spender: 'Uniswap V3' },
                                        { symbol: 'WETH', balance: '4.2', value_usd: 12500.00, allowance: '0.00', spender: '0x Proxy' }
                                    ]).map(token => (
                                        <div key={token.symbol} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                                            <div>
                                                <div className="text-[10px] font-black text-white">{token.symbol}</div>
                                                <div className="text-[9px] font-mono text-slate-500">{token.balance}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-slate-500 uppercase">Allowance</div>
                                                <div className={cn(
                                                    "text-[8px] font-black",
                                                    token.allowance === 'Unlimited' ? "text-cyan-400" : "text-amber-500"
                                                )}>
                                                    {token.allowance}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="p-3 bg-white/5 rounded-2xl border border-dashed border-white/10 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase flex items-center justify-center gap-2">
                                        <Plus className="w-3 h-3" /> Add Token
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
