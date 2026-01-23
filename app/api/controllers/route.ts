/**
 * Controllers API Route
 * =====================
 * GET /api/controllers - List all controllers and their configurations
 * Proxies to Hummingbot API controllers endpoints
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
 * GET /api/controllers
 * List all controllers and their configurations
 */
export async function GET(request: Request) {
    try {
        // Fetch list of controllers
        const controllersResponse = await axios.get(
            `${API_URL}/controllers/`,
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (controllersResponse.status >= 400) {
            return NextResponse.json(
                { controllers: [], error: 'Failed to fetch controllers' },
                { status: 200 }
            );
        }

        const controllerNames = controllersResponse.data || [];

        // Fetch configs for each controller
        const controllersWithConfigs = await Promise.all(
            controllerNames.map(async (name: string) => {
                try {
                    const configsResponse = await axios.get(
                        `${API_URL}/controllers/${name}/configs`,
                        {
                            headers: getAuthHeaders(request),
                            validateStatus: () => true
                        }
                    );

                    return {
                        name,
                        type: 'strategy_controller',
                        configs: configsResponse.data || []
                    };
                } catch {
                    return {
                        name,
                        type: 'strategy_controller',
                        configs: []
                    };
                }
            })
        );

        return NextResponse.json({
            controllers: controllersWithConfigs
        });

    } catch (error: any) {
        console.error('[Controllers] Error:', error.message);
        return NextResponse.json(
            { controllers: [], error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/controllers
 * Create a new controller configuration
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await axios.post(
            `${API_URL}/controllers/${body.controller_name}/configs`,
            {
                name: body.name,
                parameters: body.parameters
            },
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (response.status >= 400) {
            return NextResponse.json(
                { error: response.data?.detail || 'Failed to create configuration' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            config: response.data
        });

    } catch (error: any) {
        console.error('[Controllers] Create error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
