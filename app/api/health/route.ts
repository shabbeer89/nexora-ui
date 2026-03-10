/**
 * Health Check API Route — Proxy to Nexora Backend
 * ==================================================
 * GET /api/health - Proxies to Nexora Bot API /api/health
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_BACKEND_URL || process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

export async function GET() {
    const startTime = Date.now();

    try {
        const response = await fetch(`${API_URL}/api/health`, {
            signal: AbortSignal.timeout(5000),
        });

        const data = await response.json();
        return NextResponse.json({
            ...data,
            responseTime: Date.now() - startTime,
        });
    } catch (error: any) {
        console.error('[Health] Backend unreachable:', error.message);

        return NextResponse.json({
            status: 'unhealthy',
            backendUrl: API_URL,
            error: error.code === 'ECONNREFUSED'
                ? 'Nexora API not running'
                : error.message,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}
