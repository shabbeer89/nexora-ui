
import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.toString();

        const response = await axios.get(
            `${API_URL}/marketplace/listings?${query}`,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Marketplace] GET Listings Error:', error.message);
        return NextResponse.json(
            { listings: [], count: 0, error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await axios.post(
            `${API_URL}/marketplace/listings`,
            body,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Marketplace] Create Listing Error:', error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
