/**
 * Transaction History with Balance Tracking API
 * Shows balance before/after each trade with fee breakdown
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = () => {
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        // Fetch all bots
        const botsResponse = await axios.get(`${API_URL}/bots`, {
            headers: getAuthHeaders(),
            validateStatus: () => true
        });

        if (botsResponse.status >= 400) {
            return NextResponse.json({
                transactions: [],
                error: 'Failed to fetch bots'
            });
        }

        const bots = botsResponse.data?.bots || [];
        const allTransactions: any[] = [];

        // Fetch trades for each bot
        for (const bot of bots) {
            try {
                const tradesResponse = await axios.get(
                    `${API_URL}/bots/${bot.id}/trades?limit=${limit}`,
                    {
                        headers: getAuthHeaders(),
                        validateStatus: () => true
                    }
                );

                if (tradesResponse.status === 200 && tradesResponse.data?.trades) {
                    const trades = tradesResponse.data.trades;

                    // Track running balance for this bot
                    let runningBalance = 0;

                    // Try to get initial balance from bot config
                    try {
                        const botDetailsResponse = await axios.get(`${API_URL}/bots/${bot.id}`, {
                            headers: getAuthHeaders(),
                            validateStatus: () => true
                        });

                        if (botDetailsResponse.status === 200) {
                            const config = botDetailsResponse.data?.data?.config || {};
                            runningBalance = parseFloat(config.total_investment_amount || config.capital || 1000);
                        }
                    } catch (err) {
                        runningBalance = 1000; // Default fallback
                    }

                    // Process trades chronologically (oldest first for balance calculation)
                    const sortedTrades = [...trades].sort((a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );

                    for (const trade of sortedTrades) {
                        const amount = parseFloat(trade.quantity || trade.amount || 0);
                        const price = parseFloat(trade.price || 0);
                        const fee = parseFloat(trade.fee || price * amount * 0.001); // 0.1% default if not available
                        const tradeCost = amount * price;
                        const totalCost = tradeCost + fee;

                        const balanceBefore = runningBalance;

                        // Update balance based on trade side
                        if (trade.side === 'buy') {
                            runningBalance -= totalCost; // Spent money
                        } else {
                            runningBalance += (tradeCost - fee); // Received money minus fees
                        }

                        const balanceAfter = runningBalance;

                        allTransactions.push({
                            id: trade.id || trade.order_id || `${bot.id}-${Date.now()}`,
                            botId: bot.id,
                            botName: bot.name || bot.id,
                            type: trade.side || 'buy',
                            amount,
                            price,
                            fee,
                            balanceBefore,
                            balanceAfter,
                            timestamp: trade.timestamp || new Date().toISOString()
                        });
                    }
                }
            } catch (err: any) {
                console.error(`Failed to fetch trades for bot ${bot.id}:`, err.message);
            }
        }

        // Sort all transactions by timestamp (most recent first)
        allTransactions.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Return limited results
        const transactions = allTransactions.slice(0, limit);

        return NextResponse.json({
            transactions
        });

    } catch (error: any) {
        console.error('[Capital/Transactions] Error:', error.message);
        return NextResponse.json({
            error: error.message,
            transactions: []
        }, { status: 500 });
    }
}
