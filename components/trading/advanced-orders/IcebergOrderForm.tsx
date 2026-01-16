import React, { useState } from 'react';
import { OrderFormLayout } from './OrderFormLayout';
import { Eye, EyeOff } from 'lucide-react';

export function IcebergOrderForm() {
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [visibleQty, setVisibleQty] = useState('');
    const [variance, setVariance] = useState('0');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ quantity, price, visibleQty, variance });
        // TODO: Submit order
    };

    return (
        <OrderFormLayout
            title="Iceberg Order"
            description="Hide large orders by only displaying a small portion of the total quantity in the order book at a time."
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                {/* Price & Quantity */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Price</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400">Total Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Visible Quantity */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Eye size={12} /> Visible Quantity
                    </label>
                    <input
                        type="number"
                        value={visibleQty}
                        onChange={(e) => setVisibleQty(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                    />
                </div>

                {/* Variance */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <EyeOff size={12} /> Variance (%)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={variance}
                            onChange={(e) => setVariance(e.target.value)}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-300 w-12 text-right">{variance}%</span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                        Visible quantity will vary by ±{variance}% to hide algorithmic pattern
                    </p>
                </div>
            </div>
        </OrderFormLayout>
    );
}
