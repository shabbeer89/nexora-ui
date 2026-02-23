/**
 * Bot Stop API Route
 * ====================
 * POST /api/bots/[id]/stop - Stop a bot via Hummingbot API
 * This will stop the trading strategy AND stop the Docker container
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = (request: Request) => {
    // ALWAYS use Basic Auth for upstream calls to the Bot/Hummingbot API
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log(`[Bot Stop] Attempting to stop bot: ${id}`);

        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 30000
        };

        // RESOLVE ID TO BOT NAME (CRITICAL FIX)
        // If id is a numeric ID or instance_id, we need the bot_name for orchestrator calls
        let botName = id;
        try {
            const runsRes = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
            if (runsRes.status === 200 && Array.isArray(runsRes.data?.data)) {
                // Check against bot_name, id, or instance_id
                const match = runsRes.data.data.find((r: any) =>
                    r.bot_name === id ||
                    String(r.id) === String(id) ||
                    String(r.instance_id) === String(id) ||
                    String(r.instance_name) === String(id)
                );
                if (match) {
                    botName = match.bot_name || match.instance_name;
                    console.log(`[Bot Stop] Resolved ID ${id} to Bot Name: ${botName}`);
                }
            }
        } catch (e: any) {
            console.warn(`[Bot Stop] ID lookup failed: ${e.message}`);
        }

        // Step 1: Send stop command to trading strategy via MQTT
        console.log(`[Bot Stop] Sending stop-bot command for ${botName}`);
        const stopResponse = await axios.post(
            `${API_URL}/bot-orchestration/stop-bot`,
            {
                bot_name: botName,
                skip_order_cancellation: false
            },
            axiosConfig
        );

        console.log(`[Bot Stop] stop-bot response:`, stopResponse.data);

        // Wait a moment for the strategy to gracefully shutdown
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 2: Stop the Docker container
        console.log(`[Bot Stop] Stopping Docker container: ${botName}`);
        const containerStopResponse = await axios.post(
            `${API_URL}/docker/stop-container/${botName}`,
            {},
            axiosConfig
        );

        console.log(`[Bot Stop] Docker stop response:`, containerStopResponse.data);

        // Check if container stop was successful
        const containerStopped = containerStopResponse.status === 200;

        if (containerStopped) {
            return NextResponse.json({
                success: true,
                message: 'Bot stopped and container shut down',
                data: {
                    strategyStop: stopResponse.data,
                    containerStop: containerStopResponse.data
                }
            });
        }

        // If container stop failed, still return success for strategy stop
        return NextResponse.json({
            success: true,
            message: 'Bot strategy stopped (container may still be running)',
            warning: 'Could not stop Docker container',
            data: {
                strategyStop: stopResponse.data,
                containerStop: containerStopResponse.data
            }
        });

    } catch (error: any) {
        console.error('[Bot Stop] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to stop bot', details: error.response?.data?.detail || error.message },
            { status: 500 }
        );
    }
}
