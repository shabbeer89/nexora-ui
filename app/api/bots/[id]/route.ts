/**
 * Bot Detail API Route
 * =====================
 * GET /api/bots/[id] - Get bot status, logs, performance, and configuration
 * DELETE /api/bots/[id] - Delete a bot via Hummingbot API
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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 10000
        };

        // Resolve ID to Bot Name if necessary
        // We fetch bot runs to find the name associated with this ID (if it is an instance_id)
        let botName = id;
        try {
            const runsRes = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
            if (runsRes.status === 200 && Array.isArray(runsRes.data?.data)) {
                const match = runsRes.data.data.find((r: any) => r.instance_id === id || r.bot_name === id);
                if (match) {
                    botName = match.bot_name;
                }
            }
        } catch (e) {
            // If lookup fails, assume ID is the name (fallback)
        }

        console.log(`[Bot Detail] Fetching bot: ${botName} (ID: ${id})`);


        // Fetch bot status, config, bot run info, and Docker status in parallel
        const [statusRes, configRes, botRunsRes, dockerStatusRes] = await Promise.allSettled([
            axios.get(`${API_URL}/bot-orchestration/${botName}/status`, axiosConfig),
            axios.get(`${API_URL}/scripts/configs/${botName}`, axiosConfig),
            axios.get(`${API_URL}/bot-orchestration/bot-runs?bot_name=${botName}&limit=1`, axiosConfig),
            axios.get(`${API_URL}/docker/active-containers?name_filter=${botName}`, axiosConfig)
        ]);

        // Process Status
        let statusData: any = {};
        let statusStatusCode = 0;

        if (statusRes.status === 'fulfilled') {
            const res = statusRes.value;
            statusStatusCode = res.status;
            if (res.status === 401) {
                console.log('[Bot Detail] Authentication failed');
                return NextResponse.json(
                    { error: 'Not authenticated', details: res.data },
                    { status: 401 }
                );
            }
            statusData = res.data?.data || res.data || {};
        } else {
            console.warn(`[Bot Detail] Failed to fetch status for ${botName}:`, statusRes.reason?.message);
            // If status fails completely (e.g. 404 upstream or 500), we still might want to show config if available
            // But if it's 404, usually that means bot doesn't exist.
            if (statusRes.reason?.response?.status === 404) {
                // Check if config exists - if so, it might be a stopped bot that status endpoint doesn't know about
                // If config also fails, then it's a true 404
            }
        }

        // Process Config
        let configData: Record<string, any> = {};
        if (configRes.status === 'fulfilled' && configRes.value.status === 200) {
            configData = configRes.value.data || {};
        } else {
            console.warn(`[Bot Detail] Failed to fetch config for ${botName}:`, configRes.status === 'rejected' ? configRes.reason?.message : configRes.value?.status);
        }

        // Process Bot Runs
        let botRunData: {
            deployedAt?: string;
            stoppedAt?: string;
            strategyType?: string;
            strategyName?: string;
            imageVersion?: string;
            runStatus?: string;
            deploymentStatus?: string;
        } = {};

        if (botRunsRes.status === 'fulfilled' && botRunsRes.value.status === 200) {
            const data = botRunsRes.value.data;
            if (data?.data?.length > 0) {
                const run = data.data[0];
                botRunData = {
                    deployedAt: run.deployed_at,
                    stoppedAt: run.stopped_at,
                    strategyType: run.strategy_type,
                    strategyName: run.strategy_name,
                    imageVersion: run.image_version,
                    runStatus: run.run_status,
                    deploymentStatus: run.deployment_status
                };
            }
        }

        // Process Docker Status
        let dockerContainerData = null;
        if (dockerStatusRes.status === 'fulfilled' && dockerStatusRes.value.status === 200) {
            const containers = dockerStatusRes.value.data;
            if (Array.isArray(containers)) {
                dockerContainerData = containers.find((c: any) => c.name === botName);
            }
        }

        // 4. LOG MERGE: Always fetch file-based logs from disk and merge with MQTT logs.
        // Headless bots always emit exactly 1 MQTT startup message but write full strategy
        // output to files like logs_v2_directional_rsi.log — these are the real logs.
        try {
            const logFileRes = await axios.get(`${API_URL}/bot-orchestration/instance-logs/${botName}`, axiosConfig).catch(() => null);
            if (logFileRes?.status === 200 && logFileRes.data?.logs && logFileRes.data.logs.length > 0) {
                const fileLogs = logFileRes.data.logs.map((l: string, i: number) => ({
                    msg: l,
                    level_name: l.includes(' - ERROR') ? 'ERROR' : l.includes(' - WARNING') ? 'WARNING' : 'INFO',
                    timestamp: Date.now() / 1000 - (logFileRes.data.logs.length - i),
                    logger_name: 'logfile'
                }));
                // Merge: put file logs first (chronological), then MQTT logs on top (newest)
                const mqttLogs = statusData.general_logs || [];
                const merged = [...fileLogs, ...mqttLogs];
                // Deduplicate by message content
                const seen = new Set<string>();
                statusData.general_logs = merged.filter(l => {
                    if (seen.has(l.msg)) return false;
                    seen.add(l.msg);
                    return true;
                });
            }
        } catch (e) { }

        // Calculate runtime if bot is running
        let runtime: { hours: number; minutes: number; totalMs: number } | null = null;
        if (botRunData.deployedAt && !botRunData.stoppedAt) {
            const deployedAt = new Date(botRunData.deployedAt);
            const now = new Date();
            const diffMs = now.getTime() - deployedAt.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            runtime = { hours, minutes, totalMs: diffMs };
        }

        // Determine derived status
        const isDockerRunning = dockerContainerData?.status === 'running';
        const isBotRunning = statusData.status === 'running';
        const isRecentlyActive = statusData.recently_active || false;

        let derivedStatus = 'stopped';
        if (isBotRunning) {
            derivedStatus = 'running';
        } else if (isDockerRunning) {
            // For V1 scripts that don't report controller status, 
            // we trust Docker + Recent Activity (heartbeats)
            if (isRecentlyActive) {
                derivedStatus = 'running';
            } else {
                derivedStatus = 'starting';
            }
        } else if (botRunData.runStatus === 'FAILED') {
            derivedStatus = 'error';
        }

        // If we have absolutely no data (all failed), then throw error
        if (statusRes.status === 'rejected' && configRes.status === 'rejected' && botRunsRes.status === 'rejected') {
            throw new Error('All upstream requests failed');
        }

        // Merge and return comprehensive data
        return NextResponse.json({
            status: 'success',
            data: {
                name: botName, // Explicitly ensure name is present
                status: derivedStatus,
                docker_status: dockerContainerData?.status || 'missing',
                ...statusData,
                config: configData,
                botRun: botRunData,
                runtime,
                // Extract key config fields for easy access
                strategy: configData.script_file_name || configData.strategy || 'Unknown',
                exchange: configData.connector_name || configData.exchange || 'paper',
                tradingPair: configData.trading_pair || configData.market || 'N/A',
                // Controller configs if present
                controllers: configData.controllers_config || []
            }
        });

    } catch (error: any) {
        console.error(`[Bot Detail] Error fetching bot ${id} from ${API_URL}:`, error.message);
        if (error.response) {
            console.error('[Bot Detail] Upstream response:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        return NextResponse.json(
            {
                error: 'Failed to fetch bot details',
                message: error.message,
                details: error.response?.data?.detail || error.response?.data
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 30000
        };

        // Resolve ID to Bot Name if necessary
        let botName = id;
        try {
            const runsRes = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
            if (runsRes.status === 200 && Array.isArray(runsRes.data?.data)) {
                const match = runsRes.data.data.find((r: any) => r.instance_id === id || r.bot_name === id);
                if (match) {
                    botName = match.bot_name;
                }
            }
        } catch (e) {
            // If lookup fails, assume ID is the name
        }

        console.log(`[Bot Delete] Deleting bot: ${botName} (ID: ${id})`);

        let archiveSucceeded = false;
        let archiveError = null;

        // Step 1: Try to stop and archive the bot (only works if bot is in active_bots)
        console.log(`[Bot Delete] Attempting to stop and archive bot: ${botName}`);
        try {
            const archiveResponse = await axios.post(
                `${API_URL}/bot-orchestration/stop-and-archive-bot/${botName}`,
                {},
                axiosConfig
            );
            console.log(`[Bot Delete] Archive response:`, archiveResponse.data);
            archiveSucceeded = archiveResponse.data.status === 'success';
        } catch (e: any) {
            archiveError = e.response?.data?.message || e.message;
            console.log(`[Bot Delete] Archive failed (bot may not be in active_bots): ${archiveError}`);
            // Continue with force cleanup
        }

        // Step 2: Stop the Docker container if still running
        try {
            await axios.post(
                `${API_URL}/docker/stop-container/${botName}`,
                {},
                axiosConfig
            );
            console.log(`[Bot Delete] Docker container stopped`);
        } catch (e) {
            console.log(`[Bot Delete] Container stop skipped (may not exist)`);
        }

        // Step 3: Remove the Docker container
        try {
            await axios.post(
                `${API_URL}/docker/remove-container/${botName}`,
                {},
                axiosConfig
            );
            console.log(`[Bot Delete] Docker container removed`);
        } catch (e) {
            console.log(`[Bot Delete] Container removal skipped (may not exist)`);
        }

        // Step 4: Delete config file
        try {
            await axios.delete(
                `${API_URL}/scripts/configs/${botName}`,
                axiosConfig
            );
            console.log(`[Bot Delete] Config deleted`);
        } catch (e) {
            console.log(`[Bot Delete] Config deletion skipped (may not exist)`);
        }

        // Step 5: ALWAYS force delete the instance folder
        // This is critical for cleaning up orphaned directories from crashed/stopped bots
        let instanceDeleted = false;
        try {
            const forceDeleteResponse = await axios.delete(
                `${API_URL}/bot-orchestration/force-delete-instance/${botName}`,
                axiosConfig
            );
            console.log(`[Bot Delete] Force-delete response:`, forceDeleteResponse.data);
            instanceDeleted = forceDeleteResponse.data.folder_deleted || false;
        } catch (e: any) {
            console.log(`[Bot Delete] Force-delete failed: ${e.message}`);
        }

        return NextResponse.json({
            success: true,
            message: archiveSucceeded
                ? 'Bot deleted and archived successfully'
                : 'Bot deleted (archive skipped - bot was not running)',
            details: {
                archived: archiveSucceeded,
                archiveError: archiveError,
                configDeleted: true,
                instanceDeleted: instanceDeleted
            }
        });

    } catch (error: any) {
        console.error('[Bot Delete] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to delete bot', details: error.response?.data?.detail || error.message },
            { status: 500 }
        );
    }
}
