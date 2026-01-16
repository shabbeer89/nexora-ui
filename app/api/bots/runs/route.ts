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
 * GET /api/bots/runs
 * Fetch bot deployment history
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Build query params
        const params = new URLSearchParams();
        if (searchParams.get('bot_name')) params.append('bot_name', searchParams.get('bot_name')!);
        if (searchParams.get('account_name')) params.append('account_name', searchParams.get('account_name')!);
        if (searchParams.get('strategy_type')) params.append('strategy_type', searchParams.get('strategy_type')!);
        if (searchParams.get('run_status')) params.append('run_status', searchParams.get('run_status')!);
        if (searchParams.get('limit')) params.append('limit', searchParams.get('limit')!);
        if (searchParams.get('offset')) params.append('offset', searchParams.get('offset')!);

        const response = await fetch(`${API_URL}/bot-orchestration/bot-runs?${params.toString()}`, {
            headers: getAuthHeaders(request),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.detail || 'Failed to fetch bot runs' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching bot runs:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Hummingbot API' },
            { status: 500 }
        );
    }
}
