/**
 * Bot Config API Route
 * =====================
 * PATCH /api/bots/[id]/config - Update bot configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = (request: Request) => {
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { config } = body;

        if (!config) {
            return NextResponse.json({ error: 'Config is required' }, { status: 400 });
        }

        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 10000
        };

        // RESOLVE ID TO BOT NAME
        let botName = id;
        try {
            const runsRes = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
            if (runsRes.status === 200 && Array.isArray(runsRes.data?.data)) {
                const match = runsRes.data.data.find((r: any) =>
                    r.bot_name === id ||
                    String(r.id) === String(id) ||
                    String(r.instance_id) === String(id) ||
                    String(r.instance_name) === String(id)
                );
                if (match) {
                    botName = match.bot_name || match.instance_name;
                }
            }
        } catch (e) { }

        console.log(`[Bot Config] Updating config for ${botName} (ID: ${id})`);

        // Hummingbot API uses POST for create/update config
        const response = await axios.post(
            `${API_URL}/scripts/configs/${botName}`,
            config,
            axiosConfig
        );

        if (response.status === 200 || response.status === 201) {
            return NextResponse.json({
                success: true,
                message: 'Configuration updated successfully',
                data: response.data
            });
        }

        return NextResponse.json(
            {
                error: 'Failed to update configuration',
                details: response.data?.detail || response.data || 'Unknown error'
            },
            { status: response.status >= 400 ? response.status : 500 }
        );

    } catch (error: any) {
        console.error('[Bot Config] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
