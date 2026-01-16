'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';

interface Account {
    name: string;
    connectors: string[];
}

interface TradingPair {
    symbol: string;
    price?: number;
}

export default function ManualTradingPage() {
    // Account & Exchange Selection
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedConnector, setSelectedConnector] = useState<string>('');
    const [availableConnectors, setAvailableConnectors] = useState<string[]>([]);

    // Trading Pair
    const [tradingPair, setTradingPair] = useState<string>('BTC-USDT');
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    // Order Configuration
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
    const [amount, setAmount] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [positionAction, setPositionAction] = useState<'NIL' | 'OPEN' | 'CLOSE'>('NIL');

    // UI State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Recent Orders
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    // Common trading pairs
    const popularPairs = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'XRP-USDT', 'DOGE-USDT'];

    // Fetch accounts on mount
    const fetchAccounts = useCallback(async () => {
        try {
            const response = await fetch('/api/accounts', {
                headers: {
                    'Authorization': `Basic ${btoa('admin:admin')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.accounts) {
                    setAccounts(data.accounts);
                    if (data.accounts.length > 0) {
                        const firstAccount = data.accounts[0];
                        setSelectedAccount(firstAccount.name);
                        setAvailableConnectors(firstAccount.connectors || []);
                        if (firstAccount.connectors?.length > 0) {
                            setSelectedConnector(firstAccount.connectors[0]);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[ManualTrading] Failed to fetch accounts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch current price
    const fetchPrice = useCallback(async () => {
        if (!selectedConnector || !tradingPair) return;

        try {
            const response = await backendApi.get(`/market-data?connector=${selectedConnector}&pair=${tradingPair}`);
            if (response.data?.prices) {
                const priceData = response.data.prices[tradingPair];
                if (priceData) {
                    setCurrentPrice(priceData);
                }
            }
        } catch (err) {
            console.error('[ManualTrading] Failed to fetch price:', err);
        }
    }, [selectedConnector, tradingPair]);

    // Fetch recent orders
    const fetchRecentOrders = useCallback(async () => {
        try {
            const response = await backendApi.get('/orders');
            if (response.data?.orders) {
                setRecentOrders(response.data.orders.slice(0, 10));
            }
        } catch (err) {
            console.error('[ManualTrading] Failed to fetch orders:', err);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
        fetchRecentOrders();
    }, [fetchAccounts, fetchRecentOrders]);

    useEffect(() => {
        fetchPrice();
        const interval = setInterval(fetchPrice, 5000);
        return () => clearInterval(interval);
    }, [fetchPrice]);

    // Update connectors when account changes
    useEffect(() => {
        const account = accounts.find(a => a.name === selectedAccount);
        if (account) {
            setAvailableConnectors(account.connectors || []);
            if (account.connectors?.length > 0 && !account.connectors.includes(selectedConnector)) {
                setSelectedConnector(account.connectors[0]);
            }
        }
    }, [selectedAccount, accounts]);

    // Place order
    const handlePlaceOrder = async () => {
        if (!selectedAccount || !selectedConnector || !tradingPair || !amount) {
            setError('Please fill all required fields');
            return;
        }

        if (orderType === 'limit' && !price) {
            setError('Please enter a price for limit orders');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await backendApi.post('/trading', {
                account_name: selectedAccount,
                connector_name: selectedConnector,
                trading_pair: tradingPair,
                trade_type: side.toUpperCase(),
                order_type: orderType.toUpperCase(),
                amount: parseFloat(amount),
                price: orderType === 'limit' ? parseFloat(price) : undefined,
                position_action: positionAction
            });

            if (response.data?.success) {
                setSuccess(`Order placed successfully! Order ID: ${response.data.order?.order_id || 'N/A'}`);
                setAmount('');
                setPrice('');
                fetchRecentOrders();
            } else {
                setError(response.data?.error || 'Failed to place order');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate order value
    const orderValue = amount && currentPrice ? parseFloat(amount) * currentPrice : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-400">Loading trading interface...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ArrowUpDown className="h-6 w-6 text-blue-500" />
                    Manual Trading
                </h1>
                <button
                    onClick={fetchPrice}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Price
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Form */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Place Order</h2>

                        {/* Account Selection */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Account</label>
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.name} value={acc.name}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Exchange</label>
                                <select
                                    value={selectedConnector}
                                    onChange={(e) => setSelectedConnector(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {availableConnectors.map(conn => (
                                        <option key={conn} value={conn}>{conn}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Trading Pair</label>
                                <select
                                    value={tradingPair}
                                    onChange={(e) => setTradingPair(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {popularPairs.map(pair => (
                                        <option key={pair} value={pair}>{pair}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Current Price Display */}
                            {currentPrice && (
                                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                                    <div className="text-xs text-gray-500 mb-1">Current Price</div>
                                    <div className="text-xl font-bold text-white">
                                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            )}

                            {/* Buy/Sell Toggle */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setSide('buy')}
                                    className={cn(
                                        "py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                                        side === 'buy'
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    )}
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    Buy
                                </button>
                                <button
                                    onClick={() => setSide('sell')}
                                    className={cn(
                                        "py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                                        side === 'sell'
                                            ? "bg-red-600 text-white"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    )}
                                >
                                    <TrendingDown className="h-4 w-4" />
                                    Sell
                                </button>
                            </div>

                            {/* Order Type */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Order Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setOrderType('limit')}
                                        className={cn(
                                            "py-2 rounded-lg text-sm transition-colors",
                                            orderType === 'limit'
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                        )}
                                    >
                                        Limit
                                    </button>
                                    <button
                                        onClick={() => setOrderType('market')}
                                        className={cn(
                                            "py-2 rounded-lg text-sm transition-colors",
                                            orderType === 'market'
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                        )}
                                    >
                                        Market
                                    </button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.001"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>

                            {/* Price (for limit orders) */}
                            {orderType === 'limit' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Price</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder={currentPrice?.toString() || '0.00'}
                                        step="0.01"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            )}

                            {/* Position Action (for perpetuals) */}
                            {selectedConnector.includes('perpetual') && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Position Action</label>
                                    <select
                                        value={positionAction}
                                        onChange={(e) => setPositionAction(e.target.value as any)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value="OPEN">Open Position</option>
                                        <option value="CLOSE">Close Position</option>
                                    </select>
                                </div>
                            )}

                            {/* Order Summary */}
                            {amount && (
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Total Value</span>
                                        <span className="text-white font-medium">
                                            ~${orderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-900/30 border border-green-800 rounded-lg p-3 text-green-400 text-sm">
                                    {success}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handlePlaceOrder}
                                disabled={submitting || !amount}
                                className={cn(
                                    "w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                                    side === 'buy'
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white",
                                    (submitting || !amount) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Placing Order...
                                    </>
                                ) : (
                                    <>
                                        {side === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        {side === 'buy' ? 'Buy' : 'Sell'} {tradingPair.split('-')[0]}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                            <button
                                onClick={fetchRecentOrders}
                                className="text-gray-400 hover:text-white"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No recent orders
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-800/50">
                                        <tr className="text-left text-xs text-gray-400 uppercase">
                                            <th className="px-4 py-3">Time</th>
                                            <th className="px-4 py-3">Pair</th>
                                            <th className="px-4 py-3">Side</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Amount</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {recentOrders.map((order, idx) => (
                                            <tr key={order.order_id || idx} className="text-sm">
                                                <td className="px-4 py-3 text-gray-400">
                                                    {new Date(order.created_at || order.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="px-4 py-3 text-white font-medium">
                                                    {order.trading_pair}
                                                </td>
                                                <td className={cn(
                                                    "px-4 py-3 font-medium",
                                                    order.trade_type === 'BUY' ? 'text-green-500' : 'text-red-500'
                                                )}>
                                                    {order.trade_type}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400">
                                                    {order.order_type}
                                                </td>
                                                <td className="px-4 py-3 text-white">
                                                    {parseFloat(order.amount).toFixed(4)}
                                                </td>
                                                <td className="px-4 py-3 text-white">
                                                    ${order.price ? parseFloat(order.price).toLocaleString() : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded text-xs",
                                                        order.status === 'FILLED' && "bg-green-900/50 text-green-400",
                                                        order.status === 'OPEN' && "bg-blue-900/50 text-blue-400",
                                                        order.status === 'CANCELLED' && "bg-gray-800 text-gray-400",
                                                        order.status === 'PARTIALLY_FILLED' && "bg-yellow-900/50 text-yellow-400"
                                                    )}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
