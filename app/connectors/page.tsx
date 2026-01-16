'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plug, RefreshCw, Loader2, ChevronRight, Settings, Zap, ListFilter, Check } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';
import { cn } from '@/utils/cn';
import { GatewayWalletPanel } from '@/components/gateway';

interface Connector {
    name: string;
    type?: 'spot' | 'perpetual' | 'dex';
    supported?: boolean;
}

interface TradingRule {
    trading_pair: string;
    min_order_size?: number;
    max_order_size?: number;
    min_price_increment?: number;
    min_base_amount_increment?: number;
    min_notional_size?: number;
    max_notional_size?: number;
}

export default function ConnectorsPage() {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
    const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [orderTypes, setOrderTypes] = useState<string[]>([]);

    const fetchConnectors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await backendApi.get('/connectors');
            if (response.data?.connectors) {
                // Transform connector names into objects
                const connectorList = response.data.connectors.map((name: string) => ({
                    name,
                    type: name.includes('perpetual') ? 'perpetual' : name.includes('dex') ? 'dex' : 'spot',
                    supported: true
                }));
                setConnectors(connectorList);
                setError(null);
            }
        } catch (err: any) {
            console.error('[Connectors] Failed to fetch:', err);
            setError('Failed to load connectors');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTradingRules = useCallback(async (connector: string) => {
        setLoadingRules(true);
        try {
            const response = await backendApi.get(`/connectors?connector=${connector}&action=rules`);
            if (response.data?.rules) {
                setTradingRules(Array.isArray(response.data.rules) ? response.data.rules : []);
            }

            // Also fetch order types
            const orderTypesResponse = await backendApi.get(`/connectors?connector=${connector}&action=order-types`);
            if (orderTypesResponse.data?.orderTypes) {
                setOrderTypes(orderTypesResponse.data.orderTypes);
            }
        } catch (err: any) {
            console.error('[Connectors] Failed to fetch rules:', err);
        } finally {
            setLoadingRules(false);
        }
    }, []);

    useEffect(() => {
        fetchConnectors();
    }, [fetchConnectors]);

    const handleSelectConnector = (connector: string) => {
        setSelectedConnector(connector);
        setTradingRules([]);
        setOrderTypes([]);
        fetchTradingRules(connector);
    };

    // Group connectors by type
    const spotConnectors = connectors.filter(c => c.type === 'spot');
    const perpetualConnectors = connectors.filter(c => c.type === 'perpetual');
    const dexConnectors = connectors.filter(c => c.type === 'dex');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Plug className="h-6 w-6 text-blue-500" />
                    Exchange Connectors
                </h1>
                <button
                    onClick={fetchConnectors}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            <p className="text-gray-400">
                View available exchange connectors and their trading rules.
                Select a connector to see supported trading pairs and order constraints.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Spot Exchanges</p>
                    <p className="text-2xl font-bold text-white mt-1">{spotConnectors.length}</p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">Perpetual Exchanges</p>
                    <p className="text-2xl font-bold text-white mt-1">{perpetualConnectors.length}</p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-400">DEX Connectors</p>
                    <p className="text-2xl font-bold text-white mt-1">{dexConnectors.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Connectors List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-medium text-white">Available Connectors</h2>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                        ) : error ? (
                            <div className="p-4 text-red-400 text-sm">{error}</div>
                        ) : connectors.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No connectors available
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto">
                                {/* Spot */}
                                {spotConnectors.length > 0 && (
                                    <div>
                                        <p className="px-4 py-2 text-xs text-gray-500 uppercase bg-gray-800/30">Spot</p>
                                        {spotConnectors.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => handleSelectConnector(c.name)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/50",
                                                    selectedConnector === c.name && "bg-blue-500/10 border-l-2 border-blue-500"
                                                )}
                                            >
                                                <span className="text-sm text-white">{c.name}</span>
                                                <ChevronRight className="h-4 w-4 text-gray-500" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Perpetual */}
                                {perpetualConnectors.length > 0 && (
                                    <div>
                                        <p className="px-4 py-2 text-xs text-gray-500 uppercase bg-gray-800/30">Perpetual</p>
                                        {perpetualConnectors.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => handleSelectConnector(c.name)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/50",
                                                    selectedConnector === c.name && "bg-blue-500/10 border-l-2 border-blue-500"
                                                )}
                                            >
                                                <span className="text-sm text-white">{c.name}</span>
                                                <ChevronRight className="h-4 w-4 text-gray-500" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DEX */}
                                {dexConnectors.length > 0 && (
                                    <div>
                                        <p className="px-4 py-2 text-xs text-gray-500 uppercase bg-gray-800/30">DEX</p>
                                        {dexConnectors.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => handleSelectConnector(c.name)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/50",
                                                    selectedConnector === c.name && "bg-blue-500/10 border-l-2 border-blue-500"
                                                )}
                                            >
                                                <span className="text-sm text-white">{c.name}</span>
                                                <ChevronRight className="h-4 w-4 text-gray-500" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Connector Details */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedConnector ? (
                        <>
                            {/* Order Types */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    {selectedConnector}
                                </h3>

                                {orderTypes.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-2">Supported Order Types</p>
                                        <div className="flex flex-wrap gap-2">
                                            {orderTypes.map(type => (
                                                <span key={type} className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-300 flex items-center gap-1">
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Trading Rules */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                                    <ListFilter className="h-4 w-4 text-gray-500" />
                                    <h3 className="font-medium text-white">Trading Rules</h3>
                                </div>

                                {loadingRules ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                    </div>
                                ) : tradingRules.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No trading rules available
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-96">
                                        <table className="w-full">
                                            <thead className="bg-gray-800/50 sticky top-0">
                                                <tr className="text-left text-xs text-gray-400 uppercase">
                                                    <th className="px-4 py-3">Pair</th>
                                                    <th className="px-4 py-3">Min Size</th>
                                                    <th className="px-4 py-3">Max Size</th>
                                                    <th className="px-4 py-3">Price Incr.</th>
                                                    <th className="px-4 py-3">Min Notional</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {tradingRules.map((rule, idx) => (
                                                    <tr key={idx} className="text-sm">
                                                        <td className="px-4 py-2 text-white font-medium">
                                                            {rule.trading_pair}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-400">
                                                            {rule.min_order_size || '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-400">
                                                            {rule.max_order_size || '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-400">
                                                            {rule.min_price_increment || '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-400">
                                                            {rule.min_notional_size || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                <Plug className="h-12 w-12 mb-4 opacity-50" />
                                <p>Select a connector to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Gateway Wallets Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    DeFi Wallets
                </h2>
                <GatewayWalletPanel />
            </div>
        </div>
    );
}
