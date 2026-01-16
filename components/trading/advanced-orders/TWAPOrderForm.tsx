import React, { useState } from 'react';
import { OrderFormLayout } from './OrderFormLayout';
import { Clock, RefreshCw } from 'lucide-react';

export function TWAPOrderForm() {
    const [quantity, setQuantity] = useState('');
    const [duration, setDuration] = useState('60'); // minutes
    const [interval, setInterval] = useState('60'); // seconds
    const [randomize, setRandomize] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({ quantity, duration, interval, randomize });
        // TODO: Submit order
    };

    return (
        <OrderFormLayout
            title="TWAP Order"
            description="Time-Weighted Average Price strategy splits a large order into smaller chunks executed over a specified time period."
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                {/* Quantity Input */}
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

                {/* Duration & Interval */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            <Clock size={12} /> Duration (min)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            <RefreshCw size={12} /> Interval (sec)
                        </label>
                        <input
                            type="number"
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Randomization Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
                    <span className="text-sm text-gray-300">Randomize Execution</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={randomize}
                            onChange={(e) => setRandomize(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Summary */}
                <div className="text-xs text-gray-500 bg-gray-800/30 p-2 rounded">
                    Estimated chunks: {Math.floor((parseInt(duration) * 60) / parseInt(interval))}
                    <br />
                    Avg chunk size: {(parseFloat(quantity) / Math.floor((parseInt(duration) * 60) / parseInt(interval))).toFixed(4) || '0.00'}
                </div>
            </div>
        </OrderFormLayout>
    );
}
