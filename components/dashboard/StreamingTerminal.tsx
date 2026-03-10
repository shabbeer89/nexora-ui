'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as TerminalIcon, Search, Trash2, Filter, Download } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';

interface LogEntry {
    timestamp: number;
    level: string;
    message: string;
}

interface StreamingTerminalProps {
    botId: string;
    initialLogs?: LogEntry[];
    recentlyActive?: boolean;
    className?: string;
    messageFilter?: string;
}

export default function StreamingTerminal({ botId, initialLogs = [], recentlyActive, className, messageFilter }: StreamingTerminalProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Sync initial logs when they change or component mounts
    useEffect(() => {
        if (initialLogs.length > 0) {
            setLogs(initialLogs);
        }
    }, [initialLogs]);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>('ALL');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://64.227.151.249:8888/ws';
    const { onMessage, send, isConnected } = useWebSocket(wsUrl);

    // Subscribe to logs for this specific bot when connected
    useEffect(() => {
        if (isConnected) {
            send({
                type: 'subscribe',
                topic: `bot_logs:${botId}`
            });
        }
    }, [botId, isConnected, send]);

    useEffect(() => {
        const unsubscribe = onMessage((data) => {
            if (data.type === 'log_event' && data.bot_id === botId) {
                setLogs(prev => [...prev.slice(-499), {
                    timestamp: data.timestamp || Date.now(),
                    level: data.level || 'INFO',
                    message: data.message || data.msg || ''
                }]);
            }
        });

        return () => {
            if (isConnected) {
                send({
                    type: 'unsubscribe',
                    topic: `bot_logs:${botId}`
                });
            }
            unsubscribe();
        };
    }, [botId, isConnected, onMessage, send]);

    // Handle auto-scroll
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'ALL' || log.level.toUpperCase() === levelFilter;
        const matchesFilter = !messageFilter || log.message.toLowerCase().includes(messageFilter.toLowerCase());
        return matchesSearch && matchesLevel && matchesFilter;
    });

    const clearLogs = () => setLogs([]);

    const downloadLogs = () => {
        const text = logs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.level}: ${l.message}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bot-${botId}-logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getLevelColor = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERROR': return 'text-red-400';
            case 'WARNING':
            case 'WARN': return 'text-yellow-400';
            case 'SUCCESS': return 'text-emerald-400';
            case 'DEBUG': return 'text-slate-500';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl min-h-[300px]", className)}>
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 overflow-x-auto no-scrollbar gap-4">
                <div className="flex items-center gap-2 shrink-0 group/tooltip relative">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-slate-800 rounded transition-colors"
                    >
                        <TerminalIcon className={cn("w-4 h-4 transition-transform", isCollapsed ? "text-slate-500" : "text-blue-500")} />
                    </button>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest cursor-help">
                        {botId === 'hummingbot-api' ? 'Hummingbot Manager' :
                            botId === 'nexora-api' ? 'Nexora REST API' :
                                botId === 'nexora-orchestrator' ? (messageFilter ? 'Nexora Brain 🧠' : 'Nexora Core Control') :
                                    botId === 'hummingbot' ? 'Hummingbot Core' :
                                        botId === 'hbot' ? 'Hummingbot API' :
                                            botId === 'gateway' ? 'Gateway API' :
                                                botId === 'dca-hbot' ? 'DCA-HBOT' :
                                                    botId === 'nexora-dca-bot' ? 'Nexora DCA Engine 🤖' :
                                                        botId === 'freqtrade' ? 'Freqtrade Core' :
                                                            botId === 'simple-trend' ? 'SimpleTrendFollowing ⭐' :
                                                                botId === 'regime-adaptive' ? 'RegimeAdaptive' :
                                                                    botId === 'freqai' ? 'FreqAI Intelligence' :
                                                                        botId === 'nexora-brain' ? 'Nexora Brain 🧠' :
                                                                            botId === 'ws' ? 'WebSocket' :
                                                                                botId === 'mqtt' ? 'MQTT Broker' :
                                                                                    botId === 'postgres' ? 'PostgreSQL' : 'Terminal'}
                        {recentlyActive && !isCollapsed && <span className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>}
                    </span>

                    {/* Modern Popup Tooltip */}
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 ease-out transform scale-95 group-hover/tooltip:scale-100 z-[99999] pointer-events-none">
                        <div className="bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-2xl border-2 border-blue-500/40 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-b-2 border-blue-500/40 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/70 ring-2 ring-green-500/30"></div>
                                    <h3 className="font-bold text-white text-lg tracking-tight">
                                        {botId === 'simple-trend' ? '📊 SimpleTrendFollowing Strategy' :
                                            botId === 'regime-adaptive' ? '🎯 Regime Adaptive Strategy' :
                                                botId === 'freqai' ? '🧠 FreqAI Training Engine' :
                                                    botId === 'hbot' ? '🤖 Hummingbot API Server' :
                                                        botId === 'dca-hbot' ? '💰 DCA Strategy Bot' :
                                                            botId === 'orchestrator' ? '🎮 Nexora Orchestrator' :
                                                                botId === 'api' ? '🔌 Nexora API Server' :
                                                                    botId === 'gateway' ? '🌉 Blockchain Gateway' :
                                                                        botId === 'postgres' ? '🗄️ PostgreSQL Database' :
                                                                            botId === 'mqtt' ? '📡 MQTT Message Broker' :
                                                                                botId === 'ws' ? '🔗 WebSocket Server' :
                                                                                    botId === 'brain' ? '🧩 Nexora Brain Engine' : '⚙️ Service'}
                                    </h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Description */}
                                <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-xl p-4 border border-slate-600/50 shadow-inner">
                                    <p className="text-sm text-slate-200 leading-relaxed">
                                        {botId === 'simple-trend' ? '✨ Validated trend-following strategy with +131% annual returns. Uses 50/200 MA crossover for high-quality trades.' :
                                            botId === 'regime-adaptive' ? '🎯 Multi-regime trading strategy with machine learning adaptation for different market conditions.' :
                                                botId === 'freqai' ? '🧠 AI model training and prediction engine using LightGBM for market forecasting.' :
                                                    botId === 'orchestrator' ? '🎮 Central coordinator managing all trading services, strategies, and risk controls.' :
                                                        botId === 'api' ? '🔌 Main REST API server powering the Nexora UI and external integrations.' :
                                                            botId === 'hbot' ? '🤖 Hummingbot control API for managing DCA and market-making strategies.' :
                                                                botId === 'dca-hbot' ? '💰 Dollar-cost averaging bot for systematic accumulation strategies.' :
                                                                    botId === 'gateway' ? '🌉 Connects to DEXs and blockchain networks for trading execution.' :
                                                                        botId === 'postgres' ? '🗄️ Primary database storing trades, positions, and historical data.' :
                                                                            botId === 'mqtt' ? '📡 Real-time message bus for inter-service communication.' :
                                                                                botId === 'ws' ? '🔗 WebSocket server for live UI updates and streaming data.' : '⚙️ System service component'}
                                    </p>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-3 border border-blue-500/30 shadow-lg">
                                        <div className="text-[11px] text-blue-300 font-bold mb-1.5 uppercase tracking-wider">Group</div>
                                        <div className="text-sm text-white font-bold">
                                            {['simple-trend', 'regime-adaptive', 'freqai'].includes(botId) ? '📈 Trading' :
                                                ['hbot', 'dca-hbot'].includes(botId) ? '🤖 Hummingbot' :
                                                    ['api', 'orchestrator', 'gateway'].includes(botId) ? '🔌 Core APIs' : '🏗️ Infrastructure'}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-3 border border-purple-500/30 shadow-lg">
                                        <div className="text-[11px] text-purple-300 font-bold mb-1.5 uppercase tracking-wider">Controller</div>
                                        <div className="text-sm text-white font-bold">
                                            {['simple-trend', 'regime-adaptive', 'freqai'].includes(botId) ? 'FreqTrade' :
                                                ['hbot', 'dca-hbot'].includes(botId) ? 'Hummingbot' :
                                                    botId === 'orchestrator' ? 'Nexora Core' :
                                                        botId === 'api' ? 'FastAPI' :
                                                            botId === 'gateway' ? 'Gateway' : 'Docker'}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-3 border border-emerald-500/30 shadow-lg">
                                        <div className="text-[11px] text-emerald-300 font-bold mb-1.5 uppercase tracking-wider">Port</div>
                                        <div className="text-sm text-white font-mono font-bold">
                                            {botId === 'simple-trend' ? ':8080' :
                                                botId === 'regime-adaptive' ? ':8080' :
                                                    botId === 'freqai' ? ':8082' :
                                                        botId === 'api' ? ':8888' :
                                                            botId === 'hbot' ? ':8000' :
                                                                botId === 'gateway' ? ':15888' :
                                                                    botId === 'postgres' ? ':5432' :
                                                                        botId === 'mqtt' ? ':1883' : 'N/A'}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-3 border border-yellow-500/30 shadow-lg">
                                        <div className="text-[11px] text-yellow-300 font-bold mb-1.5 uppercase tracking-wider">Log File</div>
                                        <div className="text-xs text-white font-mono truncate">
                                            {botId === 'simple-trend' ? 'simple_trend.log' :
                                                botId === 'regime-adaptive' ? 'freqtrade.log' :
                                                    botId === 'freqai' ? 'freqai.log' :
                                                        botId === 'orchestrator' ? 'orchestrator.log' :
                                                            botId === 'api' ? 'api.log' :
                                                                botId === 'hbot' ? 'hummingbot_api.log' :
                                                                    botId === 'dca-hbot' ? 'dca-hbot.log' :
                                                                        botId === 'gateway' ? 'gateway.log' : `${botId}.log`}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Footer */}
                                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                        <span className="text-xs text-green-400 font-bold uppercase tracking-wide">Active & Streaming</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="pl-7 pr-2 py-1 bg-slate-800 border-none rounded text-[10px] text-slate-300 focus:ring-1 focus:ring-blue-500 w-32 md:w-48 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-slate-800 border-none rounded text-[10px] text-slate-300 py-1 transition-all cursor-pointer"
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                    >
                        <option value="ALL">ALL LEVELS</option>
                        <option value="INFO">INFO</option>
                        <option value="WARNING">WARN</option>
                        <option value="ERROR">ERROR</option>
                        <option value="DEBUG">DEBUG</option>
                    </select>

                    <button onClick={clearLogs} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors" title="Clear Terminal">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={downloadLogs} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors" title="Download Logs">
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold transition-all border",
                            autoScroll ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-500"
                        )}
                    >
                        {autoScroll ? 'AUTO-SCROLL' : 'SCROLL LOCK'}
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            {!isCollapsed && (
                <>
                    <div
                        ref={scrollRef}
                        className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-0.5 custom-scrollbar selection:bg-blue-500/30"
                    >
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log, idx) => (
                                <div key={`${log.timestamp}-${idx}`} className="group flex gap-3 hover:bg-white/[0.02] -mx-4 px-4 transition-colors">
                                    <span className="text-slate-600 shrink-0 select-none">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className={cn("shrink-0 font-bold uppercase", getLevelColor(log.level))}>
                                        {log.level.padEnd(5)}
                                    </span>
                                    <span className="text-slate-300 break-all leading-relaxed">{log.message}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20 py-10">
                                <TerminalIcon className="w-12 h-12 mb-2" />
                                <p className="text-sm">Awaiting stream connection...</p>
                                <p className="text-[10px] uppercase mt-1 tracking-widest">Bot {searchTerm ? 'subset search' : 'idle'}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
