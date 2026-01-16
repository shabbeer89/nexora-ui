"use client";

import { useState, useEffect } from "react";
import { Download, Search } from "lucide-react";

interface ProfitEntry {
    pair: string;
    quantity: number;
    entryPrice: number;
    exitPrice: number;
    profitNum: number;
    profitPct: number;
    buyExchange: string;
    sellExchange: string;
    strategy: string;
    createdAt: string;
}

export default function ProfitPage() {
    const [profits, setProfits] = useState<ProfitEntry[]>([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    useEffect(() => {
        // Mock data - replace with actual API call
        setProfits([
            {
                pair: "MNT/USDT",
                quantity: 100,
                entryPrice: 0.5234,
                exitPrice: 0.5298,
                profitNum: 0.64,
                profitPct: 1.22,
                buyExchange: "BYBIT",
                sellExchange: "BYBIT",
                strategy: "DCA",
                createdAt: new Date().toISOString()
            },
            {
                pair: "APT/USDT",
                quantity: 50,
                entryPrice: 8.45,
                exitPrice: 8.52,
                profitNum: 3.50,
                profitPct: 0.83,
                buyExchange: "BYBIT",
                sellExchange: "BYBIT",
                strategy: "HMM",
                createdAt: new Date().toISOString()
            }
        ]);
    }, []);

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background-dark)' }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Profit Analysis
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
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>QUANTITY</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>ENTRY PRICE</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>EXIT PRICE</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>PROFIT (NUM)</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>PROFIT (%)</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>BUY EXCHANGE</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>SELL EXCHANGE</th>
                                <th className="text-left py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>STRATEGY</th>
                                <th className="text-right py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>CREATED AT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profits.map((profit, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>{profit.pair}</td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-primary)' }}>{profit.quantity}</td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-primary)' }}>${profit.entryPrice.toFixed(4)}</td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-primary)' }}>${profit.exitPrice.toFixed(4)}</td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--color-success)' }}>${profit.profitNum.toFixed(2)}</td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--color-success)' }}>{profit.profitPct.toFixed(2)}%</td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>{profit.buyExchange}</td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>{profit.sellExchange}</td>
                                    <td className="py-4 px-2" style={{ color: 'var(--text-primary)' }}>{profit.strategy}</td>
                                    <td className="text-right py-4 px-2" style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(profit.createdAt).toLocaleString()}
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
