/**
 * Bot-Specific Trades API Route
 * ==============================
 * GET /api/bots/[id]/trades - Get trades for a specific bot
 * 
 * Query Params:
 * - page (default: 1) - Page number
 * - limit (default: 50) - Items per page
 * - timeRange (1d|2d|1w|1m|3m|all) - Time period filter
 * - side (all|buy|sell) - Side filter
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
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
        console.error('[Trades] Server auth failed:', error);
        throw error;
    }
}

const getAuthHeaders = async (request: Request) => {
    // ALWAYS use Basic Auth for upstream calls to the Bot/Hummingbot API
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

// Get timestamp cutoff for time range filter
function getTimeRangeCutoff(timeRange: string): number {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (timeRange) {
        case '1d': return now - day;
        case '2d': return now - (2 * day);
        case '1w': return now - (7 * day);
        case '1m': return now - (30 * day);
        case '3m': return now - (90 * day);
        case 'all':
        default: return 0;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: botId } = await params;
        const { searchParams } = new URL(request.url);

        // Pagination params
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')));

        // Filter params
        const timeRange = searchParams.get('timeRange') || 'all';
        const sideFilter = searchParams.get('side') || 'all';

        console.log(`[Bot Trades] Fetching trades for bot: ${botId}, page: ${page}, limit: ${limit}, timeRange: ${timeRange}`);

        const axiosConfig = {
            headers: await getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 15000
        };

        // Resolve ID to Bot Name if necessary
        let botName = botId;
        try {
            const runsRes = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
            if (runsRes.status === 200 && Array.isArray(runsRes.data?.data)) {
                const match = runsRes.data.data.find((r: any) => r.instance_id === botId || r.bot_name === botId);
                if (match) {
                    botName = match.bot_name;
                }
            }
        } catch (e) {
            // fallback
        }

        console.log(`[Bot Trades] Using Name: ${botName} for ID: ${botId}`);

        // Construct path to bot's database file using the resolved name
        const dbPath = `bots/instances/${botName}/data/${botName}.sqlite`;

        // Fetch more data for filtering (1000 records)
        // Fetch more data for filtering (1000 records)
        let tradesData = [];
        try {
            const response = await axios.get(
                `${API_URL}/archived-bots/${encodeURIComponent(dbPath)}/trades?limit=1000`,
                axiosConfig
            );

            if (response.status !== 200) {
                console.warn(`[Bot Trades] Failed to fetch trades from DB (Status ${response.status}):`, response.data);
                // Don't error out, just allow returning empty trades
            } else {
                tradesData = response.data?.trades || [];
            }
        } catch (err: any) {
            console.error(`[Bot Trades] Error fetching trades from DB: ${err.message}`);
            // Proceed with empty trades
        }



        // ========================================
        // PnL Calculation using FIFO method
        // ========================================
        const { calculateFIFO } = await import('@/lib/pnl-calculator');
        const pnlResult = calculateFIFO(tradesData);

        const formattedTrades = pnlResult.tradesWithPnL.map((trade: any, idx: number) => {
            const side = (trade.trade_type || trade.side || 'buy').toLowerCase();
            return {
                id: trade.id || trade.order_id || trade.trade_id || `trade-${idx}`,
                botId: trade.bot_name || botId,
                symbol: trade.trading_pair || trade.symbol || 'UNKNOWN',
                side: side,
                type: (trade.order_type || 'limit').toLowerCase(),
                price: parseFloat(trade.price) || 0,
                quantity: parseFloat(trade.amount) || parseFloat(trade.quantity) || 0,
                total: (parseFloat(trade.price) || 0) * (parseFloat(trade.amount) || parseFloat(trade.quantity) || 0),
                fee: parseFloat(trade.trade_fee_in_quote) || parseFloat(trade.trade_fee) || 0,
                pnl: trade.pnl,
                isUnmatchedSell: trade.isUnmatchedSell,
                exchange: trade.connector_name || trade.exchange || 'unknown',
                timestamp: new Date(trade.timestampMs).toISOString(),
                timestampMs: trade.timestampMs
            };
        });

        // Use results from calculator
        let totalRealizedPnL = pnlResult.totalRealizedPnL;
        let winningTrades = pnlResult.winningTrades;
        let losingTrades = pnlResult.losingTrades;
        let totalFees = pnlResult.totalFees;

        // Apply time range filter
        const timeCutoff = getTimeRangeCutoff(timeRange);
        let filteredTrades = formattedTrades;
        if (timeCutoff > 0) {
            filteredTrades = formattedTrades.filter(t => t.timestampMs >= timeCutoff);
        }

        // Apply side filter
        if (sideFilter !== 'all') {
            filteredTrades = filteredTrades.filter(t => t.side === sideFilter.toLowerCase());
        }

        // Re-generate chart data
        const chartData: { date: string; value: number; pnl: number }[] = [];
        let cumulativePnL = 0;

        // Need to sort by timestamp for chart (oldest first)
        const tradesForChart = [...formattedTrades].sort((a, b) => a.timestampMs - b.timestampMs);

        tradesForChart.forEach(trade => {
            cumulativePnL += trade.pnl;
            chartData.push({
                date: trade.timestamp,
                value: 10000 + cumulativePnL,
                pnl: trade.pnl
            });
        });

        // Filter and sort for display (newest first)
        // Sort by timestamp (newest first) for display
        filteredTrades.sort((a, b) => b.timestampMs - a.timestampMs);

        // Calculate total before pagination
        const total = filteredTrades.length;
        const totalPages = Math.ceil(total / limit);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedTrades = filteredTrades.slice(startIndex, startIndex + limit);

        // Calculate statistics on filtered data
        const totalSellTrades = filteredTrades.filter(t => t.side === 'sell').length;
        const totalBuyTrades = filteredTrades.filter(t => t.side === 'buy').length;
        const filteredPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
        const filteredWins = filteredTrades.filter(t => t.side === 'sell' && t.pnl > 0).length;
        const filteredLosses = filteredTrades.filter(t => t.side === 'sell' && t.pnl < 0).length;

        // Calculate win rate - return null if no completed trades (sells), not 0
        // This allows UI to show "N/A" or "Pending" instead of misleading 0%
        const winRate = totalSellTrades > 0
            ? parseFloat(((filteredWins / totalSellTrades) * 100).toFixed(1))
            : null;

        const stats = {
            totalTrades: total,
            totalPnL: filteredPnL,
            winningTrades: filteredWins,
            losingTrades: filteredLosses,
            winRate: winRate,
            // Provide context for win rate
            winRateStatus: totalSellTrades === 0
                ? 'pending' // No completed trades yet
                : winRate !== null && winRate >= 50
                    ? 'good'
                    : 'needs_improvement',
            totalVolume: filteredTrades.reduce((sum, t) => sum + t.total, 0),
            avgTradeSize: total > 0
                ? filteredTrades.reduce((sum, t) => sum + t.total, 0) / total
                : 0,
            totalFees: filteredTrades.reduce((sum, t) => sum + t.fee, 0),
            buyTrades: totalBuyTrades,
            sellTrades: totalSellTrades,
            unmatchedSells: filteredTrades.filter((t: any) => t.isUnmatchedSell).length,
            buyVolume: filteredTrades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.total, 0),
            sellVolume: filteredTrades.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.total, 0),
            // Additional context
            hasCompletedTrades: totalSellTrades > 0,
            inventoryImbalance: totalBuyTrades - totalSellTrades,
            avgWinAmount: filteredWins > 0
                ? filteredTrades.filter(t => t.side === 'sell' && t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / filteredWins
                : 0,
            avgLossAmount: filteredLosses > 0
                ? Math.abs(filteredTrades.filter(t => t.side === 'sell' && t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / filteredLosses)
                : 0
        };

        // Generate chart data for filtered period
        const filteredChartData = chartData
            .filter(d => timeCutoff === 0 || new Date(d.date).getTime() >= timeCutoff)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
            trades: paginatedTrades,
            chartData: filteredChartData,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages,
                showing: {
                    from: total > 0 ? startIndex + 1 : 0,
                    to: Math.min(startIndex + limit, total)
                }
            },
            stats,
            filters: {
                timeRange,
                side: sideFilter
            }
        });

    } catch (error: any) {
        console.error('[Bot Trades] Error:', error.message);
        return NextResponse.json(
            {
                trades: [],
                chartData: [],
                pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false },
                stats: {},
                error: error.message
            },
            { status: 500 }
        );
    }
}
