import { NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = () => {
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

// POST /api/strategies/[name]/version - Create new version
export async function POST(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name: strategyName } = await params;
        const body = await request.json();
        const { code, config, bump = 'patch', changelog = '', auto_deploy = false } = body;

        if (!code || !config) {
            return NextResponse.json(
                { error: 'code and config are required' },
                { status: 400 }
            );
        }

        const response = await fetch(`${API_URL}/strategies/${encodeURIComponent(strategyName)}/version`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ code, config, bump, changelog, auto_deploy }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to create version:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create version' },
            { status: 500 }
        );
    }
}
