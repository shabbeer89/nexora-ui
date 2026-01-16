"use client";

import { useState, useEffect } from "react";
import { Download, Search } from "lucide-react";

interface TradeEntry {
    pair: string;
    buyExchange: string;
    sellExchange: string;
    buyAmount: number;
    sellAmount: number;
    profit: number;
    strategy: string;
    dateTime: string;
}

export default function TradeHistoryPage() {
    const [trades, setTrades] = useState<TradeEntry[]>([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        // Mock data - replace with actual API call
        setTrades([
            {
                pair: "MNT_USDT",
                buyExchange: "BYBIT",
                sellExchange: "BYBIT",
                buyAmount: 100,
                sellAmount: 100,
                profit: 0.52,
                strategy: "Dca",
                dateTime: new Date().toISOString()
            },
            {
                pair: "APT_USDT",
                buyExchange: "BYBIT",
                sellExchange: "BYBIT",
                buyAmount: 50,
                sellAmount: 50,
                profit: 0.35,
                strategy: "Hmm",
                dateTime: new Date(Date.now() - 3600000).toISOString()
            },
            {
                pair: "SOL_USDT",
                buyExchange: "BYBIT",
                sellExchange: "BYBIT",
                buyAmount: 10,
                sellAmount: 10,
                profit: 1.20,
                strategy: "Dca",
                dateTime: new Date(Date.now() - 7200000).toISOString()
            }
        ]);
    }, []);

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background-dark)' }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Trade History
                </h1>
            </div>

            {/* Filters */}
            <div
                className="rounded-xl p-4 mb-6 flex items-center gap-4"
                style={{ backgroundColor: 'var(--background-card)' }}
            >
                <div className="flex items-center gap-2">
                    <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>From:</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{
                            backgroundColor: 'var(--background-dark)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>To:</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{
                            backgroundColor: 'var(--background-dark)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                        }}
                    />
                </div>
                <div className="flex-1"></div>
                <button className="p-2 rounded-lg hover:opacity-80">
                    <Search className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button className="p-2 rounded-lg hover:opacity-80">
                    <Download className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
            </div>

            {/* Table */}
            <div
                className="rounded-xl p-6"
                style={{ backgroundColor: 'var(--background-card)' }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>PAIR</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>BUY EXCHANGE</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>SELL EXCHANGE</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>BUY AMOUNT</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>SELL AMOUNT</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>PROFIT</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>STRATEGY</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>DATE & TIME</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {trade.pair}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {trade.buyExchange}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {trade.sellExchange}
                                    </td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {trade.buyAmount}
                                    </td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {trade.sellAmount}
                                    </td>
                                    <td className="text-right py-4 px-2" style={{ color: trade.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                        ${trade.profit.toFixed(2)}
                                    </td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>
                                        {trade.strategy}
                                    </td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(trade.dateTime).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button className="w-8 h-8 rounded-full" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        ←
                    </button>
                    <button className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                        1
                    </button>
                    <button className="w-8 h-8 rounded-full" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        2
                    </button>
                    <button className="w-8 h-8 rounded-full" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}
