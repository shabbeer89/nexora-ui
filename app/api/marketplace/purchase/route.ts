
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { listing_id, ...purchaseData } = body;

        if (!listing_id) {
            return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
        }

        const response = await axios.post(
            `${API_URL}/marketplace/listings/${listing_id}/purchase`,
            purchaseData,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Marketplace] Purchase Error:', error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
