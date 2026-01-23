import { NextResponse } from 'next/server';

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

// POST /api/portfolio/distribution - Get token distribution
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { account_names } = body;

        const response = await fetch(`${API_URL}/portfolio/distribution`, {
            method: 'POST',
            headers: getAuthHeaders(request),
            body: JSON.stringify({
                account_names: account_names?.length ? account_names : null
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Propagate the actual status code so frontend can handle 401 for token refresh
            return NextResponse.json(
                { error: errorData.detail || `Backend returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Transform backend response to frontend expected format
        // Backend returns: { tokens: {...}, total_value, token_count } or { distribution: [...] }
        // Frontend expects: { distribution: [{ token, value, percentage }], total_value }
        if (data.tokens && typeof data.tokens === 'object') {
            const distribution = Object.entries(data.tokens).map(([token, tokenData]: [string, any]) => ({
                token,
                symbol: token,
                value: tokenData.value || 0,
                percentage: tokenData.percentage || 0,
                accounts: tokenData.accounts || {}
            })).sort((a, b) => b.value - a.value);

            return NextResponse.json({
                distribution,
                total_value: data.total_value || 0,
                token_count: data.token_count || distribution.length
            });
        }

        // Already in expected format or different format
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to fetch portfolio distribution:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch portfolio distribution' },
            { status: 500 }
        );
    }
}
