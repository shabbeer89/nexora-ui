/**
 * Connectors API Route
 * ====================
 * GET /api/connectors - List available connectors and trading rules
 * Proxies to Hummingbot API connectors endpoints
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
 * GET /api/connectors
 * List available connectors or get trading rules
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const connector = searchParams.get('connector');
        const action = searchParams.get('action'); // 'rules', 'config', 'order-types'

        if (connector && action === 'rules') {
            // Get trading rules for specific connector
            const response = await axios.get(
                `${API_URL}/connectors/${connector}/trading-rules`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { rules: [], error: 'Failed to get trading rules' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                rules: response.data
            });
        } else if (connector && action === 'config') {
            // Get connector config map
            const response = await axios.get(
                `${API_URL}/connectors/${connector}/config-map`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { config: null, error: 'Failed to get connector config' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                config: response.data
            });
        } else if (connector && action === 'order-types') {
            // Get supported order types
            const response = await axios.get(
                `${API_URL}/connectors/${connector}/order-types`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { orderTypes: [], error: 'Failed to get order types' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                orderTypes: response.data
            });
        } else {
            // List all available connectors
            const response = await axios.get(
                `${API_URL}/connectors/`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { connectors: [], error: 'Failed to get connectors' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                connectors: response.data || []
            });
        }

    } catch (error: any) {
        console.error('[Connectors] Error:', error.message);
        return NextResponse.json(
            { connectors: [], error: error.message },
            { status: 500 }
        );
    }
}
