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
 * DELETE /api/orders/:id/cancel
 * Cancel a specific order by client order ID
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id: clientOrderId } = resolvedParams;
        const { searchParams } = new URL(request.url);
        const accountName = searchParams.get('account_name');
        const connectorName = searchParams.get('connector_name');

        if (!accountName || !connectorName) {
            return NextResponse.json(
                { error: 'account_name and connector_name are required' },
                { status: 400 }
            );
        }

        const response = await axios.delete(
            `${API_URL}/trading/orders/${accountName}/${connectorName}/${clientOrderId}`,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Cancel Order] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
