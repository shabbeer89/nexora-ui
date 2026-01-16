"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Activity,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    XCircle,
    Loader2,
    AlertCircle,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { useWebSocket, useOrderUpdates, useConnectionStatus } from "@/lib/websocket-hooks";
import { backendApi } from "@/lib/backend-api";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

interface Order {
    order_id: string;
    client_order_id?: string;
    bot_id?: string;
    botName?: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: string;
    price: string | number;
    amount: string | number;
    quantity?: string | number; // sometimes used instead of amount
    status: string;
    timestamp: string;
    filled_amount?: string | number;
    exchange_order_id?: string;
    account_name?: string;
    connector_name?: string;
    trading_pair?: string;
}

export default function OrdersPage() {
    const { isConnected } = useConnectionStatus();
    const liveOrders = useOrderUpdates();
    const { fetchOrders, orders: initialOrders } = useStore();

    // Local state
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'filled' | 'cancelled'>('open');
    const [sideFilter, setSideFilter] = useState<'all' | 'buy' | 'sell'>('all');
    const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

    // Merge initial store orders with live updates
    // Prioritize live updates
    const allOrders = useMemo(() => {
        // Map live orders
        const formattedLive = liveOrders.map(o => ({
            ...o,
            amount: o.amount || o.quantity || 0,
            status: o.status || 'active'
        }));

        // Create map of ID -> Order
        const orderMap = new Map<string, any>();

        // Add historical first
        initialOrders.forEach(o => {
            orderMap.set(o.order_id || o.id, o);
        });

        // Overwrite with live (newer)
        formattedLive.forEach(o => {
            orderMap.set(o.order_id, o);
        });

        return Array.from(orderMap.values()).sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [liveOrders, initialOrders]);

    // Initial load
    useEffect(() => {
        setIsLoading(true);
        fetchOrders().finally(() => setIsLoading(false));
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        return allOrders.filter(order => {
            // Text Search
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                order.symbol?.toLowerCase().includes(search) ||
                order.order_id?.toLowerCase().includes(search) ||
                order.botName?.toLowerCase().includes(search);

            if (!matchesSearch) return false;

            // Side Filter
            if (sideFilter !== 'all' && order.side?.toLowerCase() !== sideFilter) return false;

            // Status Filter
            if (statusFilter === 'open') {
                return ['active', 'created', 'open', 'pending', 'new', 'submitted'].includes(order.status?.toLowerCase());
            }
            if (statusFilter === 'filled') {
                return ['filled', 'completed'].includes(order.status?.toLowerCase());
            }
            if (statusFilter === 'cancelled') {
                return ['cancelled', 'canceled'].includes(order.status?.toLowerCase());
            }

            return true;
        });
    }, [allOrders, searchTerm, sideFilter, statusFilter]);

    const handleCancelOrder = async (order: Order) => {
        if (!confirm(`Are you sure you want to cancel order ${order.order_id}?`)) return;

        setCancellingIds(prev => new Set(prev).add(order.order_id));

        try {
            // Use account_name and connector_name from the order object
            // Fall back to defaults if not available
            const accountName = order.account_name || 'master_account';
            const connectorName = order.connector_name || 'binance_paper_trade';
            const orderId = order.client_order_id || order.order_id;

            if (!order.account_name || !order.connector_name) {
                console.warn('[Orders] Missing account_name or connector_name in order, using defaults');
            }

            // Use the correct API route that proxies to backend
            await backendApi.post(
                `/orders/${orderId}/cancel?account_name=${encodeURIComponent(accountName)}&connector_name=${encodeURIComponent(connectorName)}`
            );

            toast.success("Order cancellation initiated");
            // Refresh orders after cancel
            fetchOrders();
        } catch (error: any) {
            console.error('Cancel failed', error);
            toast.error(error.response?.data?.detail || "Failed to cancel order");
        } finally {
            setCancellingIds(prev => {
                const next = new Set(prev);
                next.delete(order.order_id);
                return next;
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Order Management</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        View and manage your active and historical orders
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${isConnected
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {isConnected ? 'Real-Time Feed' : 'Offline'}
                    </span>
                    <button
                        onClick={() => fetchOrders()}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Symbol, Order ID, or Bot..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open/Active</option>
                        <option value="filled">Filled</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={sideFilter}
                        onChange={(e) => setSideFilter(e.target.value as any)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Sides</option>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Symbol</th>
                                <th className="px-6 py-4">Side</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const isBuy = order.side === 'buy';
                                    const isOpen = ['active', 'created', 'open', 'pending', 'new', 'submitted'].includes(order.status?.toLowerCase());
                                    const isCancelled = ['cancelled', 'canceled'].includes(order.status?.toLowerCase());

                                    return (
                                        <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-white font-medium">
                                                    {order.symbol}
                                                </div>
                                                {order.botName && <div className="text-xs text-slate-500">{order.botName}</div>}
                                                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{order.order_id.substring(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isBuy ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                    {order.side.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {order.type.replace(/_/g, ' ').toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-300">
                                                {Number(order.price) > 0 ? `$${Number(order.price).toLocaleString()}` : 'Market'}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-300">
                                                {Number(order.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isOpen ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    isCancelled ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                                        'bg-green-500/10 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {isOpen ? <Loader2 size={12} className="animate-spin" /> :
                                                        isCancelled ? <XCircle size={12} /> :
                                                            <CheckCircle2 size={12} />}
                                                    {order.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                                                {new Date(order.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isOpen && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order)}
                                                        disabled={cancellingIds.has(order.order_id)}
                                                        className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-medium"
                                                    >
                                                        {cancellingIds.has(order.order_id) ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Activity className="h-8 w-8 mb-3 opacity-20" />
                                            <p>No orders found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
