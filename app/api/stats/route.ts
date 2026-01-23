/**
 * Unified Stats API Route
 * ========================
 * GET /api/stats - Get aggregated trading statistics
 * 
 * Query Params:
 * - timeRange (1d|2d|1w|1m|3m|all) - Time period filter (default: all)
 * - includePerBot (true|false) - Include per-bot breakdown (default: false)
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

// Token cache for server-side auth
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getServerToken(): Promise<string | null> {
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
            console.error(`[Stats] Auth failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in || 900) * 1000,
        };
        return cachedToken.token;
    } catch (error: any) {
        console.error('[Stats] Server auth failed (connection error):', error.message);
        return null;
    }
}

const getAuthHeaders = async (request: Request) => {
    const authHeader = request.headers.get('authorization');
    const serverToken = await getServerToken();
    // If we have a client token, use it. If not, try server token.
    const token = authHeader || (serverToken ? `Bearer ${serverToken}` : null);

    if (!token) {
        throw new Error('Authentication unavailable: Cannot connect to backend API');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': token,
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

// Parse timestamp helper
const parseTimestamp = (ts: any): number => {
    if (!ts) return Date.now();
    if (typeof ts === 'number') {
        return ts > 32503680000 ? ts : ts * 1000;
    }
    return Date.parse(ts) || Date.now();
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || 'all';
        const includePerBot = searchParams.get('includePerBot') === 'true';

        let headers;
        try {
            headers = await getAuthHeaders(request);
        } catch (err: any) {
            console.error('[Stats] Auth error:', err.message);
            return NextResponse.json(
                {
                    error: "Backend API Unavailable",
                    message: "Cannot authenticate with backend services. Please check if Hummingbot API is running.",
                    trading: { totalPnL: 0, totalTrades: 0, winRate: null, profitFactor: 0, totalVolume: 0 },
                    bots: { active: 0, total: 0 }
                },
                { status: 503 }
            );
        }

        const axiosConfig = {
            headers,
            validateStatus: () => true,
            timeout: 15000
        };

        console.log(`[Stats] Fetching stats for timeRange: ${timeRange}, includePerBot: ${includePerBot}`);

        // Fetch bots list
        let bots: any[] = [];
        try {
            const botsResponse = await axios.get(`${API_URL}/bot-orchestration/status`, axiosConfig);

            if (botsResponse.status === 200 && botsResponse.data?.data) {
                // Handle dictionary response from API where key is bot name
                const botsData = botsResponse.data.data || [];
                if (Array.isArray(botsData)) {
                    bots = botsData;
                } else if (typeof botsData === 'object') {
                    // Convert dictionary { "bot_name": { ... } } to array [ { name: "bot_name", ... } ]
                    bots = Object.entries(botsData).map(([name, data]: [string, any]) => ({
                        ...data,
                        name: data.name || name // Ensure name is available
                    }));
                }
            }
        } catch (err: any) {
            console.error(`[Stats] Failed to fetch bots list: ${err.message}`);
            // Continue with empty bots list -> will return zero stats
        }

        // Initialize aggregated stats
        let totalPnL = 0;
        let totalVolume = 0;
        let totalTrades = 0;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalFees = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let bestTrade = -Infinity;
        let worstTrade = Infinity;

        const botPerformance: { name: string; pnl: number; trades: number; winRate: number; volume: number }[] = [];
        const timeCutoff = getTimeRangeCutoff(timeRange);

        // Fetch trades for each bot and aggregate
        for (const bot of bots) {
            const botId = bot.instance_id || bot.id || bot.name;
            if (!botId) continue;

            try {
                const dbPath = `bots/instances/${botId}/data/${botId}.sqlite`;
                const tradesResponse = await axios.get(
                    `${API_URL}/archived-bots/${encodeURIComponent(dbPath)}/trades?limit=1000`,
                    axiosConfig
                );

                if (tradesResponse.status !== 200) continue;

                const trades = tradesResponse.data?.trades || [];
                if (!trades.length) continue;

                // FIFO-based PnL calculation (same logic as bot trades route)
                interface InventoryItem {
                    price: number;
                    quantity: number;
                }

                const inventory: InventoryItem[] = [];
                let botPnL = 0;
                let botVolume = 0;
                let botTrades = 0;
                let botWins = 0;
                let botLosses = 0;
                let botFees = 0;

                // Sort by timestamp for FIFO
                const sortedTrades = [...trades].sort((a: any, b: any) => {
                    return parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp);
                });

                for (const trade of sortedTrades) {
                    const timestamp = parseTimestamp(trade.timestamp);

                    // Apply time filter
                    if (timeCutoff > 0 && timestamp < timeCutoff) continue;

                    const side = (trade.trade_type || trade.side || 'buy').toLowerCase();
                    const price = parseFloat(trade.price) || 0;
                    const quantity = parseFloat(trade.amount) || parseFloat(trade.quantity) || 0;
                    const fee = parseFloat(trade.trade_fee_in_quote) || parseFloat(trade.trade_fee) || 0;
                    const tradeVolume = price * quantity;

                    botVolume += tradeVolume;
                    botFees += fee;
                    botTrades++;
                    totalTrades++;
                    totalVolume += tradeVolume;
                    totalFees += fee;

                    let tradePnL = 0;

                    if (side === 'buy') {
                        inventory.push({ price, quantity });
                    } else if (side === 'sell') {
                        let remainingToSell = quantity;
                        let costBasis = 0;

                        while (remainingToSell > 0 && inventory.length > 0) {
                            const oldest = inventory[0];
                            const sellFromThis = Math.min(remainingToSell, oldest.quantity);
                            costBasis += sellFromThis * oldest.price;
                            oldest.quantity -= sellFromThis;
                            remainingToSell -= sellFromThis;

                            if (oldest.quantity <= 0.00000001) {
                                inventory.shift();
                            }
                        }

                        // Unmatched sells - treat as $0 PnL for that portion
                        if (remainingToSell > 0.00000001) {
                            costBasis += remainingToSell * price;
                        }

                        const revenue = quantity * price;
                        tradePnL = revenue - costBasis - fee;

                        if (tradePnL > 0) {
                            botWins++;
                            winningTrades++;
                            grossProfit += tradePnL;
                        } else if (tradePnL < 0) {
                            botLosses++;
                            losingTrades++;
                            grossLoss += Math.abs(tradePnL);
                        }

                        botPnL += tradePnL;
                        totalPnL += tradePnL;

                        if (tradePnL > bestTrade) bestTrade = tradePnL;
                        if (tradePnL < worstTrade) worstTrade = tradePnL;
                    }
                }

                if (includePerBot && botTrades > 0) {
                    const sellTrades = botWins + botLosses;
                    botPerformance.push({
                        name: botId,
                        pnl: botPnL,
                        trades: botTrades,
                        winRate: sellTrades > 0 ? (botWins / sellTrades) * 100 : 0,
                        volume: botVolume
                    });
                }
            } catch (err) {
                console.warn(`[Stats] Failed to fetch trades for bot ${botId}:`, err);
            }
        }

        // Sort bot performance by PnL
        botPerformance.sort((a, b) => b.pnl - a.pnl);

        // Calculate derived metrics
        const totalSellTrades = winningTrades + losingTrades;
        const winRate = totalSellTrades > 0 ? (winningTrades / totalSellTrades) * 100 : null;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
        const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
        const avgTradePnL = totalSellTrades > 0 ? totalPnL / totalSellTrades : 0;

        // Bot summary
        const activeBots = bots.filter((b: any) => b.status === 'running').length;
        const topPerformer = botPerformance.length > 0 ? botPerformance[0] : null;
        const worstPerformer = botPerformance.length > 0 ? botPerformance[botPerformance.length - 1] : null;

        const response: any = {
            timeRange,
            generatedAt: new Date().toISOString(),
            trading: {
                totalPnL,
                realizedPnL: totalPnL,
                unrealizedPnL: 0, // Would need position data for this
                totalTrades,
                winningTrades,
                losingTrades,
                winRate: winRate !== null ? parseFloat(winRate.toFixed(2)) : null,
                winRateStatus: totalSellTrades === 0 ? 'pending' : (winRate !== null && winRate >= 50 ? 'good' : 'needs_improvement'),
                profitFactor: isFinite(profitFactor) ? parseFloat(profitFactor.toFixed(2)) : 0,
                totalVolume,
                avgTradeSize: parseFloat(avgTradeSize.toFixed(2)),
                avgTradePnL: parseFloat(avgTradePnL.toFixed(2)),
                totalFees: parseFloat(totalFees.toFixed(2)),
                bestTrade: bestTrade === -Infinity ? 0 : parseFloat(bestTrade.toFixed(2)),
                worstTrade: worstTrade === Infinity ? 0 : parseFloat(worstTrade.toFixed(2)),
                hasCompletedTrades: totalSellTrades > 0
            },
            bots: {
                active: activeBots,
                total: bots.length,
                topPerformer: topPerformer ? {
                    name: topPerformer.name,
                    pnl: parseFloat(topPerformer.pnl.toFixed(2))
                } : null,
                worstPerformer: worstPerformer ? {
                    name: worstPerformer.name,
                    pnl: parseFloat(worstPerformer.pnl.toFixed(2))
                } : null
            }
        };

        // Include per-bot breakdown if requested
        if (includePerBot) {
            response.botPerformance = botPerformance.map(b => ({
                name: b.name,
                pnl: parseFloat(b.pnl.toFixed(2)),
                trades: b.trades,
                winRate: parseFloat(b.winRate.toFixed(1)),
                volume: parseFloat(b.volume.toFixed(2))
            }));
        }

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('[Stats] Error:', error.message);
        return NextResponse.json(
            {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                trading: {
                    totalPnL: 0,
                    totalTrades: 0,
                    winRate: null,
                    profitFactor: 0,
                    totalVolume: 0
                },
                bots: { active: 0, total: 0 }
            },
            { status: 500 }
        );
    }
}
