/**
 * Bots API Route
 * ===============
 * GET /api/bots - List all bots from Hummingbot API
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

export async function GET(request: NextRequest) {
    try {
        const axiosConfig = {
            headers: await getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 25000 // 25 second timeout for bot status/docker checks
        };

        // Debug: Log the auth header (first 50 chars only for security)
        const authHeader = axiosConfig.headers['Authorization'];
        console.log(`[API /bots] Using auth header: ${authHeader?.substring(0, 50)}...`);

        // 1. Get all bot runs (deployed bots)
        const botRunsResponse = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
        console.log(`[API /bots] Bot runs response status: ${botRunsResponse.status}`);

        let botRuns = [];
        if (botRunsResponse.status === 200 && botRunsResponse.data?.data) {
            botRuns = botRunsResponse.data.data;
            console.log(`[API /bots] Found ${botRuns.length} bot runs`);
        } else {
            console.warn(`[API /bots] Bot runs fetch failed or returned no data: ${botRunsResponse.status}`);
        }

        // 2. Get running bot statuses from orchestrator
        const statusResponse = await axios.get(`${API_URL}/bot-orchestration/status`, axiosConfig);
        const runningBots = statusResponse.data?.data || {};
        console.log(`[API /bots] Found ${Object.keys(runningBots).length} running bots in orchestrator status`);

        // 3. Get Docker container statuses for accurate running detection
        const dockerContainers: Record<string, any> = {};
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

        // --- IMPROVED: Collect ALL unique names ---
        const allBotNames = new Set<string>();
        botRuns.forEach((r: any) => allBotNames.add(r.bot_name || r.instance_name));
        Object.keys(runningBots).forEach(name => allBotNames.add(name));
        Object.keys(dockerContainers).forEach(name => allBotNames.add(name));
        console.log(`[API /bots] Total unique bot names: ${allBotNames.size}`, Array.from(allBotNames));

        // Sequential processing for stability
        for (const botName of Array.from(allBotNames)) {
            // Find corresponding run if exists
            const run = botRuns.find((r: any) => (r.bot_name || r.instance_name) === botName);

            // Skip archived bots if we have the run data
            if (run?.deployment_status === 'ARCHIVED') continue;

            // Start with 'stopped' status if not found in orchestrator
            const botStatus = runningBots[botName] || { status: 'stopped', performance: {} };

            // Check Docker container status directly for accurate status
            const dockerContainer = dockerContainers[botName];
            const containerIsRunning = dockerContainer?.status === 'running';

            // Trust Docker container status over orchestrator for determining if bot is running
            const isRunning = containerIsRunning || botStatus?.status === 'running';
            const isStopped = !containerIsRunning && botStatus?.status === 'stopped';

            // Get config details for this bot
            const configName = run?.config_name?.replace('.yml', '') || botName;
            let configDetails: any = null;

            try {
                const configRes = await axios.get(`${API_URL}/scripts/configs/${configName}`, axiosConfig);
                if (configRes.status === 200) {
                    configDetails = configRes.data;
                }
            } catch (e) {
                // Config may not exist
            }

            // If orphaned (no config and no run record), mark as Orphaned in UI
            const isOrphaned = !configDetails && !run;

            // Calculate Performance
            let pnl24h = 0;
            let trades24h = 0;
            let volume24h = 0;
            let fees24h = 0;
            let lastErrorTimestamp = 0;

            // Extract last error from logs if available
            const logRecords = botStatus?.log_records || [];
            if (Array.isArray(logRecords)) {
                logRecords.forEach((log: any) => {
                    if ((log.level_name === 'ERROR' || log.level_no >= 40) && log.timestamp) {
                        const ts = log.timestamp * 1000;
                        if (ts > lastErrorTimestamp) lastErrorTimestamp = ts;
                    }
                });
            }

            // try orchestrator status first
            const hasOrchestratorData = botStatus?.performance &&
                ((typeof botStatus.performance.total_trades === 'number' && botStatus.performance.total_trades > 0) ||
                    (typeof botStatus.performance.pnl === 'number' && botStatus.performance.pnl !== 0));

            if (hasOrchestratorData) {
                pnl24h = botStatus.performance.pnl || 0;
                trades24h = botStatus.performance.total_trades || 0;
            } else {
                // Fallback to global trades
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

                // Local DB fallback for paper trading
                if (trades24h === 0) {
                    try {
                        const dbPath = `bots/instances/${botName}/data/${botName}.sqlite`;
                        const headers = getAuthHeaders(request);
                        const localTradesRes = await axios.get(
                            `${API_URL}/archived-bots/${encodeURIComponent(dbPath)}/trades?limit=1000`,
                            { headers, validateStatus: () => true }
                        );
                        if (localTradesRes.data?.trades?.length > 0) {
                            const { calculateFIFO } = await import('@/lib/pnl-calculator');
                            const pnlResult = calculateFIFO(localTradesRes.data.trades);
                            pnl24h = pnlResult.totalRealizedPnL;
                            trades24h = pnlResult.totalTrades;
                            volume24h = pnlResult.totalVolume;
                            fees24h = pnlResult.totalFees;
                        }
                    } catch (err) { }
                }
            }

            const botEntry = {
                id: run?.instance_id || botName,
                name: botName,
                status: isRunning ? 'running' : (isStopped ? 'stopped' : 'error'),
                type: isOrphaned ? 'Orphaned' : (run?.strategy_name || configDetails?.script_file_name?.replace('.py', '') || 'pmm'),
                strategy: configDetails?.script_file_name?.replace('.py', '') || run?.strategy_name || (isOrphaned ? 'External instance' : 'simple_pmm'),
                exchange: configDetails?.exchange || (isOrphaned ? 'external' : 'unknown'),
                tradingPair: configDetails?.trading_pair || (isOrphaned ? 'external' : 'unknown'),
                performance: {
                    total_pnl: pnl24h,
                    total_trades: trades24h,
                    total_volume: volume24h,
                    total_fees: fees24h,
                    last_error_timestamp: lastErrorTimestamp > 0 ? lastErrorTimestamp : undefined,
                },
                config: configDetails || {},
                deployedAt: run?.deployed_at,
                startedAt: dockerContainer?.started_at,
                isOrphaned,
                recentlyActive: botStatus?.recently_active || containerIsRunning,
                containerRunning: containerIsRunning
            };

            // Calculate Log Counts
            const allLogs = [
                ...(botStatus?.log_records || []),
                ...(botStatus?.error_logs || []),
                ...(botStatus?.general_logs || [])
            ];

            if (allLogs.length > 0) {
                const sortedLogs = allLogs.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
                let consecutiveInfos = 0;
                let tErrors = 0, tWarnings = 0, tInfos = 0;

                for (const log of sortedLogs) {
                    if (log.level_name === 'INFO' || log.level_no === 20) consecutiveInfos++;
                    else break;
                }

                sortedLogs.forEach((log: any) => {
                    if (log.level_name === 'ERROR' || log.level_no >= 40) tErrors++;
                    else if (log.level_name === 'WARNING' || log.level_no === 30) tWarnings++;
                    else if (log.level_name === 'INFO' || log.level_no === 20) tInfos++;
                });

                if (consecutiveInfos > 10) { tErrors = 0; tWarnings = 0; }
                (botEntry as any).performance.log_counts = { errors: tErrors, warnings: tWarnings, infos: tInfos };
            }

            bots.push(botEntry);
        }

        // --- ADD INTERNAL NEXORA THREADS ---
        try {
            const internalStatusRes = await axios.get(`${API_URL}/status`, axiosConfig);
            const internalStatus = internalStatusRes.data;
            const orchestratorRunning = internalStatus?.services?.orchestrator === 'running' ||
                internalStatus?.orchestrator?.last_update ||
                internalStatus?.orchestrator;

            if (orchestratorRunning) {
                const startTime = internalStatus?.orchestrator?.last_update || new Date().toISOString();
                // Add Bybit & OKX Nexora Internal Connectors (as seen in main.py)
                const internalBots = [
                    {
                        id: 'nexora-bybit-sol',
                        name: 'Internal: Bybit Connector',
                        status: 'running',
                        type: 'Nexora Thread',
                        strategy: 'Orderbook Aggregator',
                        exchange: 'bybit',
                        tradingPair: 'SOL/USDT',
                        performance: { total_pnl: 0, total_trades: 0 },
                        isNexoraInternal: true,
                        startedAt: startTime
                    },
                    {
                        id: 'nexora-okx-sol',
                        name: 'Internal: OKX Connector',
                        status: 'running',
                        type: 'Nexora Thread',
                        strategy: 'Orderbook Aggregator',
                        exchange: 'okx',
                        tradingPair: 'SOL/USDT',
                        performance: { total_pnl: 0, total_trades: 0 },
                        isNexoraInternal: true,
                        startedAt: startTime
                    }
                ];
                bots.push(...internalBots);
            }
        } catch (e) {
            console.log('[API /bots] Failed to fetch internal status');
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
