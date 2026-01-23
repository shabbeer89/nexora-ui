import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = () => {
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

// GET /api/gateway/wallets - List all Gateway wallets
export async function GET() {
    try {
        const response = await fetch(`${API_URL}/accounts/gateway/wallets`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to fetch Gateway wallets:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch Gateway wallets' },
            { status: 500 }
        );
    }
}

// POST /api/gateway/wallets - Add a new Gateway wallet
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { chain, private_key } = body;

        if (!chain || !private_key) {
            return NextResponse.json(
                { error: 'chain and private_key are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/accounts/gateway/add-wallet`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ chain, private_key }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to add Gateway wallet:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add Gateway wallet' },
            { status: 500 }
        );
    }
}

// DELETE /api/gateway/wallets - Remove a Gateway wallet
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { chain, address } = body;

        if (!chain || !address) {
            return NextResponse.json(
                { error: 'chain and address are required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${API_URL}/accounts/gateway/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
            {
                method: 'DELETE',
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to remove Gateway wallet:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to remove Gateway wallet' },
            { status: 500 }
        );
    }
}
