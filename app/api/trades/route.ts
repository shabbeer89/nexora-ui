/**
 * Trades API Route
 * ==================
 * GET /api/trades - Get trade history from Hummingbot API
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const startTime = searchParams.get('start_time');
        const endTime = searchParams.get('end_time');

        console.log(`[Trades] Fetching from Hummingbot API (limit: ${limit})...`);

        // Use POST /trading/trades endpoint (correct Hummingbot API endpoint)
        const response = await axios.post(
            `${API_URL}/trading/trades`,
            {
                // Empty filter = get all trades
                account_names: [],
                connector_names: [],
                trading_pairs: [],
                limit: limit,
                start_time: startTime ? parseInt(startTime) : undefined,
                end_time: endTime ? parseInt(endTime) : undefined
            },
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true,
                timeout: 10000, // 10 second timeout
                maxRedirects: 0,
                httpAgent: undefined, // Use default agent
                httpsAgent: undefined
            }
        );

        if (response.status === 200) {
            // Transform the response to match UI expectations
            const trades = response.data?.data || response.data || [];

            console.log(`[Trades] Raw trades count: ${Array.isArray(trades) ? trades.length : 0}`);

            // Map to UI format with safe parsing
            const formattedTrades = Array.isArray(trades) ? trades.map((trade: any, idx: number) => {
                const price = parseFloat(trade.price);
                const amount = parseFloat(trade.amount) || parseFloat(trade.quantity);
                const fee = parseFloat(trade.trade_fee?.flat_fees?.[0]?.amount);
                const pnl = parseFloat(trade.pnl);

                return {
                    id: trade.id || trade.trade_id || `trade-${idx}`,
                    botId: trade.bot_name || trade.instance_id || 'unknown',
                    symbol: trade.trading_pair || trade.symbol || 'UNKNOWN',
                    side: (trade.trade_type || trade.side || 'buy').toLowerCase(),
                    type: trade.order_type || 'market',
                    price: isNaN(price) ? 0 : price,
                    quantity: isNaN(amount) ? 0 : amount,
                    fee: isNaN(fee) ? 0 : fee,
                    pnl: isNaN(pnl) ? 0 : pnl,
                    exchange: trade.connector_name || trade.exchange || 'unknown',
                    timestamp: trade.timestamp || new Date().toISOString(),
                    bot: {
                        id: trade.bot_name || 'unknown',
                        name: trade.bot_name || 'Unknown Bot'
                    }
                };
            }) : [];

            console.log(`[Trades] Formatted trades count: ${formattedTrades.length}`);
            return NextResponse.json(formattedTrades);
        }

        console.log(`[Trades] Non-200 response: ${response.status}`);
        return NextResponse.json([]);

    } catch (error: any) {
        console.error('[Trades] Error:', {
            message: error.message,
            stack: error.stack,
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            responseStatus: error.response?.status,
            responseData: error.response?.data
        });

        return NextResponse.json({
            error: error.message,
            details: error.response?.data || 'No response data',
            path: '/api/trades'
        }, { status: 500 });
    }
}

