"use client";

import { useState, useEffect } from "react";
import {
    Search, Filter, ShoppingBag, Star,
    TrendingUp, Shield, Zap, Plus,
    ChevronRight, Wallet, CheckCircle2,
    BarChart3, User
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

// Types
interface Strategy {
    id: string;
    title: string;
    description: string;
    seller_id: string;
    price: number;
    rating: number;
    review_count: number;
    category: string;
    performance_metrics: {
        sharpe_ratio: number;
        profit_factor: number;
        win_rate: number;
        trade_count: number;
        max_drawdown: number;
    };
    created_at: string;
}

interface PurchaseModalProps {
    strategy: Strategy | null;
    onClose: () => void;
    onPurchase: (strategy: Strategy) => void;
}

const PurchaseModal = ({ strategy, onClose, onPurchase }: PurchaseModalProps) => {
    if (!strategy) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Purchase Strategy</h3>
                        <p className="text-slate-400 text-sm mt-1">{strategy.title}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-400">Price</span>
                            <span className="text-xl font-bold text-white">${strategy.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Platform Fee (20%)</span>
                            <span className="text-slate-400">${(strategy.price * 0.2).toFixed(2)}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-blue-400">
                            <span className="font-medium">Total</span>
                            <span className="font-bold text-lg">${strategy.price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <p className="text-xs text-blue-200">
                            Funds are held in escrow for 7 days. If the strategy fails to meet advertised metrics, you are eligible for a refund.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => onPurchase(strategy)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <Wallet className="w-4 h-4" />
                    Confirm Purchase
                </button>
            </div>
        </div>
    );
};

const CreateListingModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("New Strategy");
    const [price, setPrice] = useState("100");
    const [category, setCategory] = useState("market_making");
    const [description, setDescription] = useState("Highly profitable market making strategy validated on Binance.");

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/marketplace/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strategy_name: title.toLowerCase().replace(/\s+/g, '_'),
                    title,
                    description,
                    category,
                    price: parseFloat(price),
                    tags: ["new", "verified"]
                })
            });

            if (!res.ok) throw new Error('Failed to create listing');

            toast.success("Strategy listed successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6">List New Strategy</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Title</label>
                        <input
                            value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Price ($)</label>
                            <input
                                type="number"
                                value={price} onChange={e => setPrice(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Category</label>
                            <select
                                value={category} onChange={e => setCategory(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                            >
                                <option value="market_making">Market Making</option>
                                <option value="arbitrage">Arbitrage</option>
                                <option value="trend_following">Trend Following</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Description</label>
                        <textarea
                            value={description} onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-2.5 text-slate-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex justify-center items-center"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Create Listing"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function MarketplacePage() {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const categories = [
        { id: "all", label: "All Strategies", icon: Zap },
        { id: "market_making", label: "Market Making", icon: TrendingUp },
        { id: "arbitrage", label: "Arbitrage", icon: BarChart3 },
        { id: "trend_following", label: "Trend Following", icon: TrendingUp },
    ];

    const fetchStrategies = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/marketplace/listings?category=${selectedCategory === 'all' ? '' : selectedCategory}`);
            const data = await res.json();
            setStrategies(data.listings || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load marketplace data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStrategies();
    }, [selectedCategory]);

    const handlePurchase = async (strategy: Strategy) => {
        try {
            const res = await fetch('/api/marketplace/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listing_id: strategy.id, payment_method: 'balance' })
            });

            if (!res.ok) throw new Error('Purchase failed');

            toast.success(`Successfully purchased ${strategy.title}`);
            setSelectedStrategy(null);
        } catch (error: any) {
            toast.error(error.message || "Purchase failed");
        }
    };

    const filteredStrategies = strategies.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Strategy Marketplace</h1>
                    <p className="text-slate-400 mt-2">Discover, verified, high-performance trading strategies from top quants.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    List Strategy
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Filters */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Categories</h3>
                        <div className="space-y-1">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            selectedCategory === cat.id
                                                ? "bg-blue-600/10 text-blue-500"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Filters</h3>
                        {/* Placeholder filters */}
                        <div className="space-y-4 px-2">
                            <div>
                                <label className="text-xs text-slate-500 mb-1.5 block">Minimum Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} className="p-1 hover:text-yellow-500 text-slate-600 transition-colors">
                                            <Star className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1.5 block">Price Range</label>
                                <div className="flex items-center gap-2">
                                    <input placeholder="Min" className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white" />
                                    <span className="text-slate-600">-</span>
                                    <input placeholder="Max" className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search strategies by name, description, or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-slate-700 outline-none transition-all"
                        />
                    </div>

                    {/* Strategy Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-80 bg-slate-900/30 rounded-xl animate-pulse border border-slate-800/50" />
                            ))}
                        </div>
                    ) : filteredStrategies.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStrategies.map((strategy) => (
                                <div
                                    key={strategy.id}
                                    className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-black/50 flex flex-col"
                                >
                                    {/* Card Header / Image Placeholder */}
                                    <div className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                            <TrendingUp className="w-24 h-24" />
                                        </div>
                                        <div className="flex justify-between items-start z-10">
                                            <span className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-[10px] uppercase font-bold tracking-wider text-slate-300 border border-white/5">
                                                {strategy.category.replace('_', ' ')}
                                            </span>
                                            {strategy.rating >= 4.5 && (
                                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold flex items-center gap-1 border border-yellow-500/20">
                                                    <Star className="w-3 h-3 fill-yellow-500" />
                                                    TOP RATED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{strategy.title}</h3>
                                            <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
                                                <User className="w-3.5 h-3.5" />
                                                <span>User_{strategy.seller_id.slice(0, 6)}</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-400 mb-6 line-clamp-2">{strategy.description}</p>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-6">
                                            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800/50">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sharpe</p>
                                                <p className="text-sm font-bold text-green-400">{strategy.performance_metrics.sharpe_ratio?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800/50">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Win Rate</p>
                                                <p className="text-sm font-bold text-blue-400">{(strategy.performance_metrics.win_rate * 100).toFixed(0)}%</p>
                                            </div>
                                            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800/50">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Profit</p>
                                                <p className="text-sm font-bold text-white">{strategy.performance_metrics.profit_factor?.toFixed(1) || '0.0'}x</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800">
                                            <div>
                                                <span className="text-xs text-slate-500 block">Price</span>
                                                <span className="text-lg font-bold text-white">${strategy.price}</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedStrategy(strategy)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                            >
                                                Purchase
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                            <ShoppingBag className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No strategies found</h3>
                            <p className="text-slate-400 max-w-sm text-center mb-6">
                                The marketplace is currently empty. Be the first to list a high-performance strategy!
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                            >
                                List Your Strategy
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {selectedStrategy && (
                <PurchaseModal
                    strategy={selectedStrategy}
                    onClose={() => setSelectedStrategy(null)}
                    onPurchase={handlePurchase}
                />
            )}

            {showCreateModal && (
                <CreateListingModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={fetchStrategies}
                />
            )}
        </div>
    );
}
