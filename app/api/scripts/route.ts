/**
 * Scripts API Route
 * =================
 * GET /api/scripts - List all V2 scripts and their configurations
 * Proxies to Hummingbot API scripts endpoints
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
 * GET /api/scripts
 * List all V2 scripts and their configurations
 */
export async function GET(request: Request) {
    try {
        // Fetch list of scripts
        const scriptsResponse = await axios.get(
            `${API_URL}/scripts/`,
            {
                headers: getAuthHeaders(request),
                validateStatus: () => true
            }
        );

        if (scriptsResponse.status >= 400) {
            return NextResponse.json(
                { scripts: [], error: 'Failed to fetch scripts' },
                { status: 200 }
            );
        }

        const scriptNames = scriptsResponse.data || [];

        // Fetch configs for each script
        const scriptsWithConfigs = await Promise.all(
            scriptNames.map(async (name: string) => {
                try {
                    const configsResponse = await axios.get(
                        `${API_URL}/scripts/configs/${name}`,
                        {
                            headers: getAuthHeaders(request),
                            validateStatus: () => true
                        }
                    );

                    // Transform configs to include script_name
                    const configs = (configsResponse.data || []).map((c: any) => ({
                        ...c,
                        script_name: name
                    }));

                    return {
                        name,
                        configs
                    };
                } catch {
                    return {
                        name,
                        configs: []
                    };
                }
            })
        );

        return NextResponse.json({
            scripts: scriptsWithConfigs
        });

    } catch (error: any) {
        console.error('[Scripts] Error:', error.message);
        return NextResponse.json(
            { scripts: [], error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/scripts
 * Create a new script configuration
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await axios.post(
            `${API_URL}/scripts/configs/${body.script_name}`,
            {
                name: body.name,
                ...body.parameters
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
        console.error('[Scripts] Create error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
