import { NextRequest, NextResponse } from 'next/server';

/**
 * Token Refresh API Route
 * 
 * Proxies token refresh requests to Hummingbot API backend.
 * Automatically refreshes both access and refresh tokens.
 */

const API_URL = process.env.HUMMINGBOT_API_URL || process.env.NEXORA_API_URL || 'http://localhost:8888';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return NextResponse.json(
                { detail: 'Refresh token required' },
                { status: 400 }
            );
        }

        // Forward to Hummingbot API
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { detail: error.detail || 'Token refresh failed' },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('[Token Refresh Error]:', error);
        return NextResponse.json(
            { detail: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
