/**
 * Bot Activity/Orders API Route
 * ==============================
 * GET /api/orders - Get recent order activity from running bots
 * 
 * Proxies to real Hummingbot API trading endpoints:
 * - /trading/orders/active (In-flight orders)
 * - /trading/orders/search (Historical orders)
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

const getAuthHeaders = (request: Request) => {
    // ALWAYS use Basic Auth for upstream calls to the Bot/Hummingbot API
    const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
    };
};

export async function GET(request: Request) {
    try {
        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true,
            timeout: 25000, // 25 second timeout to handle increased load with 10 bots
            maxRedirects: 0
        };

        const activeOrdersRes = await axios.post(`${API_URL}/trading/orders/active`, {
            limit: 50
        }, axiosConfig);

        const historyOrdersRes = await axios.post(`${API_URL}/trading/orders/search`, {
            limit: 50,
            status: ["FILLED", "CANCELLED", "FAILED"]
        }, axiosConfig);

        // Explicit status checks
        const activeOrdersData = activeOrdersRes.status === 200 ? (activeOrdersRes.data?.data || []) : [];
        const historyOrdersData = historyOrdersRes.status === 200 ? (historyOrdersRes.data?.data || []) : [];

        // Safety filter to ensure we only have valid order objects
        const validActive = Array.isArray(activeOrdersData) ? activeOrdersData.filter(o => o && typeof o === 'object') : [];
        const validHistory = Array.isArray(historyOrdersData) ? historyOrdersData.filter(o => o && typeof o === 'object') : [];

        const allOrders = [...validActive, ...validHistory];

        const botCount = new Set(allOrders.map((o: any) => o.account_name).filter(Boolean)).size;

        // Sort with safety for missing timestamps
        allOrders.sort((a: any, b: any) => {
            const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
            const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
            return timeB - timeA;
        });

        return NextResponse.json({
            orders: allOrders.slice(0, 50),
            botCount: botCount,
            lastUpdated: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Orders] Error:', error.message);
        return NextResponse.json(
            { orders: [], botCount: 0, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders/search
 * Advanced order search with filters
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await axios.post(
            `${API_URL}/trading/orders/search`,
            body,
            { headers: getAuthHeaders(request) }
        );

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[Orders Search] Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.detail || error.message },
            { status: error.response?.status || 500 }
        );
    }
}
