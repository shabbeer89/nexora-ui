import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

/**
 * POST /api/strategies/:name/rollback
 * Rollback strategy to a previous version
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const { searchParams } = new URL(request.url);
        const toVersion = searchParams.get('to_version');

        const url = new URL(`${API_URL}/strategies/${name}/rollback`);
        if (toVersion) {
            url.searchParams.append('to_version', toVersion);
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: getAuthHeaders(request),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.detail || 'Failed to rollback strategy' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error rolling back strategy:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Hummingbot API' },
            { status: 500 }
        );
    }
}
