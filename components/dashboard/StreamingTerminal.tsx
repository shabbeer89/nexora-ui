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
}

export default function StreamingTerminal({ botId, initialLogs = [], recentlyActive }: StreamingTerminalProps) {
    const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>('ALL');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws';
    const { onMessage, send } = useWebSocket(wsUrl);

    // Subscribe to logs for this specific bot
    useEffect(() => {
        // Send subscription message
        send({
            type: 'subscribe',
            topic: `bot_logs:${botId}`
        });

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
            send({
                type: 'unsubscribe',
                topic: `bot_logs:${botId}`
            });
            unsubscribe();
        };
    }, [botId, send, onMessage]);

    // Handle auto-scroll
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'ALL' || log.level.toUpperCase() === levelFilter;
        return matchesSearch && matchesLevel;
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
        <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Terminal Output
                        {recentlyActive && <span className="ml-2 w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>}
                    </span>
                </div>
                <div className="flex items-center gap-3">
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

            {/* Terminal Footer */}
            <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[9px] text-slate-500 font-mono">
                    Showing <span className="text-slate-300">{filteredLogs.length}</span> / {logs.length} entries
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Socket Link Secure</span>
                </div>
            </div>
        </div>
    );
}
