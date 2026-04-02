/**
 * Command Center API Route — Proxy to Nexora Backend
 * ====================================================
 * GET /api/command-center - Proxies to Nexora Bot API /api/command-center
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_BACKEND_URL || process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

export async function GET() {
    const startTime = Date.now();

    try {
        const response = await fetch(`${API_URL}/api/command-center`, {
            signal: AbortSignal.timeout(15000),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json({
            ...data,
            _proxy: {
                responseTime: Date.now() - startTime,
                backendUrl: API_URL,
            },
        });
    } catch (error: any) {
        console.error('[CommandCenter] Backend unreachable:', error.message);

        return NextResponse.json({
            system: {
                status: 'down',
                timestamp: new Date().toISOString(),
                error: error.code === 'ECONNREFUSED'
                    ? 'Nexora API not running'
                    : error.message,
            },
            bots: {
                freqtrade: { status: 'disconnected', paper_trading: true },
                hummingbot: { status: 'disconnected', active_instances: 0 },
                freqai: { status: 'inactive' },
            },
            paper_trading: { mode: 'unknown', controlled_by_nexora: false },
            scenarios: { total_defined: 0, active_count: 0, scenarios: [] },
            orders_and_trades: {
                open_trades: [], recent_closed_trades: [],
                total_open: 0, total_closed: 0,
                aggregate_open_pnl: 0, aggregate_closed_pnl: 0,
            },
            _proxy: {
                responseTime: Date.now() - startTime,
                backendUrl: API_URL,
                error: true,
            },
        }, { status: 503 });
    }
}
