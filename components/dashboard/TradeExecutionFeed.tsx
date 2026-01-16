import React, { useEffect, useState } from 'react';
import { useTradeUpdates } from '@/lib/websocket-hooks';
import { TradeExecution } from '@/types/trading';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function TradeExecutionFeed() {
    const { trades } = useTradeUpdates();

    if (trades.length === 0) {
        return (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[400px] flex flex-col">
                <h3 className="font-semibold text-gray-200 mb-4">Recent Activity</h3>
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                    No recent trades
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-200">Recent Activity</h3>
                <span className="text-xs text-gray-500">Last 50 trades</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {trades.map((trade) => (
                    <TradeItem key={trade.id} trade={trade} />
                ))}
            </div>
        </div>
    );
}

function TradeItem({ trade }: { trade: TradeExecution }) {
    const isBuy = trade.side === 'buy';
    const sideColor = isBuy ? 'text-green-500' : 'text-red-500';

    const StatusIcon = {
        filled: CheckCircle2,
        partial: Clock,
        pending: Clock,
        cancelled: XCircle,
        rejected: AlertCircle,
    }[trade.status];

    const statusColor = {
        filled: 'text-green-500',
        partial: 'text-yellow-500',
        pending: 'text-blue-500',
        cancelled: 'text-gray-500',
        rejected: 'text-red-500',
    }[trade.status];

    return (
        <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-800/50 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={clsx("p-2 rounded-full bg-gray-900", statusColor)}>
                    <StatusIcon size={16} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-200">{trade.symbol}</span>
                        <span className={clsx("text-xs font-bold uppercase", sideColor)}>
                            {trade.side}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {format(trade.timestamp, 'HH:mm:ss')} • {trade.type}
                    </div>
                </div>
            </div>

            <div className="text-right">
                <div className="font-mono text-sm text-gray-200">
                    {trade.filled.toLocaleString()} / {trade.quantity.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 font-mono">
                    @{trade.price.toLocaleString()}
                </div>
            </div>
        </div>
    );
}
