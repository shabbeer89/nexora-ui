/**
 * Bot-Specific Orders API Route
 * ==============================
 * GET /api/bots/[id]/orders - Get active and historical orders for a specific bot
 * 
 * Query Params:
 * - page (default: 1) - Page number
 * - limit (default: 50) - Items per page
 * - timeRange (1d|2d|1w|1m|3m|all) - Time period filter
 * - status (all|open|filled|cancelled) - Status filter
 * - side (all|buy|sell) - Side filter
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8000';
const API_USER = process.env.HUMMINGBOT_API_USER || 'admin';
const API_PASS = process.env.HUMMINGBOT_API_PASS || 'admin';

// Token cache for server-side auth
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getServerToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
        return cachedToken.token;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(API_USER)}&password=${encodeURIComponent(API_PASS)}`,
        });

        if (!response.ok) {
            throw new Error(`Auth failed: ${response.status}`);
        }

        const data = await response.json();
        cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in || 900) * 1000,
        };
        return cachedToken.token;
    } catch (error) {
        console.error('[Orders] Server auth failed:', error);
        throw error;
    }
}

const getAuthHeaders = async (request: Request) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader || `Bearer ${await getServerToken()}`;
    return {
        'Content-Type': 'application/json',
        'Authorization': token,
    };
};

// Get timestamp cutoff for time range filter
function getTimeRangeCutoff(timeRange: string): number {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (timeRange) {
        case '1d': return now - day;
        case '2d': return now - (2 * day);
        case '1w': return now - (7 * day);
        case '1m': return now - (30 * day);
        case '3m': return now - (90 * day);
        case 'all':
        default: return 0;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: botId } = await params;
        const { searchParams } = new URL(request.url);

        // Pagination params
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')));

        // Filter params
        const timeRange = searchParams.get('timeRange') || 'all';
        const statusFilter = searchParams.get('status') || 'all';
        const sideFilter = searchParams.get('side') || 'all';

        console.log(`[Bot Orders] Fetching orders for bot: ${botId}, page: ${page}, limit: ${limit}, timeRange: ${timeRange}`);

        const headers = await getAuthHeaders(request);
        const axiosConfig = {
            headers,
            validateStatus: () => true,
            timeout: 15000
        };

        // Resolve ID to Bot Name if necessary
        let botName = botId;
        try {
            const runsRes = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, axiosConfig);
            if (runsRes.status === 200 && Array.isArray(runsRes.data?.data)) {
                const match = runsRes.data.data.find((r: any) => r.instance_id === botId || r.bot_name === botId);
                if (match) {
                    botName = match.bot_name;
                }
            }
        } catch (e) {
            // fallback
        }

        let activeOrders: any[] = [];
        let dbOrders: any[] = [];

        // 1. Fetch active (in-flight) orders from live connector
        try {
            const activeRes = await axios.post(
                `${API_URL}/trading/orders/active`,
                {
                    account_names: [botName],
                    limit: 200
                },
                axiosConfig
            );
            if (activeRes.status === 200) {
                activeOrders = activeRes.data?.data || [];
                console.log(`[Bot Orders] Found ${activeOrders.length} active orders`);
            }
        } catch (e) {
            console.error('[Bot Orders] Error fetching active orders:', e);
        }

        // 2. Fetch historical orders from bot's SQLite database (fetch more for filtering)
        const dbPath = `bots/instances/${botName}/data/${botName}.sqlite`;
        try {
            const dbRes = await axios.get(
                `${API_URL}/archived-bots/${encodeURIComponent(dbPath)}/orders?limit=1000`,
                axiosConfig
            );
            if (dbRes.status === 200) {
                dbOrders = dbRes.data?.orders || [];
                console.log(`[Bot Orders] Found ${dbOrders.length} orders in database`);
            }
        } catch (e) {
            console.error('[Bot Orders] Error fetching database orders:', e);
        }

        // Parse timestamps - they are already in milliseconds from the SQLite database
        const parseTimestamp = (ts: any): number => {
            if (!ts) return Date.now();
            const numTs = parseFloat(ts);
            // If timestamp is less than year 3000 in seconds, it's in seconds
            // Otherwise it's already in milliseconds
            return numTs > 32503680000 ? numTs : numTs * 1000;
        };

        // Format active orders (from live connector)
        const formatActiveOrder = (order: any) => ({
            id: order.client_order_id || order.exchange_order_id || order.id,
            botId: order.account_name || botId,
            symbol: order.trading_pair || 'UNKNOWN',
            side: (order.trade_type || order.side || 'buy').toLowerCase(),
            type: order.order_type || 'limit',
            price: parseFloat(order.price) || 0,
            amount: parseFloat(order.amount) || 0,
            filled: parseFloat(order.filled_amount) || parseFloat(order.executed_amount) || 0,
            status: 'OPEN',
            exchange: order.connector_name || order.exchange || 'unknown',
            createdAt: order.created_at || order.creation_timestamp || order.timestamp || new Date().toISOString(),
            updatedAt: order.updated_at || order.last_update_timestamp || new Date().toISOString(),
            timestamp: parseTimestamp(order.creation_timestamp || order.timestamp) || Date.now(),
            isActive: true
        });

        // Format database orders (historical)
        const formatDbOrder = (order: any) => {
            // Determine status from order state - check both last_status and order_state fields
            let status = 'UNKNOWN';
            const stateField = order.last_status || order.order_state;
            if (stateField) {
                const state = String(stateField).toUpperCase();
                if (state.includes('FILL') || state.includes('COMPLETE')) {
                    status = 'FILLED';
                } else if (state.includes('CANCEL')) {
                    status = 'CANCELLED';
                } else if (state.includes('FAIL') || state.includes('REJECT')) {
                    status = 'FAILED';
                } else if (state.includes('PENDING') || state.includes('OPEN') || state.includes('CREATED')) {
                    status = 'OPEN';
                } else {
                    status = state;
                }
            }

            const timestamp = parseTimestamp(order.creation_timestamp);

            return {
                id: order.order_id || order.id || order.client_order_id,
                botId: order.bot_name || botId,
                symbol: order.trading_pair || order.symbol || 'UNKNOWN',
                side: (order.trade_type || order.side || 'buy').toLowerCase(),
                type: (order.order_type || 'limit').toLowerCase(),
                price: parseFloat(order.price) || 0,
                amount: parseFloat(order.amount) || parseFloat(order.quantity) || 0,
                filled: parseFloat(order.filled_amount) || parseFloat(order.executed_amount_base) || 0,
                status: status,
                exchange: order.connector_name || order.exchange || 'unknown',
                createdAt: new Date(timestamp).toISOString(),
                updatedAt: new Date(parseTimestamp(order.last_update_timestamp)).toISOString(),
                timestamp: timestamp,
                isActive: false
            };
        };

        const formattedActiveOrders = activeOrders.map(formatActiveOrder);
        const formattedDbOrders = dbOrders.map(formatDbOrder);

        // Merge and deduplicate (prefer active orders over db orders for same ID)
        const activeOrderIds = new Set(formattedActiveOrders.map(o => o.id));
        const uniqueHistoryOrders = formattedDbOrders.filter(o => !activeOrderIds.has(o.id));

        // Combine all orders
        let allOrders = [...formattedActiveOrders, ...uniqueHistoryOrders];

        // Apply time range filter
        const timeCutoff = getTimeRangeCutoff(timeRange);
        if (timeCutoff > 0) {
            allOrders = allOrders.filter(o => o.timestamp >= timeCutoff);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            const statusUpper = statusFilter.toUpperCase();
            allOrders = allOrders.filter(o => {
                if (statusUpper === 'OPEN') return o.isActive || o.status === 'OPEN';
                return o.status === statusUpper;
            });
        }

        // Apply side filter
        if (sideFilter !== 'all') {
            allOrders = allOrders.filter(o => o.side === sideFilter.toLowerCase());
        }

        // Sort by creation time (newest first)
        allOrders.sort((a, b) => b.timestamp - a.timestamp);

        // Calculate total before pagination
        const total = allOrders.length;
        const totalPages = Math.ceil(total / limit);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedOrders = allOrders.slice(startIndex, startIndex + limit);

        // Calculate statistics (on filtered data)
        const stats = {
            totalOrders: total,
            activeOrders: allOrders.filter(o => o.isActive).length,
            filledOrders: allOrders.filter(o => o.status === 'FILLED').length,
            cancelledOrders: allOrders.filter(o => o.status === 'CANCELLED').length,
            buyOrders: allOrders.filter(o => o.side === 'buy').length,
            sellOrders: allOrders.filter(o => o.side === 'sell').length
        };

        return NextResponse.json({
            orders: paginatedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages,
                showing: {
                    from: total > 0 ? startIndex + 1 : 0,
                    to: Math.min(startIndex + limit, total)
                }
            },
            stats,
            filters: {
                timeRange,
                status: statusFilter,
                side: sideFilter
            }
        });

    } catch (error: any) {
        console.error('[Bot Orders] Error:', error.message);
        return NextResponse.json(
            {
                orders: [],
                pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false },
                stats: {},
                error: error.message
            },
            { status: 500 }
        );
    }
}
