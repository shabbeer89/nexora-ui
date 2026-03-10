'use client';

import React, { useState } from 'react';
import { Layers, Play, TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, Clock, DollarSign, Percent, BarChart3, Download, LineChart as ChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface BacktestConfig {
    strategy: string;
    timerange: string;
    timeframe: string;
    pairs: string[];
    stake_amount: number;
    initial_balance: number;
}

export default function NexoraBacktestingPage() {
    console.log('--- NEXORA BACKTESTING UI V2.1 ACTIVATED ---');
    const [jobId, setJobId] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState<any>(null);
    const [config, setConfig] = useState<BacktestConfig>({
        strategy: 'SimpleTrendFollowing',
        timerange: '20240101-20241231',
        timeframe: '1d',
        pairs: ['BTC/USDT'],
        stake_amount: 100,
        initial_balance: 1000
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRunning(true);
        setResults(null);
        setLogs([]);

        try {
            setLogs(['Initializing backtest request...']);
            const response = await fetch('/api/backtesting/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            if (!data.job_id) {
                throw new Error('Failed to start backtest: No job ID received');
            }

            setJobId(data.job_id);
            setLogs(prev => [...prev, `Job created: ${data.job_id}. Connecting to log stream...`]);

            // Connect to WebSocket for logs
            const ws = new WebSocket(`ws://localhost:8888/api/backtesting/ws/${data.job_id}/logs`);

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.log) {
                    setLogs(prev => [...prev, msg.log]);
                }
                if (msg.complete) {
                    fetchResults(data.job_id);
                    ws.close();
                }
            };

            ws.onerror = () => {
                setLogs(prev => [...prev, 'ERROR: WebSocket connection failed']);
                setIsRunning(false);
            };
        } catch (error) {
            console.error('Failed to start backtest:', error);
            setLogs(prev => [...prev, `ERROR: ${error}`]);
            setIsRunning(false);
        }
    };

    const fetchResults = async (jid: string) => {
        try {
            const response = await fetch(`/api/backtesting/${jid}/results`);
            const data = await response.json();
            setResults(data);
            setIsRunning(false);
        } catch (error) {
            console.error('Failed to fetch results:', error);
            setLogs(prev => [...prev, `ERROR: Failed to fetch results - ${error}`]);
            setIsRunning(false);
        }
    };

    const exportResults = () => {
        const dataStr = JSON.stringify({ config, results, logs }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backtest_${Date.now()}.json`;
        link.click();
    };

    // Parse results
    const strategy = results?.strategy || {};
    const strategyName = Object.keys(strategy)[0] || '';
    const metrics = strategy[strategyName] || {};

    const totalReturn = metrics.profit_total_pct || 0;
    const totalTrades = metrics.total_trades || 0;
    const winRate = metrics.wins ? (metrics.wins / totalTrades * 100) : 0;
    const maxDrawdown = Math.abs(metrics.max_drawdown_pct || 0);
    const sharpeRatio = metrics.sharpe || 0;
    const profitFactor = metrics.profit_factor || 0;

    // Prepare chart data
    const trades = metrics.trades || [];
    let cumulativeProfit = config.initial_balance;
    const chartData = [
        { name: 'Start', equity: config.initial_balance }
    ];

    trades.forEach((trade: any, index: number) => {
        cumulativeProfit += trade.profit_abs;
        chartData.push({
            name: new Date(trade.close_date).toLocaleDateString(),
            equity: Number(cumulativeProfit.toFixed(2))
        });
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Layers className="w-8 h-8 text-amber-500" />
                        Backtesting Engine
                    </h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Historical Performance Analysis & Strategy Validation
                    </p>
                </div>
                {results && (
                    <button
                        onClick={exportResults}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-xs font-bold"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                )}
            </div>

            {/* Configuration Form */}
            <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-3xl p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Configuration</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Strategy</label>
                            <select
                                value={config.strategy}
                                onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            >
                                <option>SimpleTrendFollowing</option>
                                <option>TrendFollowingV1</option>
                                <option>TrendFollowingV2</option>
                                <option>MeanReversionV1</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Timeframe</label>
                            <select
                                value={config.timeframe}
                                onChange={(e) => setConfig({ ...config, timeframe: e.target.value })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            >
                                <option value="1d">1 Day</option>
                                <option value="4h">4 Hours</option>
                                <option value="1h">1 Hour</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pair</label>
                            <input
                                type="text"
                                value={config.pairs[0]}
                                onChange={(e) => setConfig({ ...config, pairs: [e.target.value] })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Start Date</label>
                            <input
                                type="date"
                                value={config.timerange.split('-')[0].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                                onChange={(e) => {
                                    const startDate = e.target.value.replace(/-/g, '');
                                    const endDate = config.timerange.split('-')[1];
                                    setConfig({ ...config, timerange: `${startDate}-${endDate}` });
                                }}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">End Date</label>
                            <input
                                type="date"
                                value={config.timerange.split('-')[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                                onChange={(e) => {
                                    const startDate = config.timerange.split('-')[0];
                                    const endDate = e.target.value.replace(/-/g, '');
                                    setConfig({ ...config, timerange: `${startDate}-${endDate}` });
                                }}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Initial Balance</label>
                            <input
                                type="number"
                                value={config.initial_balance}
                                onChange={(e) => setConfig({ ...config, initial_balance: Number(e.target.value) })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all font-black uppercase tracking-widest text-xs"
                    >
                        <Play className="w-4 h-4 fill-amber-500" />
                        {isRunning ? 'Start Another Backtest' : 'Start Backtest'}
                    </button>
                </form>
            </div>

            {/* Executive Summary */}
            {results && (
                <div className="border border-white/5 bg-gradient-to-br from-slate-950/60 to-slate-900/40 backdrop-blur-xl rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-amber-500" />
                            Executive Summary
                        </h3>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${totalReturn > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            {totalReturn > 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            <span className={`text-xs font-black ${totalReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {totalReturn > 0 ? 'PROFITABLE' : 'UNPROFITABLE'}
                            </span>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                            icon={<DollarSign className="w-5 h-5" />}
                            label="Total Return"
                            value={`${totalReturn.toFixed(2)}%`}
                            trend={totalReturn > 0 ? 'up' : 'down'}
                        />
                        <MetricCard
                            icon={<Percent className="w-5 h-5" />}
                            label="Win Rate"
                            value={`${winRate.toFixed(1)}%`}
                            trend={winRate > 50 ? 'up' : 'down'}
                        />
                        <MetricCard
                            icon={<TrendingDown className="w-5 h-5" />}
                            label="Max Drawdown"
                            value={`${maxDrawdown.toFixed(2)}%`}
                            trend="down"
                        />
                        <MetricCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Sharpe Ratio"
                            value={sharpeRatio.toFixed(2)}
                            trend={sharpeRatio > 1 ? 'up' : 'down'}
                        />
                    </div>

                    {/* Performance Chart */}
                    <div className="mb-6 h-[300px] w-full bg-slate-900/40 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <ChartIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equity Curve (USDT)</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ color: '#f59e0b' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="equity"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorEquity)"
                                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-2xl">
                        <StatItem label="Total Trades" value={totalTrades} />
                        <StatItem label="Winning Trades" value={metrics.wins || 0} />
                        <StatItem label="Losing Trades" value={metrics.losses || 0} />
                        <StatItem label="Profit Factor" value={profitFactor.toFixed(2)} />
                        <StatItem label="Best Trade" value={`${(metrics.profit_max_pct || 0).toFixed(2)}%`} />
                        <StatItem label="Worst Trade" value={`${(metrics.profit_min_pct || 0).toFixed(2)}%`} />
                    </div>
                </div>
            )}

            {/* Live Logs */}
            {(isRunning || logs.length > 0) && (
                <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-3xl p-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Live Execution Log
                    </h3>
                    <div className="bg-slate-900/50 rounded-2xl p-4 h-[300px] overflow-y-auto font-mono text-[10px] space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="text-slate-400 hover:text-slate-300 transition-colors">
                                <span className="text-slate-600 mr-2">[{i + 1}]</span>
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-slate-600 text-center py-8">Waiting for execution logs...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: 'up' | 'down' }) {
    const isPositive = trend === 'up';
    return (
        <div className="border border-white/5 bg-slate-900/30 rounded-2xl p-4">
            <div className={`mb-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {icon}
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                {label}
            </div>
            <div className={`text-xl font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {value}
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
            <span className="text-sm font-black text-white">{value}</span>
        </div>
    );
}
