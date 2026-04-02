/**
 * Scenario Start/Stop API Routes
 * ================================
 * POST /api/scenarios/[id]/start — Proxy to backend
 * POST /api/scenarios/[id]/stop — Proxy to backend
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_BACKEND_URL || process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: scenarioId } = await params;

    try {
        const authHeader = request.headers.get('authorization');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        let body;
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        const response = await fetch(`${API_URL}/api/scenarios/${scenarioId}/start`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[ScenarioStart] Error starting ${scenarioId}:`, error.message);
        return NextResponse.json(
            { error: `Failed to start scenario: ${error.message}` },
            { status: 500 }
        );
    }
}
