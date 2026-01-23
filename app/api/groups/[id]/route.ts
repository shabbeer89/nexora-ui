import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        const response = await fetch(`${API_URL}/api/bot-groups/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API /groups/:id] Backend Error:', {
                status: response.status,
                text: errorText,
                body: JSON.stringify(body)
            });
            return NextResponse.json(
                { error: `Backend failed: ${errorText || response.statusText}` },
                { status: response.status }
            );
        }

        const group = await response.json();
        return NextResponse.json(group);
    } catch (error: any) {
        console.error('[API /groups/:id] Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        const response = await fetch(`${API_URL}/api/bot-groups/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to delete group' },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API /groups/:id] Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
