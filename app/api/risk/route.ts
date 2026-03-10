/**
 * Risk API Route — Proxy to Nexora Backend
 * ==========================================
 * GET /api/risk - Proxies to Nexora Bot API /api/risk
 * POST /api/risk - Proxies POST requests to Nexora Bot API /api/risk
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_BACKEND_URL || process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

async function proxyToBackend(request: Request, method: string = 'GET') {
    try {
        const authHeader = request.headers.get('authorization');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(10000),
        };

        if (method === 'POST') {
            try {
                const body = await request.json();
                fetchOptions.body = JSON.stringify(body);
            } catch {
                // No body is fine for POST
            }
        }

        const response = await fetch(`${API_URL}/api/risk`, fetchOptions);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`[Risk] Backend returned ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: `API Error: ${response.statusText}`, detail: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Risk] Proxy error:', error.message);
        return NextResponse.json(
            { error: 'Service Unavailable', detail: error.message },
            { status: 503 }
        );
    }
}

export async function GET(request: Request) {
    return proxyToBackend(request, 'GET');
}

export async function POST(request: Request) {
    return proxyToBackend(request, 'POST');
}
