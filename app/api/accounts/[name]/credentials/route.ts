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

// GET /api/accounts/[name]/credentials - List credentials for account
export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name: accountName } = await params;

        const response = await fetch(`${API_URL}/accounts/${encodeURIComponent(accountName)}/credentials`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Failed to fetch credentials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch credentials' },
            { status: 500 }
        );
    }
}

// POST /api/accounts/[name]/credentials - Add credential to account
export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name: accountName } = await params;
        const { connectorName, credentials } = await request.json();

        if (!connectorName || !credentials) {
            return NextResponse.json(
                { error: 'Connector name and credentials are required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${API_URL}/accounts/add-credential/${encodeURIComponent(accountName)}/${encodeURIComponent(connectorName)}`,
            {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(credentials),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to add credential:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add credential' },
            { status: 500 }
        );
    }
}

// DELETE /api/accounts/[name]/credentials - Delete credential
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name: accountName } = await params;
        const { connectorName } = await request.json();

        if (!connectorName) {
            return NextResponse.json(
                { error: 'Connector name is required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${API_URL}/accounts/delete-credential/${encodeURIComponent(accountName)}/${encodeURIComponent(connectorName)}`,
            {
                method: 'POST',
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
        console.error('[API] Failed to delete credential:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete credential' },
            { status: 500 }
        );
    }
}
