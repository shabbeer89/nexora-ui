'use client';

import { useState, useEffect } from 'react';
import { Clock, Activity, Eye, Zap, Layers, Globe, ArrowUpDown } from 'lucide-react';
import { nexoraAPI } from '@/lib/nexora-api';

interface StandardOrder {
    id: string;
    symbol: string;
    side: string;
    type: string;
    price: number;
    amount: number;
    filled: number;
    status: string;
    source: string;
}

interface AdvancedOrder {
    order_id: string;
    type: 'TWAP' | 'VWAP' | 'ICEBERG' | 'SMART';
    symbol: string;
    side: string;
    total_size: number;
    filled_size: number;
    avg_price: number;
    status: string;
    progress: number;
    slices_completed: number;
    slices_total: number;
    created_at?: string;
    timestamp?: string;
}

export default function AdvancedOrdersUI() {
    const [standardOrders, setStandardOrders] = useState<StandardOrder[]>([]);
    const [advancedOrders, setAdvancedOrders] = useState<AdvancedOrder[]>([]);
    const [orderType, setOrderType] = useState<string>('TWAP');
    const [symbol, setSymbol] = useState('BTC/USDT');
    const [side, setSide] = useState('BUY');
    const [size, setSize] = useState('1000');
    const [duration, setDuration] = useState('60');
    const [activeTab, setActiveTab] = useState<'standard' | 'advanced'>('standard');
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; order: AdvancedOrder | null }>({ show: false, order: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setAuthError(null);
            const data = await nexoraAPI.getUnifiedOrders();
            setStandardOrders(data.standard || []);
            setAdvancedOrders(data.advanced || []);
        } catch (error: any) {
            console.error('Failed to fetch orders:', error);
            if (error.message?.includes('Authentication')) {
                setAuthError('Authentication required. Please log in to view orders.');
            } else {
                setAuthError('Failed to load orders. Please try again later.');
            }
            // Set empty arrays on error
            setStandardOrders([]);
            setAdvancedOrders([]);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const submitOrder = async () => {
        try {
            await nexoraAPI.submitAdvancedOrder({
                type: orderType,
                symbol: symbol,
                side: side,
                size: parseFloat(size),
                duration: parseInt(duration),
            });
            fetchOrders();
        } catch (error) {
            alert('Failed to submit order');
        }
    };

    const handleDeleteOrder = async () => {
        if (!deleteModal.order) return;

        setIsDeleting(true);
        try {
            await fetch(`http://localhost:8888/api/orders/advanced/${deleteModal.order.order_id}`, {
                method: 'DELETE'
            });

            // Immediately remove from UI
            setAdvancedOrders(prev => prev.filter(o => o.order_id !== deleteModal.order!.order_id));
            setDeleteModal({ show: false, order: null });
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Failed to delete order. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const getOrderIcon = (type: string) => {
        switch (type) {
            case 'TWAP': return <Clock className="w-5 h-5" />;
            case 'VWAP': return <Activity className="w-5 h-5" />;
            case 'ICEBERG': return <Eye className="w-5 h-5" />;
            case 'SMART': return <Zap className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    const getOrderColor = (type: string) => {
        switch (type) {
            case 'TWAP': return 'from-cyan-500/20';
            case 'VWAP': return 'from-purple-500/20';
            case 'ICEBERG': return 'from-blue-500/20';
            case 'SMART': return 'from-emerald-500/20';
            default: return 'from-slate-500/20';
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white mb-1 uppercase">
                        ⚡ Pending Activity
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Consolidated Order Book & Algorithmic Execution
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('standard')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'standard' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        EXCHANGE ORDERS
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'advanced' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        ALGO ORDERS
                    </button>
                </div>
            </div>

            {/* Authentication Error Banner */}
            {authError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-red-400 uppercase tracking-wider">Authentication Required</div>
                            <div className="text-xs text-slate-400 mt-1">{authError}</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'advanced' ? (
                <>
                    {/* Order Form */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 mb-8">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                            Deploy New Algorithm
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {/* Order Type */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Strategy Type</label>
                                <select
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="TWAP">TWAP (Time-Weighted)</option>
                                    <option value="VWAP">VWAP (Volume-Weighted)</option>
                                    <option value="ICEBERG">Iceberg</option>
                                    <option value="SMART">Smart Router</option>
                                </select>
                            </div>

                            {/* Symbol */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Symbol</label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="BTC/USDT"
                                />
                            </div>

                            {/* Side */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Direction</label>
                                <select
                                    value={side}
                                    onChange={(e) => setSide(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                </select>
                            </div>

                            {/* Size */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Position Size (USD)</label>
                                <input
                                    type="number"
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="1000"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Time Horizon (min)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="60"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={submitOrder}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                                >
                                    DEPLOY ALGO
                                </button>
                            </div>
                        </div>

                        {/* Order Type Info */}
                        <div className="bg-slate-950/30 border border-white/5 rounded-lg p-3">
                            <div className="text-[10px] text-slate-500 font-mono">
                                {orderType === 'TWAP' && 'INFO: Time-Weighted Average Price - Executes equal asset blocks linearly over time to minimize slippage.'}
                                {orderType === 'VWAP' && 'INFO: Volume-Weighted Average Price - Adapts execution pace to liquidity clusters and historical volume curves.'}
                                {orderType === 'ICEBERG' && 'INFO: Hidden Liquidity - Places small visible limit orders and replenishes from total size to reduce front-running.'}
                                {orderType === 'SMART' && 'INFO: Intelligent Routing - ML-driven orchestration that switches between iceberg and market-making based on volatility.'}
                            </div>
                        </div>
                    </div>

                    {/* Active Algo Orders */}
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">
                            Active Algorithms ({advancedOrders.length})
                        </h3>

                        {advancedOrders.length === 0 ? (
                            <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-dashed border-white/5">
                                <div className="text-slate-600 text-xs font-mono">NO ACTIVE EXECUTION ALGORITHMS</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {advancedOrders.map((order) => (
                                    <div
                                        key={order.order_id}
                                        className={`bg-gradient-to-br ${getOrderColor(order.type)} to-transparent border border-white/10 rounded-2xl p-5`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                                                    {getOrderIcon(order.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white">{order.symbol}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase">{order.type} • {order.side}</div>
                                                    <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                                                        {new Date(order.created_at || order.timestamp || Date.now()).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</div>
                                                    <div className="text-lg font-black text-indigo-400">
                                                        {order.progress.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, order })}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                                    title="Delete order"
                                                >
                                                    <svg className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="h-1.5 bg-slate-950/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                                                    style={{ width: `${order.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 text-[10px]">
                                            <div>
                                                <div className="text-slate-500 font-black uppercase">Total Target</div>
                                                <div className="text-white font-bold">${order.total_size.toFixed(0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 font-black uppercase">Filled</div>
                                                <div className="text-emerald-400 font-bold">${order.filled_size.toFixed(0)}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 font-black uppercase">Avg Entry</div>
                                                <div className="text-white font-bold">${order.avg_price.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 font-black uppercase">Batching</div>
                                                <div className="text-white font-bold">{order.slices_completed}/{order.slices_total} SLICES</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Standard Exchange Orders Section */
                <div>
                    <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] mb-4">
                        Live Exchange Orders ({standardOrders.length})
                    </h3>

                    {standardOrders.length === 0 ? (
                        <div className="text-center py-24 bg-slate-800/20 rounded-2xl border border-dashed border-white/5">
                            <Layers className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <div className="text-slate-600 text-xs font-black uppercase tracking-widest">Book is empty - No live limit orders</div>
                            <p className="text-[10px] text-slate-700 mt-2 font-mono">Awaiting strategy signals or manual entry</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden border border-white/5 rounded-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Instrument</th>
                                        <th className="px-6 py-4">Source</th>
                                        <th className="px-6 py-4">Side</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-slate-900/30">
                                    {standardOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-white">{order.symbol}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${order.source === 'FreqTrade' ? 'bg-cyan-500' : 'bg-orange-500'}`} />
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{order.source}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${order.side.toLowerCase() === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                    {order.side.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-cyan-400">${order.price.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-white">{order.amount.toFixed(4)}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">FILLED: {order.filled}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-emerald-500 animate-pulse uppercase tracking-widest">{order.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {/* The closing div for the main component is here, before the modal */}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && deleteModal.order && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Delete Order?</h3>
                                <p className="text-xs text-slate-400 font-mono mt-1">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-black text-white">{deleteModal.order.symbol}</span>
                                <span className="text-xs font-black text-slate-500">{deleteModal.order.order_id.substring(0, 12)}...</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded font-black">{deleteModal.order.type}</span>
                                <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded font-black">{deleteModal.order.side}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400 font-mono">${deleteModal.order.total_size.toFixed(0)}</span>
                            </div>
                            <div className="mt-3 text-[10px] text-slate-500 font-mono">
                                Progress: {deleteModal.order.progress.toFixed(1)}% • Filled: ${deleteModal.order.filled_size.toFixed(0)}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, order: null })}
                                disabled={isDeleting}
                                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleDeleteOrder}
                                disabled={isDeleting}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                            >
                                {isDeleting ? 'DELETING...' : 'DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
