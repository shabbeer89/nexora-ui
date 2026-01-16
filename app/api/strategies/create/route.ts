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

// POST /api/strategies/create - Create new strategy
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, code, config } = body;

        if (!name || !description || !code || !config) {
            return NextResponse.json(
                { error: 'name, description, code, and config are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/strategies/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, description, code, config }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to create strategy:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create strategy' },
            { status: 500 }
        );
    }
}
