
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};


interface LogEntry {
    timestamp: number | string;
    level?: string;
    level_name?: string;
    msg?: string;
    message?: string;
}

interface BotData {
    general_logs?: LogEntry[];
    error_logs?: LogEntry[];
    [key: string]: unknown;
}

export async function GET(request: NextRequest) {
    try {
        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 5000
        };

        // Get status of all bots (this contains logs for running bots)
        const response = await axios.get(`${API_URL}/bot-orchestration/status`, axiosConfig);

        if (response.status !== 200) {
            return NextResponse.json({ logs: [] });
        }


        const botsData = (response.data?.data || {}) as Record<string, BotData>;
        const allLogs: {
            id: string;
            type: string;
            level: string;
            message: string;
            timestamp: number;
            botName: string;
        }[] = [];

        Object.entries(botsData).forEach(([botName, botData]) => {
            // We only care about bots that have logs
            // even stopped bots might have recent logs if they were recently active
            if (botData.general_logs || botData.error_logs) {
                const logs = [
                    ...(botData.error_logs || []),
                    ...(botData.general_logs || [])
                ];

                logs.forEach((log) => {
                    // Try to parse timestamp
                    let ts = Date.now();
                    if (typeof log.timestamp === 'number') {
                        ts = log.timestamp * 1000;
                    } else if (log.timestamp) {
                        ts = Date.parse(log.timestamp as string) || Date.now();
                    }

                    allLogs.push({
                        id: `${botName}-${ts}-${Math.random().toString(36).substr(2, 5)}`,
                        type: (log.level === 'ERROR' || log.level_name === 'ERROR') ? 'bot_error' : 'info',
                        level: log.level || log.level_name || 'INFO',
                        message: log.msg || log.message || '',
                        timestamp: ts,
                        botName: botName
                    });
                });
            }
        });

        // Sort by timestamp descending
        allLogs.sort((a, b) => b.timestamp - a.timestamp);

        // Limit to latest 200 logs to prevent heavy payload
        const recentLogs = allLogs.slice(0, 200);

        return NextResponse.json({ logs: recentLogs });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API /activity/bot-logs] Error:', errorMessage);
        return NextResponse.json({ logs: [], error: errorMessage }, { status: 500 });
    }
}
