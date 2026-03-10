'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Percent, Activity, Globe, RefreshCcw, TrendingUp, TrendingDown, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FundingRate {
    exchange: string;
    symbol: string;
    rate: number;
    next_funding_time?: string;
    interval_hours?: number;
    annual_rate?: number;
}

interface FundingRatesResponse {
    rates?: FundingRate[];
    data?: FundingRate[];
    timestamp?: string;
}

// Hardcoded fallback list when API has no onchain funding data
const FALLBACK_EXCHANGES = [
    { exchange: 'Jupiter', symbol: 'SOL-PERP' },
    { exchange: 'Hyperliquid', symbol: 'BTC-PERP' },
    { exchange: 'dYdX', symbol: 'ETH-PERP' },
];

function formatRate(rate: number): string {
    if (isNaN(rate) || rate === null) return '—';
    return `${(rate * 100).toFixed(6)}%`;
}

function formatAnnual(rate: number): string {
    if (isNaN(rate) || rate === null) return '—';
    const annual = rate * 3 * 365 * 100; // 3 per day (8h intervals)
    return `${annual.toFixed(1)}% APY`;
}

export default function NexoraFundingPage() {
    const [rates, setRates] = useState<FundingRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchRates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/onchain/funding-rates');
            if (res.ok) {
                const data: FundingRatesResponse = await res.json();
                const list = data.rates || data.data || [];
                setRates(list);
                setLastRefresh(new Date());
            } else if (res.status === 404) {
                // Endpoint not implemented yet — show empty state
                setRates([]);
                setError('Funding rates API not yet available. Connect a DEX data source.');
            } else {
                throw new Error(`API error ${res.status}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch funding rates');
            setRates([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates();
        // Refresh every 60 seconds (funding rates change every 8h)
        const interval = setInterval(fetchRates, 60000);
        return () => clearInterval(interval);
    }, [fetchRates]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Percent className="w-8 h-8 text-purple-500" />
                        Funding Rates <span className="text-purple-500 font-mono text-sm not-italic ml-2">// YIELD MONITOR</span>
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Real-time perpetual funding costs across global decentralized exchanges
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-[9px] font-mono text-slate-600">
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchRates}
                        disabled={loading}
                        aria-label="Force sync funding rates"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group disabled:opacity-50"
                    >
                        <RefreshCcw className={cn('w-3 h-3 group-hover:rotate-180 transition-transform duration-700', loading && 'animate-spin')} />
                        Force Sync
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                        <div className="text-sm font-bold text-amber-400">Funding Data Unavailable</div>
                        <div className="text-xs text-amber-300/70">{error}</div>
                    </div>
                    <button onClick={fetchRates} className="ml-auto px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-bold text-amber-400 transition-colors">
                        Retry
                    </button>
                </div>
            )}

            {/* Rates Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 animate-pulse">
                            <div className="h-3 bg-slate-700 rounded w-20 mb-4"></div>
                            <div className="h-8 bg-slate-700 rounded w-28"></div>
                        </div>
                    ))}
                </div>
            ) : rates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {rates.map((item, i) => {
                        const isPositive = item.rate >= 0;
                        return (
                            <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Percent className="w-10 h-10 text-purple-400" />
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.exchange}</div>
                                <div className="text-[9px] font-mono text-slate-600 mb-3">{item.symbol}</div>
                                <div className={cn('text-2xl font-black', isPositive ? 'text-rose-400' : 'text-emerald-400')}>
                                    {isPositive ? '+' : ''}{formatRate(item.rate)}
                                </div>
                                <div className="mt-2 text-[9px] font-mono text-slate-600">
                                    {formatAnnual(item.rate)} annualized
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className={cn('text-[9px] font-black uppercase tracking-[0.2em]',
                                        Math.abs(item.rate) > 0.001 ? 'text-rose-400' :
                                            Math.abs(item.rate) > 0.0005 ? 'text-amber-400' : 'text-emerald-400'
                                    )}>
                                        {Math.abs(item.rate) > 0.001 ? 'High' : Math.abs(item.rate) > 0.0005 ? 'Elevated' : 'Stable'}
                                    </span>
                                    {isPositive
                                        ? <TrendingUp className="w-4 h-4 text-rose-500/50" />
                                        : <TrendingDown className="w-4 h-4 text-emerald-500/50" />
                                    }
                                </div>
                                {item.next_funding_time && (
                                    <div className="mt-3 pt-3 border-t border-white/5 text-[9px] font-mono text-slate-600">
                                        Next: {new Date(item.next_funding_time).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : !error ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FALLBACK_EXCHANGES.map((item, i) => (
                        <div key={i} className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 relative overflow-hidden opacity-50">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.exchange}</div>
                            <div className="text-[9px] font-mono text-slate-600 mb-3">{item.symbol}</div>
                            <div className="text-2xl font-black text-slate-700">—</div>
                            <div className="mt-4 text-[9px] text-slate-700 uppercase font-black">No data</div>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Multi-chain Map panel */}
            <div className="h-[400px] border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group">
                <Globe className="h-12 w-12 text-slate-700 group-hover:text-purple-500 transition-colors mb-4" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2">Multi-Chain Funding Map</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                    {rates.length > 0
                        ? `Displaying ${rates.length} live funding rate${rates.length !== 1 ? 's' : ''}. Historical chart coming in next sprint.`
                        : 'Connect a DEX data source to visualize funding arbitrage opportunities across 20+ protocols.'
                    }
                </p>
                {lastRefresh && (
                    <div className="mt-4 text-[9px] font-mono text-slate-700">
                        Auto-refresh: 60s • Last: {lastRefresh.toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}
