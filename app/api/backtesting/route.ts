
import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

/**
 * POST /api/backtesting
 * Run backtesting analysis
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Forward to Nexora Bot API
        const response = await axios.post(
            `${API_URL}/api/backtesting/run`,
            body,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Backtesting] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
