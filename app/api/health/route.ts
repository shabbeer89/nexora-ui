/**
 * Health Check API Route
 * =======================
 * GET /api/health - Check Hummingbot API health status
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';

export async function GET() {
    const startTime = Date.now();

    try {
        const response = await axios.get(`${API_URL}/`, {
            timeout: 5000,
            validateStatus: () => true
        });

        return NextResponse.json({
            status: response.status < 500 ? 'healthy' : 'unhealthy',
            backendUrl: API_URL,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Health] Backend unreachable:', error.message);

        return NextResponse.json({
            status: 'unhealthy',
            backendUrl: API_URL,
            error: error.code === 'ECONNREFUSED'
                ? 'Hummingbot API not running'
                : error.message,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}
