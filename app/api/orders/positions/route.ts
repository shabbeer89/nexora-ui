/**
 * Positions API Route
 * ===================
 * GET /api/orders/positions - Get current positions from perpetual connectors
 * Proxies to Hummingbot API trading/positions endpoint
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

/**
 * GET /api/orders/positions
 * Get current open positions
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountName = searchParams.get('account');
        const connector = searchParams.get('connector');

        const response = await axios.post(
            `${API_URL}/trading/positions`,
            {
                account_names: accountName ? [accountName] : undefined,
                connector_names: connector ? [connector] : undefined,
                limit: 50
            },
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (response.status >= 400) {
            return NextResponse.json(
                { error: response.data?.detail || 'Failed to get positions' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            positions: response.data?.data || [],
            pagination: response.data?.pagination
        });

    } catch (error: any) {
        console.error('[Positions] Error:', error.message);
        return NextResponse.json(
            { positions: [], error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders/positions
 * Close a position
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Place a trade to close the position
        const response = await axios.post(
            `${API_URL}/trading/orders`,
            {
                account_name: body.account_name,
                connector_name: body.connector_name,
                trading_pair: body.trading_pair,
                trade_type: body.side === 'LONG' ? 'SELL' : 'BUY',
                order_type: body.order_type || 'MARKET',
                amount: body.amount,
                position_action: 'CLOSE'
            },
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (response.status >= 400) {
            return NextResponse.json(
                { error: response.data?.detail || 'Failed to close position' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            order: response.data
        });

    } catch (error: any) {
        console.error('[Positions] Close error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
