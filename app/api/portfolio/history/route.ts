import { NextResponse } from 'next/server';

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

// POST /api/portfolio/history - Get portfolio history
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            account_names,
            start_date,
            end_date,
            start_time, // milliseconds timestamp
            end_time,   // milliseconds timestamp
            interval = '1h',
            limit = 100
        } = body;

        // Convert ISO string dates to millisecond timestamps if needed
        const startTimestamp = start_time || (start_date ? new Date(start_date).getTime() : undefined);
        const endTimestamp = end_time || (end_date ? new Date(end_date).getTime() : undefined);

        const response = await fetch(`${API_URL}/portfolio/history`, {
            method: 'POST',
            headers: getAuthHeaders(request),
            body: JSON.stringify({
                account_names: account_names?.length ? account_names : null,
                start_time: startTimestamp,
                end_time: endTimestamp,
                interval,
                limit
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
        // Backend returns: { data: [...], pagination: {...} }
        // Frontend expects: array of { timestamp, value } or { history: [...] }
        if (data.data && Array.isArray(data.data)) {
            // Transform each history point to include total value
            const history = data.data.map((point: any) => {
                let totalValue = 0;
                const timestamp = point.timestamp;

                // Sum up values from all accounts and connectors
                for (const [key, value] of Object.entries(point)) {
                    if (key !== 'timestamp' && typeof value === 'object' && value !== null) {
                        const accountData = value as Record<string, any>;
                        for (const [connectorName, connectorData] of Object.entries(accountData)) {
                            if (Array.isArray(connectorData)) {
                                for (const token of connectorData) {
                                    if (token.value) {
                                        totalValue += parseFloat(token.value) || 0;
                                    }
                                }
                            }
                        }
                    }
                }

                return { timestamp, value: totalValue };
            });

            return NextResponse.json({ history, pagination: data.pagination });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[API] Failed to fetch portfolio history:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch portfolio history' },
            { status: 500 }
        );
    }
}
