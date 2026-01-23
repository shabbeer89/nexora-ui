/**
 * Trading API Route
 * =================
 * POST /api/trading - Place a new trade
 * Proxies to Hummingbot API trading endpoint
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

/**
 * POST /api/trading
 * Place a new trade order
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['account_name', 'connector_name', 'trading_pair', 'trade_type', 'amount', 'order_type'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Map frontend field names to backend expected format
        const tradeRequest = {
            account_name: body.account_name,
            connector_name: body.connector_name,
            trading_pair: body.trading_pair,
            trade_type: body.trade_type.toUpperCase(), // BUY or SELL
            amount: parseFloat(body.amount),
            order_type: body.order_type.toUpperCase(), // MARKET, LIMIT, etc.
            price: body.price ? parseFloat(body.price) : undefined,
            position_action: body.position_action || 'NIL' // NIL for spot, OPEN/CLOSE for perps
        };

        console.log('[Trading] Placing order:', tradeRequest);

        const response = await axios.post(
            `${API_URL}/trading/orders`,
            tradeRequest,
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (response.status >= 400) {
            console.error('[Trading] Backend error:', response.data);
            return NextResponse.json(
                { error: response.data?.detail || 'Failed to place order' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            order: response.data
        });

    } catch (error: any) {
        console.error('[Trading] Error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
