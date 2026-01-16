import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

/**
 * POST /api/strategies/:name/deploy
 * Deploy a specific version of a strategy
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const body = await request.json();

        const response = await fetch(`${API_URL}/strategies/${name}/deploy`, {
            method: 'POST',
            headers: getAuthHeaders(request),
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.detail || 'Failed to deploy strategy version' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error deploying strategy version:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Hummingbot API' },
            { status: 500 }
        );
    }
}
