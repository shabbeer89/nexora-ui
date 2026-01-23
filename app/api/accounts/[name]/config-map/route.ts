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

// GET /api/accounts/[name]/config-map - Get connector config fields
export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name: connectorName } = await params;

        const response = await fetch(`${API_URL}/connectors/${encodeURIComponent(connectorName)}/config-map`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Failed to fetch config map:', error);
        return NextResponse.json(
            { error: 'Failed to fetch config map' },
            { status: 500 }
        );
    }
}
