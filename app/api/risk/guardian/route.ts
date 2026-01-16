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

// GET /api/risk/guardian - Get Guardian risk service status
export async function GET() {
    try {
        const response = await fetch(`${API_URL}/risk/guardian`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to get Guardian status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get Guardian status' },
            { status: 500 }
        );
    }
}

// POST /api/risk/guardian - Reset circuit breaker
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'reset_circuit_breaker') {
            const response = await fetch(`${API_URL}/risk/guardian/reset-circuit-breaker`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Backend returned ${response.status}`);
            }

            const data = await response.json();
            return NextResponse.json(data);
        }

        return NextResponse.json(
            { error: 'Invalid action. Supported: reset_circuit_breaker' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('[API] Failed to perform Guardian action:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to perform Guardian action' },
            { status: 500 }
        );
    }
}
