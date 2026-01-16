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

// GET /api/accounts - List all accounts
export async function GET() {
    try {
        const response = await fetch(`${API_URL}/accounts/`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Failed to fetch accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch accounts' },
            { status: 500 }
        );
    }
}

// POST /api/accounts - Create new account
export async function POST(request: Request) {
    try {
        const { accountName } = await request.json();

        if (!accountName) {
            return NextResponse.json(
                { error: 'Account name is required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/accounts/add-account?account_name=${encodeURIComponent(accountName)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to create account:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create account' },
            { status: 500 }
        );
    }
}

// DELETE /api/accounts - Delete account
export async function DELETE(request: Request) {
    try {
        const { accountName } = await request.json();

        if (!accountName) {
            return NextResponse.json(
                { error: 'Account name is required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/accounts/delete-account?account_name=${encodeURIComponent(accountName)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to delete account:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete account' },
            { status: 500 }
        );
    }
}
