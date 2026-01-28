'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Activity } from 'lucide-react';

interface BacktestLogsProps {
    jobId: string | null;
    onComplete?: () => void;
}

export function BacktestLogs({ jobId, onComplete }: BacktestLogsProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<string>('idle');
    const logsEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!jobId) return;

        // Get WebSocket URL from environment or default
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888';
        const wsEndpoint = `${wsUrl}/api/backtesting/ws/${jobId}/logs`;

        console.log('Connecting to WebSocket:', wsEndpoint);

        // Connect to WebSocket for real-time logs
        const ws = new WebSocket(wsEndpoint);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            setStatus('connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message:', data);

            if (data.log) {
                setLogs(prev => [...prev, data.log]);
            }

            if (data.status) {
                setStatus(data.status);
            }

            if (data.complete) {
                onComplete?.();
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('error');
            setLogs(prev => [...prev, `ERROR: WebSocket connection failed. Is the backend running on ${wsUrl}?`]);
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
            setStatus('disconnected');
        };

        return () => {
            ws.close();
        };
    }, [jobId, onComplete]);

    useEffect(() => {
        // Auto-scroll to bottom
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (!jobId) {
        return (
            <div className="h-[400px] border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center p-12">
                <Terminal className="h-10 w-10 text-slate-700 mb-4" />
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    No active simulation
                </p>
            </div>
        );
    }

    return (
        <div className="border border-white/5 bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Real-time Logs
                </h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' :
                        status === 'running' ? 'bg-amber-500 animate-pulse' :
                            status === 'completed' ? 'bg-blue-500' :
                                status === 'failed' ? 'bg-red-500' :
                                    'bg-slate-600'
                        }`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {status}
                    </span>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-4 h-[350px] overflow-y-auto font-mono text-[10px] space-y-1">
                {logs.length === 0 ? (
                    <p className="text-slate-600">Waiting for logs...</p>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="text-slate-400 hover:text-slate-300 transition-colors">
                            <span className="text-slate-600 mr-2">[{index + 1}]</span>
                            {log}
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
