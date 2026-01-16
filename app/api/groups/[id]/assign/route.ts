import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: groupId } = await params;
        const body = await req.json();
        const { botIds, action } = body; // action: 'add' | 'remove'
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!Array.isArray(botIds)) {
            return NextResponse.json({ error: 'botIds must be an array' }, { status: 400 });
        }

        if (!['add', 'remove'].includes(action)) {
            return NextResponse.json({ error: 'action must be "add" or "remove"' }, { status: 400 });
        }

        const response = await fetch(`${API_URL}/api/bot-groups/${groupId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                bot_ids: botIds,  // Backend uses snake_case
                action
            })
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to assign/remove bots' },
                { status: response.status }
            );
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API /groups/:id/assign] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
