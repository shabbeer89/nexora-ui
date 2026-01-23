/**
 * Bot Start API Route
 * =====================
 * POST /api/bots/[id]/start - Start a bot via Hummingbot API
 * 
 * This route:
 * 1. Starts the Docker container if it's not running
 * 2. Fetches the bot's script configuration
 * 3. Sends start command with script and conf parameters
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
        console.log(`[Bot Start] Bot ID: ${id}`);

        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 30000
        };

        // Step 1: Check if container is running, if not start it
        console.log(`[Bot Start] Checking if container ${id} is running...`);
        const activeRes = await axios.get(`${API_URL}/docker/active-containers`, axiosConfig);
        const activeContainers = Array.isArray(activeRes.data) ? activeRes.data : [];
        const isRunning = activeContainers.some((c: any) => c.name === id);

        if (!isRunning) {
            console.log(`[Bot Start] Container ${id} not running, starting it...`);
            const startContainerRes = await axios.post(
                `${API_URL}/docker/start-container/${id}`,
                {},
                axiosConfig
            );
            console.log(`[Bot Start] Container start response:`, startContainerRes.data);

            // Wait for container to start
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Step 2: Get the bot's script configuration
        console.log(`[Bot Start] Fetching config for ${id}...`);
        const configRes = await axios.get(`${API_URL}/scripts/configs/${id}`, axiosConfig);

        let script = 'simple_pmm';  // Default script
        let conf = id;               // Default to bot name

        if (configRes.status === 200 && configRes.data) {
            // Extract script name (remove .py extension if present)
            if (configRes.data.script_file_name) {
                script = configRes.data.script_file_name.replace('.py', '');
            }
            // The conf is the config file name (without .yml)
            conf = id;
        }

        console.log(`[Bot Start] Starting bot with script=${script}, conf=${conf}`);

        // Step 3: Send start command with script and conf parameters
        const response = await axios.post(
            `${API_URL}/bot-orchestration/start-bot`,
            {
                bot_name: id,
                script: script,
                conf: conf,
                log_level: "INFO"
            },
            axiosConfig
        );

        if (response.status === 200 && response.data?.status === 'success') {
            return NextResponse.json({
                success: true,
                message: 'Bot started',
                data: response.data,
                config: { script, conf }
            });
        }

        // Return error details
        return NextResponse.json(
            {
                error: 'Failed to start bot',
                details: response.data?.response?.message || response.data?.detail || 'Unknown error',
                apiResponse: response.data
            },
            { status: response.status >= 400 ? response.status : 500 }
        );

    } catch (error: any) {
        console.error('[Bot Start] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to start bot', details: error.response?.data?.detail || error.message },
            { status: 500 }
        );
    }
}
