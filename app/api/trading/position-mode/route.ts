import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = () => {
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

// GET /api/trading/position-mode - Get position mode
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const account_name = searchParams.get('account_name');
        const connector_name = searchParams.get('connector_name');

        if (!account_name || !connector_name) {
            return NextResponse.json(
                { error: 'account_name and connector_name are required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${API_URL}/trading/position-mode/${encodeURIComponent(account_name)}/${encodeURIComponent(connector_name)}`,
            { headers: getAuthHeaders() }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to get position mode:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get position mode' },
            { status: 500 }
        );
    }
}

// POST /api/trading/position-mode - Set position mode
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { account_name, connector_name, position_mode } = body;

        if (!account_name || !connector_name || !position_mode) {
            return NextResponse.json(
                { error: 'account_name, connector_name, and position_mode are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/trading/set-position-mode`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                account_name,
                connector_name,
                position_mode // HEDGE or ONEWAY
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to set position mode:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to set position mode' },
            { status: 500 }
        );
    }
}
