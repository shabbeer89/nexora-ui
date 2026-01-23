import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

/**
 * GET /api/strategies/dca/presets
 * Fetch available DCA strategy presets from backend
 */
export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/strategies/dca/presets`, {
            headers: getAuthHeaders(request),
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch presets' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching DCA presets:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to connect to backend' },
            { status: 500 }
        );
    }
}
