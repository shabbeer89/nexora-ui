/**
 * Scenario Stop API Route
 * =========================
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

        const response = await fetch(`${API_URL}/api/scenarios/${scenarioId}/stop`, {
            method: 'POST',
            headers,
            signal: AbortSignal.timeout(15000),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error(`[ScenarioStop] Error stopping ${scenarioId}:`, error.message);
        return NextResponse.json(
            { error: `Failed to stop scenario: ${error.message}` },
            { status: 500 }
        );
    }
}
