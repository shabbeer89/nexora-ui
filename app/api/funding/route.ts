/**
 * Funding API Route
 * =================
 * GET /api/funding - Get perpetual funding info and payment history
 * Proxies to Hummingbot API market-data and trading endpoints
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
 * GET /api/funding
 * Get funding rates and payment history
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const connector = searchParams.get('connector');
        const pair = searchParams.get('pair');
        const type = searchParams.get('type') || 'info'; // 'info' or 'payments'

        if (type === 'payments') {
            // Get funding payment history
            const response = await axios.post(
                `${API_URL}/trading/funding-payments`,
                {
                    connector_names: connector ? [connector] : undefined,
                    trading_pairs: pair ? [pair] : undefined,
                    limit: 50
                },
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { payments: [], error: 'Failed to get funding payments' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                payments: response.data?.data || response.data || []
            });
        } else {
            // Get funding info (rates)
            if (!connector || !pair) {
                return NextResponse.json(
                    { error: 'connector and pair are required for funding info' },
                    { status: 400 }
                );
            }

            const response = await axios.post(
                `${API_URL}/market-data/funding-info`,
                {
                    connector_name: connector,
                    trading_pair: pair
                },
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { funding: null, error: 'Failed to get funding info' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                funding: response.data
            });
        }

    } catch (error: any) {
        console.error('[Funding] Error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
