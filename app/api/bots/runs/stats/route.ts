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
 * GET /api/bots/runs/stats
 * Get bot run statistics
 */
export async function GET(request: Request) {
    try {
        const response = await fetch(`${API_URL}/bot-orchestration/bot-runs/stats`, {
            headers: getAuthHeaders(request),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.detail || 'Failed to fetch bot run stats' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching bot run stats:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Hummingbot API' },
            { status: 500 }
        );
    }
}
