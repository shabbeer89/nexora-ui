
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

export async function GET(request: Request) {
    try {
        const response = await axios.get(
            `${API_URL}/marketplace/categories`,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Marketplace] GET Categories Error:', error.message);
        return NextResponse.json(
            { categories: [], error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}
