import React from 'react';
import { usePositions } from '@/lib/websocket-hooks';
import { Position } from '@/types/trading';
import { clsx } from 'clsx';
import { XCircle, ExternalLink } from 'lucide-react';

export function LivePositions() {
    const { data: positions, status } = usePositions();

    if (status === 'connecting') {
        return <PositionsSkeleton />;
    }

    if (!positions || positions.length === 0) {
        return (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-500">No active positions</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold text-gray-200">Active Positions</h3>
                <span className="text-xs text-gray-500">{positions.length} Open</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                        <tr>
                            <th className="px-4 py-3">Symbol</th>
                            <th className="px-4 py-3">Side</th>
                            <th className="px-4 py-3 text-right">Size</th>
                            <th className="px-4 py-3 text-right">Entry Price</th>
                            <th className="px-4 py-3 text-right">Mark Price</th>
                            <th className="px-4 py-3 text-right">Liq. Price</th>
                            <th className="px-4 py-3 text-right">PnL (ROE%)</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {positions.map((position) => (
                            <PositionRow key={position.id} position={position} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PositionRow({ position }: { position: Position }) {
    const isLong = position.side === 'long';
    const pnlColor = position.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500';
    const sideColor = isLong ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10';

    return (
        <tr className="hover:bg-gray-800/30 transition-colors">
            <td className="px-4 py-3 font-medium text-gray-200">
                <div className="flex items-center gap-2">
                    {position.symbol}
                    <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        {position.leverage}x
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={clsx("px-2 py-1 rounded text-xs font-medium uppercase", sideColor)}>
                    {position.side}
                </span>
            </td>
            <td className="px-4 py-3 text-right font-mono text-gray-300">
                {position.size.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono text-gray-300">
                ${position.entryPrice.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono text-gray-300">
                ${position.currentPrice.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono text-orange-500">
                {position.liquidationPrice ? `$${position.liquidationPrice.toLocaleString()}` : '-'}
            </td>
            <td className="px-4 py-3 text-right">
                <div className={clsx("font-medium", pnlColor)}>
                    ${position.unrealizedPnL.toLocaleString()}
                </div>
                <div className={clsx("text-xs", pnlColor)}>
                    ({position.unrealizedPnLPercent.toFixed(2)}%)
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors" title="View Details">
                        <ExternalLink size={16} />
                    </button>
                    <button className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500 transition-colors" title="Close Position">
                        <XCircle size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function PositionsSkeleton() {
    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden animate-pulse">
            <div className="h-14 bg-gray-800/50 border-b border-gray-800"></div>
            <div className="space-y-1 p-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-800/30 rounded"></div>
                ))}
            </div>
        </div>
    );
}
