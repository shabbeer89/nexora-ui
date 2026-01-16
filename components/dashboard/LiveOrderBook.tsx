import React, { useMemo } from 'react';
import { useOrderBook } from '@/lib/websocket-hooks';
import { OrderBookData, OrderBookLevel } from '@/types/trading';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface LiveOrderBookProps {
    symbol: string;
    depth?: number;
}

export function LiveOrderBook({ symbol, depth = 15 }: LiveOrderBookProps) {
    const { data, status } = useOrderBook(symbol);

    const asks = useMemo(() => {
        return data?.asks.slice(0, depth).reverse() || [];
    }, [data?.asks, depth]);

    const bids = useMemo(() => {
        return data?.bids.slice(0, depth) || [];
    }, [data?.bids, depth]);

    const spreadColor = useMemo(() => {
        if (!data) return 'text-gray-500';
        return data.spread > 0 ? 'text-green-500' : 'text-red-500';
    }, [data]);

    if (status === 'connecting') {
        return (
            <div className="w-full h-96 animate-pulse bg-gray-900/50 rounded-lg p-4">
                <div className="h-8 bg-gray-800 rounded mb-4 w-1/3"></div>
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-800/50 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data && status === 'connected') {
        return (
            <div className="w-full h-96 flex items-center justify-center text-gray-500 bg-gray-900/50 rounded-lg">
                Waiting for order book data...
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-gray-900/50">
                <h3 className="font-semibold text-gray-200">Order Book</h3>
                <span className="text-xs text-gray-500">Spread: {data?.spreadPercent.toFixed(2)}%</span>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-gray-500 font-medium border-b border-gray-800">
                <div className="text-left">Price ({symbol.split('-')[1]})</div>
                <div className="text-right">Amount ({symbol.split('-')[0]})</div>
                <div className="text-right">Total</div>
            </div>

            {/* Order Book Content */}
            <div className="flex-1 overflow-y-auto font-mono text-xs custom-scrollbar">
                {/* Asks (Sells) - Red */}
                <div className="flex flex-col-reverse">
                    {asks.map((level: OrderBookLevel, i: number) => (
                        <OrderBookRow
                            key={`ask-${i}`}
                            level={level}
                            type="ask"
                            maxTotal={parseFloat(asks[0]?.total || '0')}
                        />
                    ))}
                </div>

                {/* Spread */}
                <div className="py-2 my-1 border-y border-gray-800 bg-gray-800/30 flex justify-center items-center gap-2 font-bold text-sm">
                    <span className={spreadColor}>{data?.bids[0]?.price || '---'}</span>
                    {data?.spread && (
                        <span className="text-xs text-gray-500 flex items-center">
                            {data.spread > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(data.spread).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Bids (Buys) - Green */}
                <div className="flex flex-col">
                    {bids.map((level: OrderBookLevel, i: number) => (
                        <OrderBookRow
                            key={`bid-${i}`}
                            level={level}
                            type="bid"
                            maxTotal={parseFloat(bids[bids.length - 1]?.total || '0')}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface OrderBookRowProps {
    level: OrderBookLevel;
    type: 'bid' | 'ask';
    maxTotal: number;
}

function OrderBookRow({ level, type, maxTotal }: OrderBookRowProps) {
    const priceColor = type === 'bid' ? 'text-green-500' : 'text-red-500';
    const bgColor = type === 'bid' ? 'bg-green-500/10' : 'bg-red-500/10';
    const width = Math.min((parseFloat(level.total || level.quantity) / maxTotal) * 100, 100);

    return (
        <div className="relative grid grid-cols-3 gap-2 px-3 py-1 hover:bg-gray-800/50 cursor-pointer group">
            {/* Depth Visualizer */}
            <div
                className={`absolute top-0 right-0 h-full ${bgColor} opacity-20 transition-all duration-200`}
                style={{ width: `${width}%` }}
            />

            <div className={`relative z-10 text-left ${priceColor} group-hover:font-bold`}>
                {parseFloat(level.price).toFixed(2)}
            </div>
            <div className="relative z-10 text-right text-gray-300">
                {parseFloat(level.quantity).toFixed(4)}
            </div>
            <div className="relative z-10 text-right text-gray-500">
                {parseFloat(level.total || '0').toFixed(2)}
            </div>
        </div>
    );
}
