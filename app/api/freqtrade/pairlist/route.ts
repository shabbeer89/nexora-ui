import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_API_URL || 'http://localhost:8888';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/api/freqtrade/pairlist`);

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { detail: error.detail || 'Failed to fetch pairlist' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error: any) {
        console.error('[Pairlist Proxy Error]:', error);
        return NextResponse.json(
            { detail: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
