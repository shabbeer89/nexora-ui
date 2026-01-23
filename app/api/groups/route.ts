import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_API_URL || 'http://localhost:8888';

function getAuthHeaders() {
    // Get token from request cookies or localStorage (will be passed from client)
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

export async function GET(req: NextRequest) {
    try {
        // Get token from request header
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        const response = await fetch(`${API_URL}/api/bot-groups`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch groups from backend' },
                { status: response.status }
            );
        }

        const groups = await response.json();
        return NextResponse.json(groups);
    } catch (error: any) {
        console.error('[API /groups] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        const response = await fetch(`${API_URL}/api/bot-groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to create group' },
                { status: response.status }
            );
        }

        const group = await response.json();
        return NextResponse.json(group);
    } catch (error: any) {
        console.error('[API /groups] Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
