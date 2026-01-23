/**
 * Docker API Route
 * ================
 * GET/POST /api/docker - Docker container management
 * Proxies to Hummingbot API docker endpoints
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
 * GET /api/docker
 * List Docker containers
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const containerId = searchParams.get('id');

        if (containerId) {
            // Get specific container status
            const response = await axios.get(
                `${API_URL}/docker/containers/${containerId}`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { container: null, error: 'Container not found' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                container: response.data
            });
        } else {
            // List all containers
            const response = await axios.get(
                `${API_URL}/docker/containers`,
                {
                    headers: getAuthHeaders(request),
                    validateStatus: () => true
                }
            );

            if (response.status >= 400) {
                return NextResponse.json(
                    { containers: [], error: 'Failed to list containers' },
                    { status: 200 }
                );
            }

            return NextResponse.json({
                containers: response.data || []
            });
        }

    } catch (error: any) {
        console.error('[Docker] Error:', error.message);
        return NextResponse.json(
            { containers: [], error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/docker
 * Control Docker containers (start, stop, restart, remove)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, containerId } = body;

        if (!action || !containerId) {
            return NextResponse.json(
                { error: 'action and containerId are required' },
                { status: 400 }
            );
        }

        let endpoint = '';
        switch (action) {
            case 'start':
                endpoint = `${API_URL}/docker/containers/${containerId}/start`;
                break;
            case 'stop':
                endpoint = `${API_URL}/docker/containers/${containerId}/stop`;
                break;
            case 'restart':
                endpoint = `${API_URL}/docker/containers/${containerId}/restart`;
                break;
            case 'remove':
                endpoint = `${API_URL}/docker/containers/${containerId}`;
                break;
            case 'logs':
                endpoint = `${API_URL}/docker/containers/${containerId}/logs`;
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: start, stop, restart, remove, logs' },
                    { status: 400 }
                );
        }

        const method = action === 'remove' ? 'delete' : 'post';
        const response = await axios({
            method,
            url: endpoint,
            headers: getAuthHeaders(request),
            validateStatus: () => true
        });

        if (response.status >= 400) {
            return NextResponse.json(
                { success: false, error: response.data?.detail || `Failed to ${action} container` },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            data: response.data
        });

    } catch (error: any) {
        console.error('[Docker] Action error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
