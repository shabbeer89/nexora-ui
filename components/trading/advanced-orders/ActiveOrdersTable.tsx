import React from 'react';
import { AdvancedOrder } from '@/types/orders';
import { clsx } from 'clsx';
import { XCircle, Edit2, Clock, Eye } from 'lucide-react';

interface ActiveOrdersTableProps {
    orders: AdvancedOrder[];
    onCancel: (id: string) => void;
    onEdit: (order: AdvancedOrder) => void;
}

export function ActiveOrdersTable({ orders, onCancel, onEdit }: ActiveOrdersTableProps) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-lg border border-gray-800">
                No active orders
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                        <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Side</th>
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Filled / Total</th>
                            <th className="px-4 py-3 text-right">Progress</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {orders.map((order) => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                onCancel={onCancel}
                                onEdit={onEdit}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OrderRow({ order, onCancel, onEdit }: {
    order: AdvancedOrder;
    onCancel: (id: string) => void;
    onEdit: (order: AdvancedOrder) => void;
}) {
    const isBuy = order.side === 'buy';
    const sideColor = isBuy ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10';
    const progress = (order.filled / order.quantity) * 100;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'twap': return <Clock size={14} />;
            case 'iceberg': return <Eye size={14} />;
            default: return null;
        }
    };

    return (
        <tr className="hover:bg-gray-800/30 transition-colors">
            <td className="px-4 py-3 text-gray-400">
                {new Date(order.timestamp).toLocaleTimeString()}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-gray-300">
                    {getTypeIcon(order.type)}
                    <span className="capitalize">{order.type.replace('_', ' ')}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={clsx("px-2 py-1 rounded text-xs font-medium uppercase", sideColor)}>
                    {order.side}
                </span>
            </td>
            <td className="px-4 py-3 font-medium text-gray-200">
                {order.symbol}
            </td>
            <td className="px-4 py-3 text-right font-mono text-gray-300">
                {'price' in order ? `$${order.price.toLocaleString()}` : 'Market'}
            </td>
            <td className="px-4 py-3 text-right font-mono text-gray-300">
                {order.filled.toLocaleString()} / {order.quantity.toLocaleString()}
            </td>
            <td className="px-4 py-3">
                <div className="w-24 ml-auto bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-blue-500 h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onEdit(order)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onCancel(order.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <XCircle size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
