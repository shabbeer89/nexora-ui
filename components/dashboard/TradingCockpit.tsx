'use client';

import React, { useState, useEffect } from 'react';
import { LiveOrderBook } from './LiveOrderBook';
import { TradeExecutionFeed } from './TradeExecutionFeed';
import { Zap, Target, ShieldAlert, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nexoraAPI } from '@/lib/nexora-api';
import { backendApi } from '@/lib/backend-api';
import { toast } from 'sonner';

interface TradingCockpitProps {
    symbol: string;
}

interface Trade {
    id: string;
    symbol: string;
    side: string;
    amount: number;
    price: number;
    timestamp: string;
}

export default function TradingCockpit({ symbol }: TradingCockpitProps) {
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
    const [price, setPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Real data states
    const [balance, setBalance] = useState<number>(0);
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [riskData, setRiskData] = useState<any>(null);
    const [regime, setRegime] = useState<{ regime: string; strength: number } | null>(null);

    // Fetch real balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const data = await nexoraAPI.getPortfolio();
                setBalance(data.total_value_usd || 0);
            } catch (err) {
                console.error('Failed to fetch balance:', err);
            }
        };
        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    // Fetch recent trades
    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const data = await nexoraAPI.getRecentTrades(5);
                setRecentTrades(data.trades || []);
            } catch (err) {
                console.error('Failed to fetch trades:', err);
            }
        };
        fetchTrades();
        const interval = setInterval(fetchTrades, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    // Fetch risk assessment
    useEffect(() => {
        const fetchRisk = async () => {
            try {
                const data = await nexoraAPI.getRiskAssessment();
                setRiskData(data);
            } catch (err) {
                console.error('Failed to fetch risk data:', err);
            }
        };
        fetchRisk();
        const interval = setInterval(fetchRisk, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    // Fetch regime detection
    useEffect(() => {
        const fetchRegime = async () => {
            try {
                const data = await nexoraAPI.getCurrentRegime();
                setRegime({ regime: data.regime, strength: data.strength });
            } catch (err) {
                console.error('Failed to fetch regime:', err);
            }
        };
        fetchRegime();
        const interval = setInterval(fetchRegime, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleSubmitOrder = async () => {
        if (!amount || (orderType === 'LIMIT' && !price)) {
            toast.error('Please enter amount and price');
            return;
        }

        setLoading(true);
        try {
            await backendApi.post('/trades/manual', {
                symbol,
                side,
                type: orderType,
                price: parseFloat(price),
                amount: parseFloat(amount)
            });
            toast.success(`Manual ${side} order submitted`);
            // Refresh data after order
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Order execution failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Regime Intelligence Header */}
            {regime && (
                <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Market Intelligence</div>
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-black text-white uppercase tracking-tight">
                                    {regime.regime}
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Strength</div>
                                    <div className="text-xl font-black text-cyan-400">{(regime.strength * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>
                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                            <Target className="w-16 h-16 text-cyan-400" />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in duration-700">
                {/* Left: Depth DOM */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <LiveOrderBook symbol={symbol} depth={20} />
                    </div>
                </div>

                {/* Center: Execution Panel */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-[#0b1120] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Tactical Execution</h3>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{symbol} • Spot Trading</p>
                            </div>
                            <div className="flex bg-slate-800 p-1 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => setSide('BUY')}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        side === 'BUY' ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    LONG / BUY
                                </button>
                                <button
                                    onClick={() => setSide('SELL')}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        side === 'SELL' ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    SHORT / SELL
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
                            {/* Input Group */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setOrderType('LIMIT')}
                                            className={cn(
                                                "py-3 rounded-2xl border text-[10px] font-black uppercase transition-all",
                                                orderType === 'LIMIT' ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-slate-500"
                                            )}
                                        >
                                            Limit
                                        </button>
                                        <button
                                            onClick={() => setOrderType('MARKET')}
                                            className={cn(
                                                "py-3 rounded-2xl border text-[10px] font-black uppercase transition-all",
                                                orderType === 'MARKET' ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-slate-500"
                                            )}
                                        >
                                            Market
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price ({symbol.split('-')[1]})</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            disabled={orderType === 'MARKET'}
                                            placeholder={orderType === 'MARKET' ? 'Market Price' : '0.00'}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-black placeholder:text-slate-800 focus:border-blue-500 transition-all outline-none"
                                        />
                                        <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount ({symbol.split('-')[0]})</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-black placeholder:text-slate-800 focus:border-blue-500 transition-all outline-none"
                                        />
                                        <BarChart3 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Targets & Risk Info */}
                            <div className="space-y-6">
                                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Available Assets</span>
                                        <Wallet className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-black text-white">
                                        {balance.toFixed(2)} <span className="text-xs text-slate-500">USDT</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['25%', '50%', '75%', '100%'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setAmount((balance * parseFloat(p) / 100).toFixed(2))}
                                                className="py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldAlert className="w-4 h-4 text-red-500" />
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Risk Assessment</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        {riskData ? (
                                            <>Liquidation: <span className="text-white font-bold">${riskData.liquidation_price?.toFixed(2) || 'N/A'}</span>.
                                                Margin: {riskData.margin_usage || 'N/A'}. {riskData.warning || 'Position within limits.'}</>
                                        ) : (
                                            'Loading risk data...'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitOrder}
                            disabled={loading}
                            className={cn(
                                "w-full py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden group shadow-2xl",
                                side === 'BUY'
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                            )}
                        >
                            {loading ? 'Transmitting...' : `EXECUTE TACTICAL ${side}`}
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                        </button>
                    </div>
                </div>

                {/* Right: History & Logs */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 h-full flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Fills
                            </h4>
                            <span className="text-[9px] font-mono text-cyan-500">LIVE BRIDGE</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                            {recentTrades.length > 0 ? (
                                recentTrades.map((trade, i) => (
                                    <div key={trade.id || i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg", trade.side === 'buy' ? "bg-emerald-500" : "bg-red-500")}></div>
                                            <div>
                                                <div className="text-[10px] font-bold text-white">{trade.amount?.toFixed(4)} {trade.symbol?.split('/')[0] || 'BTC'}</div>
                                                <div className="text-[8px] font-mono text-slate-500">@ {trade.price?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div className="text-[8px] font-mono text-slate-600">
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-500 text-[10px] py-8">
                                    No recent trades
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
