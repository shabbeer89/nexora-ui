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

// GET /api/archived-bots/[database]/performance - Get performance metrics
export async function GET(
    request: Request,
    { params }: { params: Promise<{ database: string }> }
) {
    try {
        const { database } = await params;

        const response = await fetch(`${API_URL}/archived-bots/${encodeURIComponent(database)}/performance`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to fetch archived bot performance:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch archived bot performance' },
            { status: 500 }
        );
    }
}
