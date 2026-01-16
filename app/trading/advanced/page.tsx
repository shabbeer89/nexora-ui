'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TWAPOrderForm } from '@/components/trading/advanced-orders/TWAPOrderForm';
import { IcebergOrderForm } from '@/components/trading/advanced-orders/IcebergOrderForm';
import { ActiveOrdersTable } from '@/components/trading/advanced-orders/ActiveOrdersTable';
import { AdvancedOrder } from '@/types/orders';
import { backendApi } from '@/lib/backend-api';
import { Loader2 } from 'lucide-react';

export default function AdvancedTradingPage() {
    const [activeTab, setActiveTab] = useState<'twap' | 'iceberg'>('twap');
    const [orders, setOrders] = useState<AdvancedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch active orders from backend
    const fetchOrders = useCallback(async () => {
        try {
            const response = await backendApi.get('/orders');
            if (response.data?.orders) {
                // Map backend orders to AdvancedOrder format
                const mappedOrders: AdvancedOrder[] = response.data.orders
                    .filter((order: any) =>
                        order.status === 'OPEN' ||
                        order.status === 'PARTIALLY_FILLED' ||
                        order.status === 'PENDING'
                    )
                    .map((order: any) => ({
                        id: order.order_id || order.id,
                        type: order.order_type?.toLowerCase().includes('twap') ? 'twap' :
                            order.order_type?.toLowerCase().includes('iceberg') ? 'iceberg' : 'limit',
                        side: order.side?.toLowerCase() || 'buy',
                        symbol: order.trading_pair || order.symbol,
                        quantity: parseFloat(order.amount) || 0,
                        filled: parseFloat(order.filled_amount) || 0,
                        price: parseFloat(order.price) || undefined,
                        status: order.status === 'PARTIALLY_FILLED' ? 'partial' :
                            order.status === 'OPEN' ? 'open' : 'pending',
                        timestamp: new Date(order.created_at || order.timestamp).getTime(),
                        exchange: order.connector_name || order.exchange,
                        accountName: order.account_name
                    }));
                setOrders(mappedOrders);
                setError(null);
            }
        } catch (err: any) {
            console.error('[AdvancedTrading] Failed to fetch orders:', err);
            setError('Failed to load active orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Poll every 5 seconds for updates
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleCancel = async (id: string) => {
        try {
            const order = orders.find(o => o.id === id);
            if (!order) return;

            await backendApi.post('/orders/cancel', {
                order_id: id,
                connector_name: order.exchange,
                trading_pair: order.symbol
            });

            // Refresh orders after cancel
            fetchOrders();
        } catch (err: any) {
            console.error('[AdvancedTrading] Failed to cancel order:', err);
        }
    };

    const handleEdit = (order: AdvancedOrder) => {
        console.log('Edit order:', order);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Advanced Trading</h1>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                    <button
                        onClick={() => setActiveTab('twap')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'twap'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        TWAP
                    </button>
                    <button
                        onClick={() => setActiveTab('iceberg')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'iceberg'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Iceberg
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Form Column */}
                <div className="lg:col-span-1">
                    {activeTab === 'twap' ? <TWAPOrderForm /> : <IcebergOrderForm />}
                </div>

                {/* Active Orders Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-200">Active Algorithms</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <span className="ml-3 text-gray-400">Loading orders...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12 bg-red-900/20 rounded-lg border border-red-800">
                            <span className="text-red-400">{error}</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex items-center justify-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
                            <span className="text-gray-500">No active advanced orders</span>
                        </div>
                    ) : (
                        <ActiveOrdersTable
                            orders={orders}
                            onCancel={handleCancel}
                            onEdit={handleEdit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
