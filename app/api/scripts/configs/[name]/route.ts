import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

// GET /api/scripts/configs/[name] - Get script configuration
export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        const response = await fetch(`${API_URL}/scripts/configs/${name}`, {
            method: 'GET',
            headers: getAuthHeaders(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.detail || `Backend returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to fetch script config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch script configuration' },
            { status: 500 }
        );
    }
}

// POST /api/scripts/configs/[name] - Update script configuration
export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const body = await request.json();

        const response = await fetch(`${API_URL}/scripts/configs/${name}`, {
            method: 'POST',
            headers: getAuthHeaders(request),
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.detail || `Backend returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to update script config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update script configuration' },
            { status: 500 }
        );
    }
}
