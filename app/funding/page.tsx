'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, RefreshCw, Loader2, TrendingUp, TrendingDown, Percent, Clock, AlertCircle } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';

interface FundingInfo {
    trading_pair: string;
    connector: string;
    funding_rate: number;
    next_funding_time: string;
    predicted_rate?: number;
    index_price?: number;
    mark_price?: number;
}

interface FundingPayment {
    trading_pair: string;
    connector: string;
    amount: number;
    timestamp: string;
    rate: number;
    position_side?: 'LONG' | 'SHORT';
}

export default function FundingPage() {
    const [fundingInfo, setFundingInfo] = useState<FundingInfo | null>(null);
    const [payments, setPayments] = useState<FundingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConnector, setSelectedConnector] = useState('binance_perpetual');
    const [selectedPair, setSelectedPair] = useState('BTC-USDT');

    const perpetualConnectors = [
        'binance_perpetual',
        'bybit_perpetual',
        'okx_perpetual',
        'gate_io_perpetual'
    ];

    const popularPairs = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'XRP-USDT'];

    const fetchFundingInfo = useCallback(async () => {
        setLoading(true);
        try {
            const response = await backendApi.get(`/funding?type=info&connector=${selectedConnector}&pair=${selectedPair}`);
            if (response.data?.funding) {
                setFundingInfo(response.data.funding);
                setError(null);
            } else if (response.data?.error) {
                setError(response.data.error);
            }
        } catch (err: any) {
            console.error('[Funding] Failed to fetch info:', err);
            setError('Failed to load funding info');
        } finally {
            setLoading(false);
        }
    }, [selectedConnector, selectedPair]);

    const fetchPayments = useCallback(async () => {
        setLoadingPayments(true);
        try {
            const response = await backendApi.get(`/funding?type=payments&connector=${selectedConnector}`);
            if (response.data?.payments) {
                setPayments(response.data.payments);
            }
        } catch (err: any) {
            console.error('[Funding] Failed to fetch payments:', err);
        } finally {
            setLoadingPayments(false);
        }
    }, [selectedConnector]);

    useEffect(() => {
        fetchFundingInfo();
        fetchPayments();
    }, [fetchFundingInfo, fetchPayments]);

    // Calculate total funding received/paid
    const totalPositive = payments.filter(p => p.amount > 0).reduce((sum, p) => sum + p.amount, 0);
    const totalNegative = payments.filter(p => p.amount < 0).reduce((sum, p) => sum + Math.abs(p.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Percent className="h-6 w-6 text-yellow-500" />
                    Funding Rates
                </h1>
                <button
                    onClick={() => { fetchFundingInfo(); fetchPayments(); }}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            <p className="text-gray-400">
                Monitor perpetual funding rates and view your funding payment history.
            </p>

            {/* Connector/Pair Selection */}
            <div className="flex items-center gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Connector</label>
                    <select
                        value={selectedConnector}
                        onChange={(e) => setSelectedConnector(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    >
                        {perpetualConnectors.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Trading Pair</label>
                    <select
                        value={selectedPair}
                        onChange={(e) => setSelectedPair(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    >
                        {popularPairs.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Funding Info */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Current Funding Rate
                        </h2>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-8 text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {error}
                            </div>
                        ) : fundingInfo ? (
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                                    <p className="text-3xl font-bold text-white">
                                        {(fundingInfo.funding_rate * 100).toFixed(4)}%
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {fundingInfo.trading_pair}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-800/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Next Funding</p>
                                        <p className="text-sm text-white mt-1">
                                            {fundingInfo.next_funding_time
                                                ? new Date(fundingInfo.next_funding_time).toLocaleTimeString()
                                                : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/30 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Predicted</p>
                                        <p className="text-sm text-white mt-1">
                                            {fundingInfo.predicted_rate
                                                ? `${(fundingInfo.predicted_rate * 100).toFixed(4)}%`
                                                : '-'}
                                        </p>
                                    </div>
                                </div>

                                {fundingInfo.mark_price && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Mark Price</p>
                                            <p className="text-sm text-white mt-1">
                                                ${fundingInfo.mark_price.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Index Price</p>
                                            <p className="text-sm text-white mt-1">
                                                ${fundingInfo.index_price?.toLocaleString() || '-'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No funding data available
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <h3 className="text-sm font-medium text-white mb-3">Payment Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Received</span>
                                <span className="text-sm text-green-500 font-medium">
                                    +${totalPositive.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Paid</span>
                                <span className="text-sm text-red-500 font-medium">
                                    -${totalNegative.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                                <span className="text-sm text-gray-400">Net</span>
                                <span className={cn(
                                    "text-sm font-bold",
                                    totalPositive - totalNegative >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                    {totalPositive - totalNegative >= 0 ? '+' : ''}${(totalPositive - totalNegative).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-medium text-white">Funding Payment History</h2>
                        </div>

                        {loadingPayments ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <DollarSign className="h-12 w-12 mb-3 opacity-50" />
                                <p>No funding payments recorded</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-800/50">
                                        <tr className="text-left text-xs text-gray-400 uppercase">
                                            <th className="px-4 py-3">Time</th>
                                            <th className="px-4 py-3">Pair</th>
                                            <th className="px-4 py-3">Side</th>
                                            <th className="px-4 py-3">Rate</th>
                                            <th className="px-4 py-3">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {payments.map((payment, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/30">
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {new Date(payment.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-white">
                                                    {payment.trading_pair}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "text-xs px-2 py-1 rounded",
                                                        payment.position_side === 'LONG'
                                                            ? "bg-green-900/50 text-green-400"
                                                            : "bg-red-900/50 text-red-400"
                                                    )}>
                                                        {payment.position_side || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {(payment.rate * 100).toFixed(4)}%
                                                </td>
                                                <td className={cn(
                                                    "px-4 py-3 text-sm font-medium",
                                                    payment.amount >= 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {payment.amount >= 0 ? '+' : ''}${payment.amount.toFixed(4)}
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
