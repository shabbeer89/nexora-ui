/**
 * Capital Management API Routes
 * Provides real-time capital allocation, balance tracking, and fee management
 */

import { NextResponse } from 'next/server';
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
        console.error('[Capital] Server auth failed:', error);
        throw error;
    }
}

/**
 * GET /api/capital/summary
 * Get overall capital allocation summary
 */
export async function GET(request: Request) {
    try {
        console.log('[Capital/Summary] Starting capital summary calculation...');

        const token = await getServerToken();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Fetch portfolio first to get total capital
        const portfolioResponse = await axios.get(`${API_URL}/portfolio`, {
            headers,
            validateStatus: () => true,
            timeout: 10000
        });

        let totalCapital = 0;
        if (portfolioResponse.status === 200 && portfolioResponse.data) {
            const assets = portfolioResponse.data.assets || [];
            totalCapital = assets.reduce((sum: number, asset: any) => {
                const assetValue = parseFloat(asset.value || asset.total_balance || 0);
                console.log(`[Capital] Asset ${asset.symbol}: $${assetValue}`);
                return sum + assetValue;
            }, 0);
            console.log(`[Capital] Total Portfolio Value: $${totalCapital}`);
        }

        // Fetch bot runs (NOT /bots which doesn't exist)
        const botRunsResponse = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, {
            headers,
            validateStatus: () => true,
            timeout: 10000
        });

        if (botRunsResponse.status >= 400) {
            console.error('[Capital] Failed to fetch bot runs:', botRunsResponse.status);
            return NextResponse.json({
                totalCapital,
                allocatedCapital: 0,
                availableCapital: totalCapital,
                lockedCapital: 0,
                totalFees: 0,
                efficiency: 0,
                error: 'Failed to fetch bots'
            });
        }

        const botRuns = botRunsResponse.data?.data || [];
        console.log(`[Capital] Found ${botRuns.length} bot runs`);

        let allocatedCapital = 0;
        let totalFees = 0;
        let lockedCapital = 0;
        let botsProcessed = 0;

        for (const run of botRuns) {
            if (run.is_archived) continue;

            try {
                const botName = run.bot_name || run.instance_name;
                const configName = run.config_name?.replace('.yml', '') || botName;

                console.log(`[Capital] Processing bot: ${botName}`);

                // Get config to extract capital allocation
                const configResponse = await axios.get(`${API_URL}/scripts/configs/${configName}`, {
                    headers,
                    validateStatus: () => true,
                    timeout: 5000
                });

                if (configResponse.status !== 200) {
                    console.log(`[Capital] Skipping ${botName} - no config`);
                    continue;
                }

                const config = configResponse.data || {};
                console.log(`[Capital] Bot ${botName} config keys:`, Object.keys(config).slice(0, 15));

                // Try multiple field names for capital allocation
                let botAllocation = 0;

                if (config.total_investment_amount) {
                    botAllocation = parseFloat(config.total_investment_amount);
                    console.log(`[Capital] ${botName} - total_investment_amount: ${botAllocation}`);
                } else if (config.order_amount) {
                    botAllocation = parseFloat(config.order_amount);
                    console.log(`[Capital] ${botName} - order_amount: ${botAllocation}`);
                } else if (config.capital) {
                    botAllocation = parseFloat(config.capital);
                    console.log(`[Capital] ${botName} - capital: ${botAllocation}`);
                } else if (config.base_order_amount) {
                    const baseOrder = parseFloat(config.base_order_amount || 0);
                    const safetyOrder = parseFloat(config.safety_order_amount || 0);
                    const maxSafety = parseInt(config.max_safety_orders || 5);
                    botAllocation = baseOrder + (safetyOrder * maxSafety);
                    console.log(`[Capital] ${botName} - calculated from DCA: ${botAllocation}`);
                }

                if (botAllocation > 0) {
                    allocatedCapital += botAllocation;
                    botsProcessed++;

                    // If bot is running, this capital is locked (check both cases)
                    const isRunning =
                        run.run_status?.toUpperCase() === 'RUNNING' ||
                        run.deployment_status?.toUpperCase() === 'RUNNING' ||
                        run.deployment_status === 'DEPLOYED'; // DEPLOYED usually means running

                    if (isRunning) {
                        lockedCapital += botAllocation;
                        console.log(`[Capital] ${botName} is RUNNING - locking $${botAllocation}`);
                    }
                }

                // Extract fees from trades if available
                try {
                    const tradesResponse = await axios.post(
                        `${API_URL}/trading/trades`,
                        {
                            limit: 1000,
                            bot_name: botName
                        },
                        {
                            headers,
                            validateStatus: () => true,
                            timeout: 5000
                        }
                    );

                    if (tradesResponse.status === 200 && tradesResponse.data?.data) {
                        const botFees = tradesResponse.data.data.reduce((sum: number, trade: any) => {
                            return sum + parseFloat(trade.fee || trade.trade_fee || 0);
                        }, 0);
                        totalFees += botFees;
                        console.log(`[Capital] ${botName} - fees: $${botFees}`);
                    }
                } catch (feeErr) {
                    console.log(`[Capital] Could not fetch fees for ${botName}`);
                }

            } catch (err: any) {
                console.error(`[Capital] Error processing bot:`, err.message);
            }
        }

        const availableCapital = totalCapital - allocatedCapital;
        const efficiency = allocatedCapital > 0 ? (lockedCapital / allocatedCapital) * 100 : 0;

        console.log('[Capital/Summary] Final Results:', {
            totalCapital,
            allocatedCapital,
            availableCapital,
            lockedCapital,
            totalFees,
            efficiency,
            botsProcessed
        });

        return NextResponse.json({
            totalCapital,
            allocatedCapital,
            availableCapital: Math.max(0, availableCapital),
            lockedCapital,
            totalFees,
            efficiency
        });

    } catch (error: any) {
        console.error('[Capital/Summary] Error:', error.message);
        return NextResponse.json({
            totalCapital: 0,
            allocatedCapital: 0,
            availableCapital: 0,
            lockedCapital: 0,
            totalFees: 0,
            efficiency: 0,
            error: error.message
        }, { status: 500 });
    }
}
