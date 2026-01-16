
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

export async function GET(request: Request, props: { params: Promise<{ slug: string[] }> }) {
    const params = await props.params;
    try {
        const slug = params.slug.join('/');

        const response = await axios.get(
            `${API_URL}/v2/institutional/${slug}`,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(`[Institutional] GET ${params.slug} Error:`, error.message);
        return NextResponse.json(
            { error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: Request, props: { params: Promise<{ slug: string[] }> }) {
    const params = await props.params;
    try {
        const slug = params.slug.join('/');
        const body = await request.json().catch(() => ({}));

        const response = await axios.post(
            `${API_URL}/v2/institutional/${slug}`,
            body,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(`[Institutional] POST ${params.slug} Error:`, error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ slug: string[] }> }) {
    const params = await props.params;
    try {
        const slug = params.slug.join('/');

        const response = await axios.delete(
            `${API_URL}/v2/institutional/${slug}`,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error(`[Institutional] DELETE ${params.slug} Error:`, error.message);
        return NextResponse.json(
            { error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}
