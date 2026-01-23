import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_API_URL || 'http://localhost:8888';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward to Nexora Bot API
        const response = await fetch(`${API_URL}/api/trades/manual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.detail || 'Manual trade execution failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('[Manual Trade Proxy Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
