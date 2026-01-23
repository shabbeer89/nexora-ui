/**
 * Market Data API Route
 * =====================
 * GET /api/market-data - Get market prices and candles data
 * Proxies to Hummingbot API market-data endpoints
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
 * GET /api/market-data?connector=binance&pair=BTC-USDT
 * Get current prices for a trading pair
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const connector = searchParams.get('connector');
        const pair = searchParams.get('pair');

        if (!connector || !pair) {
            return NextResponse.json(
                { error: 'Missing required params: connector and pair' },
                { status: 400 }
            );
        }

        const response = await axios.post(
            `${API_URL}/market-data/prices`,
            {
                connector_name: connector,
                trading_pairs: [pair]
            },
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (response.status >= 400) {
            return NextResponse.json(
                { error: response.data?.detail || 'Failed to get price' },
                { status: response.status }
            );
        }

        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error('[MarketData] Error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/market-data
 * Get candles data for charting
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'candles') {
            // Fetch candlestick data
            const response = await axios.post(
                `${API_URL}/market-data/candles`,
                {
                    connector_name: body.connector,
                    trading_pair: body.pair,
                    interval: body.interval || '1m',
                    max_records: body.limit || 100
                },
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400 || response.data?.error) {
                return NextResponse.json(
                    { error: response.data?.error || response.data?.detail || 'Failed to get candles' },
                    { status: response.status || 500 }
                );
            }

            return NextResponse.json({
                candles: response.data
            });

        } else if (action === 'orderbook') {
            // Fetch order book
            const response = await axios.post(
                `${API_URL}/market-data/order-book`,
                {
                    connector_name: body.connector,
                    trading_pair: body.pair,
                    depth: body.depth || 20
                },
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { error: response.data?.detail || 'Failed to get order book' },
                    { status: response.status }
                );
            }

            return NextResponse.json(response.data);

        } else if (action === 'connectors') {
            // Get available candle connectors
            const response = await axios.get(
                `${API_URL}/market-data/available-candle-connectors`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            return NextResponse.json({
                connectors: response.data
            });

        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use: candles, orderbook, or connectors' },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error('[MarketData] Error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
