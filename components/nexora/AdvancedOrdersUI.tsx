'use client';

import { useState, useEffect } from 'react';
import { Clock, Activity, Eye, Zap } from 'lucide-react';

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
}

export default function AdvancedOrdersUI() {
    const [orders, setOrders] = useState<AdvancedOrder[]>([]);
    const [orderType, setOrderType] = useState<string>('TWAP');
    const [symbol, setSymbol] = useState('BTC/USDT');
    const [side, setSide] = useState('BUY');
    const [size, setSize] = useState('1000');
    const [duration, setDuration] = useState('60');

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:8888/api/orders/advanced');
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const submitOrder = async () => {
        try {
            await fetch('http://localhost:8888/api/orders/advanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: orderType,
                    symbol,
                    side,
                    size: parseFloat(size),
                    duration: parseInt(duration),
                }),
            });
            fetchOrders();
        } catch (error) {
            alert('Failed to submit order');
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
                    <h2 className="text-2xl font-black text-white mb-1">
                        ⚡ Advanced Orders
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                        Professional Execution Algorithms
                    </p>
                </div>
            </div>

            {/* Order Form */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 mb-8">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                    New Advanced Order
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Order Type */}
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Order Type</label>
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                        >
                            <option value="TWAP">TWAP (Time-Weighted)</option>
                            <option value="VWAP">VWAP (Volume-Weighted)</option>
                            <option value="ICEBERG">Iceberg</option>
                            <option value="SMART">Smart Router</option>
                        </select>
                    </div>

                    {/* Symbol */}
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Symbol</label>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                            placeholder="BTC/USDT"
                        />
                    </div>

                    {/* Side */}
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Side</label>
                        <select
                            value={side}
                            onChange={(e) => setSide(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                        >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                    </div>

                    {/* Size */}
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Size (USD)</label>
                        <input
                            type="number"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                            placeholder="1000"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Duration (minutes)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                            placeholder="60"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-end">
                        <button
                            onClick={submitOrder}
                            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Submit Order
                        </button>
                    </div>
                </div>

                {/* Order Type Info */}
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                        {orderType === 'TWAP' && '⏱️ Time-Weighted: Splits order into equal slices over time'}
                        {orderType === 'VWAP' && '📊 Volume-Weighted: Executes based on historical volume patterns'}
                        {orderType === 'ICEBERG' && '🧊 Iceberg: Shows only small portion to market at a time'}
                        {orderType === 'SMART' && '🤖 Smart Router: Automatically selects best execution method'}
                    </div>
                </div>
            </div>

            {/* Active Orders */}
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                    Active Orders ({orders.length})
                </h3>

                {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        No active advanced orders
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.order_id}
                                className={`bg-gradient-to-br ${getOrderColor(order.type)} to-transparent border border-white/10 rounded-2xl p-5`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                                            {getOrderIcon(order.type)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-white">{order.symbol}</div>
                                            <div className="text-xs text-slate-400 font-mono">{order.type} • {order.side}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400">Filled</div>
                                        <div className="text-lg font-black text-cyan-400">
                                            {((order.filled_size / order.total_size) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                                            style={{ width: `${order.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <div className="text-slate-400">Total Size</div>
                                        <div className="text-white font-bold">${order.total_size.toFixed(0)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400">Filled</div>
                                        <div className="text-emerald-400 font-bold">${order.filled_size.toFixed(0)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400">Avg Price</div>
                                        <div className="text-white font-bold">${order.avg_price.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400">Slices</div>
                                        <div className="text-white font-bold">{order.slices_completed}/{order.slices_total}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
