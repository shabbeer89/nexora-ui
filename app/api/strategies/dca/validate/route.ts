import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';
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
 * POST /api/strategies/dca/validate
 * Validate DCA configuration and calculate required capital
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${API_URL}/strategies/dca/validate`, {
            method: 'POST',
            headers: getAuthHeaders(request),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.detail || 'Validation failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error validating DCA config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to validate configuration' },
            { status: 500 }
        );
    }
}
