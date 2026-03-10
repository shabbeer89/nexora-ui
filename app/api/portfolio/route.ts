/**
 * Portfolio API Route — Proxy to Nexora Backend
 * ==============================================
 * GET /api/portfolio - Proxies to Nexora Bot API /api/portfolio
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_BACKEND_URL || process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await fetch(`${API_URL}/api/portfolio`, {
            headers,
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`[Portfolio] Backend returned ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Portfolio] Proxy error:', error.message);
        return NextResponse.json(
            {
                total_value_usd: 0,
                cex: { total_usd: 0, details: {} },
                dex: { total_usd: 0, details: {} },
                timestamp: new Date().toISOString(),
                error: error.message,
            },
            { status: 503 }
        );
    }
}
