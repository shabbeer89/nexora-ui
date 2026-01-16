/**
 * Bots API Route
 * ===============
 * GET /api/bots - List all bots from Hummingbot API
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

// Token cache for server-side auth
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getServerToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
        return cachedToken.token;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(API_USER)}&password=${encodeURIComponent(API_PASS)}`,
        });

        if (!response.ok) {
            throw new Error(`Auth failed: ${response.status}`);
        }

        const data = await response.json();
        cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in || 900) * 1000,
        };
        return cachedToken.token;
    } catch (error) {
        console.error('[API /bots] Server auth failed:', error);
        throw error;
    }
}

const getAuthHeaders = async (request: Request) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader || `Bearer ${await getServerToken()}`;
    return {
        'Content-Type': 'application/json',
        'Authorization': token
    };
};

export async function GET(request: NextRequest) {
    try {
        const axiosConfig = {
            headers: await getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 25000 // 25 second timeout for bot status/docker checks
        };

        // 1. Get all bot runs (deployed bots)
        const botRunsResponse = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);

        // 2. Get running bot statuses from orchestrator
        const statusResponse = await axios.get(`${API_URL}/bot-orchestration/status`, axiosConfig);
        const runningBots = statusResponse.data?.data || {};

        // 3. Get Docker container statuses for accurate running detection
        let dockerContainers: Record<string, any> = {};
        try {
            const dockerResponse = await axios.get(`${API_URL}/docker/active-containers`, axiosConfig);
            if (Array.isArray(dockerResponse.data)) {
                for (const container of dockerResponse.data) {
                    dockerContainers[container.name] = container;
                }
            }
        } catch (err) {
            console.log('[API /bots] Could not fetch Docker containers, falling back to orchestrator status');
        }

        // 4. Get all script configs for strategy details
        // This is no longer used for individual bot config fetching, but kept for potential future use or debugging
        const configsResponse = await axios.get(`${API_URL}/scripts/configs/`, axiosConfig);
        const configs: Record<string, any> = {};
        if (Array.isArray(configsResponse.data)) {
            for (const cfg of configsResponse.data) {
                configs[cfg.config_name] = cfg;
            }
        }

        // 5. Get recent trades for performance calculation fallback
        let globalTrades: any[] = [];
        try {
            const tradesResponse = await axios.post(`${API_URL}/trading/trades`, {
                limit: 1000,
                start_time: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000) // Last 30 days
            }, axiosConfig);
            if (tradesResponse.data?.data) {
                globalTrades = tradesResponse.data.data;
            } else if (Array.isArray(tradesResponse.data)) {
                globalTrades = tradesResponse.data;
            }
        } catch (err) {
            console.log('[API /bots] Could not fetch trades');
        }

        const bots = [];
        const botRuns = botRunsResponse.data?.data || [];
        const seenBots = new Set<string>(); // Deduplicate bot entries

        // Sequential processing to ensure stability and correct auth/config fetching
        for (const run of botRuns) {
            const botName = run.bot_name || run.instance_name;

            // Skip archived bots
            if (run.is_archived) continue;

            // Skip duplicate bot entries
            if (seenBots.has(botName)) continue;
            seenBots.add(botName);

            // Start with 'stopped' status if not found in orchestrator
            let botStatus = runningBots[botName] || { status: 'stopped', performance: {} };

            // Check Docker container status directly for accurate status
            const dockerContainer = dockerContainers[botName];
            const containerIsRunning = dockerContainer?.status === 'running';

            // Trust Docker container status over orchestrator for determining if bot is running
            const isRunning = containerIsRunning || botStatus?.status === 'running';
            const isStopped = !containerIsRunning && botStatus?.status === 'stopped';

            if (containerIsRunning && dockerContainer) {
                console.log(`[API /bots] ${botName} Docker Info:`, JSON.stringify(dockerContainer.state || dockerContainer));
            }

            // Get config details for this bot (Reverted to original reliable method)
            const configName = run.config_name?.replace('.yml', '') || botName;
            let configDetails: any = null;

            try {
                const configRes = await axios.get(`${API_URL}/scripts/configs/${configName}`, axiosConfig);
                if (configRes.status === 200) {
                    configDetails = configRes.data;
                }
            } catch (e) {
                // Config may not exist or fetch failed
            }

            // Treat as deleted/ghost if no config file AND not running in Docker
            if (!configDetails && !containerIsRunning) {
                continue;
            }

            // Calculate Performance
            let pnl24h = 0;
            let trades24h = 0;
            let volume24h = 0;
            let fees24h = 0;
            let lastErrorTimestamp = 0;

            // Extract last error from logs if available
            if (botStatus?.log_records && Array.isArray(botStatus.log_records)) {
                // Find highest timestamp where level is ERROR
                botStatus.log_records.forEach((log: any) => {
                    if ((log.level_name === 'ERROR' || log.level_no >= 40) && log.timestamp) {
                        // timestamp is usually in seconds (float), convert to ms if needed or keep consistent
                        const ts = log.timestamp * 1000; // Log timestamp is usually float seconds
                        if (ts > lastErrorTimestamp) {
                            lastErrorTimestamp = ts;
                        }
                    }
                });

                if (botName === 'PMM2') {
                    console.log(`[API /bots] PMM2 Log Records: ${botStatus.log_records.length}, Found Error TS: ${lastErrorTimestamp}`);
                }
            } else {
                if (botName === 'PMM2') {
                    console.log(`[API /bots] PMM2 has NO log_records. Keys: ${Object.keys(botStatus || {}).join(', ')}`);
                }
            }

            console.log(`[API /bots] Processing ${botName}: botStatus.performance=`, JSON.stringify(botStatus?.performance));

            // 1. Try orchestrator status first - check if we have ACTUAL performance data
            const hasOrchestratorData = botStatus?.performance &&
                (typeof botStatus.performance.total_trades === 'number' && botStatus.performance.total_trades > 0) ||
                (typeof botStatus.performance.pnl === 'number' && botStatus.performance.pnl !== 0);

            if (hasOrchestratorData) {
                console.log(`[API /bots] ${botName}: Using orchestrator performance`);
                pnl24h = botStatus.performance.pnl || 0;
                trades24h = botStatus.performance.total_trades || 0;
            } else {
                console.log(`[API /bots] ${botName}: Falling back to global trades / local DB`);
                // 2. Global Trades Fallback
                const botTrades = globalTrades.filter(t =>
                    t.bot_name === botName ||
                    t.instance_id === botName ||
                    t.config_file_path?.includes(botName)
                );

                if (botTrades.length > 0) {
                    const { calculateFIFO } = await import('@/lib/pnl-calculator');
                    const pnlResult = calculateFIFO(botTrades);
                    pnl24h = pnlResult.totalRealizedPnL;
                    trades24h = pnlResult.totalTrades;
                    volume24h = pnlResult.totalVolume;
                    fees24h = pnlResult.totalFees;
                }

                // 3. Local DB Fallback (Always check if we have 0 trades, for Paper Trading reliability)
                if (trades24h === 0) {
                    try {
                        const dbPath = `bots/instances/${botName}/data/${botName}.sqlite`;
                        console.log(`[API /bots] Trying local DB fallback for ${botName}: ${dbPath}`);

                        // Get a fresh server token for this internal request
                        const serverToken = await getServerToken();

                        const localTradesRes = await axios.get(
                            `${API_URL}/archived-bots/${encodeURIComponent(dbPath)}/trades?limit=1000`,
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${serverToken}`
                                },
                                validateStatus: () => true
                            }
                        );

                        console.log(`[API /bots] Local DB response for ${botName}: status=${localTradesRes.status}, trades=${localTradesRes.data?.trades?.length || 0}`);

                        if (localTradesRes.data?.trades && localTradesRes.data.trades.length > 0) {
                            const { calculateFIFO } = await import('@/lib/pnl-calculator');
                            const pnlResult = calculateFIFO(localTradesRes.data.trades);
                            pnl24h = pnlResult.totalRealizedPnL;
                            trades24h = pnlResult.totalTrades;
                            volume24h = pnlResult.totalVolume;
                            fees24h = pnlResult.totalFees;
                            console.log(`[API /bots] Calculated PnL for ${botName}: trades=${trades24h}, pnl=${pnl24h}, volume=${volume24h}, fees=${fees24h}`);
                        }
                    } catch (err: any) {
                        console.error(`[API /bots] Local DB fallback error for ${botName}:`, err.message);
                    }
                }
            }

            const botEntry = {
                id: run.instance_id || botName,
                name: botName,
                status: isRunning ? 'running' : (isStopped ? 'stopped' : 'error'),
                type: run.strategy_name || configDetails?.script_file_name?.replace('.py', '') || 'pmm',
                strategy: configDetails?.script_file_name?.replace('.py', '') || run.strategy_name || 'simple_pmm',
                exchange: configDetails?.exchange || 'unknown',
                tradingPair: configDetails?.trading_pair || 'unknown',
                performance: {
                    total_pnl: pnl24h,
                    total_trades: trades24h,
                    total_volume: volume24h,
                    total_fees: fees24h,
                    last_error_timestamp: lastErrorTimestamp > 0 ? lastErrorTimestamp : undefined,
                    log_counts: undefined as { errors: number; warnings: number; infos: number; } | undefined, // Will be populated below
                    debug_bot_name: botName,
                    debug_pnl_source: hasOrchestratorData ? 'orchestrator' : (pnl24h !== 0 ? 'calculated' : 'empty')
                },
                config: configDetails || {},
                deployedAt: run.deployed_at,
                startedAt: dockerContainer?.started_at,
                runStatus: run.run_status,
                deploymentStatus: run.deployment_status,
                recentlyActive: botStatus?.recently_active || containerIsRunning,
                containerRunning: containerIsRunning
            };

            // Calculate Log Counts for UI
            const allLogs = [
                ...(botStatus?.log_records || []),
                ...(botStatus?.error_logs || []),
                ...(botStatus?.general_logs || [])
            ];

            if (allLogs.length > 0) {
                console.log(`[API /bots] ${botName} has ${allLogs.length} logs`);
                // Sort logs by timestamp descending (newest first)
                // Timestamps are usually floats (seconds), verify structure
                const sortedLogs = allLogs.sort((a: any, b: any) => {
                    const tA = a.timestamp || 0;
                    const tB = b.timestamp || 0;
                    return tB - tA;
                });

                let consecutiveInfos = 0;
                let totalErrors = 0;
                let totalWarnings = 0;
                let totalInfos = 0;

                // 1. Calculate consecutive infos from the top (latest)
                for (const log of sortedLogs) {
                    const isInfo = log.level_name === 'INFO' || log.level_no === 20;
                    if (isInfo) {
                        consecutiveInfos++;
                    } else {
                        break; // Stop at first non-info
                    }
                }

                // 2. Calculate totals
                sortedLogs.forEach((log: any) => {
                    if (log.level_name === 'ERROR' || log.level_no >= 40) totalErrors++;
                    else if (log.level_name === 'WARNING' || log.level_no === 30) totalWarnings++;
                    else if (log.level_name === 'INFO' || log.level_no === 20) totalInfos++;
                });

                // 3. Apply Recovery Logic (User Rule: if consecutive infos > 10, reset error/warning to 0)
                // Note: User said "> 10" (strictly greater) or ">= 10"?
                // "If the consecutive infos count > 10 then color-blue" -> > 10.
                if (consecutiveInfos > 10) {
                    totalErrors = 0;
                    totalWarnings = 0;
                }

                botEntry.performance.log_counts = {
                    errors: totalErrors,
                    warnings: totalWarnings,
                    infos: totalInfos
                };
            } else {
                console.log(`[API /bots] ${botName} has NO log_records. Keys: ${Object.keys(botStatus || {}).join(', ')}`);
            }

            bots.push(botEntry);
        }

        return NextResponse.json(bots);
    } catch (error: any) {
        console.error('[API /bots GET] Error:', error.message);
        return NextResponse.json([], { status: 200 }); // Graceful degradation
    }
}

export async function POST(request: NextRequest) {
    return NextResponse.json(
        { error: 'Use /api/bots/deploy to create and deploy bots.' },
        { status: 400 }
    );
}
