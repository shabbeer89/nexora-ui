/**
 * Bot Capital Allocation API
 * Detailed capital breakdown per bot
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';
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
        console.error('[Capital/Allocation] Server auth failed:', error);
        throw error;
    }
}

export async function GET(request: Request) {
    try {
        console.log('[Capital/Allocation] Starting bot capital allocation fetch...');

        const token = await getServerToken();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Fetch bot runs
        const botRunsResponse = await axios.get(`${API_URL}/bot-orchestration/bot-runs`, {
            headers,
            validateStatus: () => true,
            timeout: 10000
        });

        if (botRunsResponse.status >= 400) {
            console.error('[Capital/Allocation] Failed to fetch bot runs:', botRunsResponse.status);
            return NextResponse.json({
                error: 'Failed to fetch bots',
                bots: []
            }, { status: botRunsResponse.status });
        }

        const botRuns = botRunsResponse.data?.data || [];
        console.log(`[Capital/Allocation] Processing ${botRuns.length} bot runs...`);
        const botCapitals = [];

        for (const run of botRuns) {
            if (run.is_archived) continue;

            try {
                const botName = run.bot_name || run.instance_name;
                const configName = run.config_name?.replace('.yml', '') || botName;

                // Get config details
                const configResponse = await axios.get(`${API_URL}/scripts/configs/${configName}`, {
                    headers,
                    validateStatus: () => true,
                    timeout: 5000
                });

                if (configResponse.status !== 200) {
                    console.log(`[Capital/Allocation] Skipping ${botName} - no config`);
                    continue;
                }

                const config = configResponse.data || {};
                console.log(`[Capital/Allocation] Bot ${botName} config keys:`, Object.keys(config).slice(0, 10));

                // Extract allocated capital
                let allocatedCapital = 0;

                if (config.total_investment_amount) {
                    allocatedCapital = parseFloat(config.total_investment_amount);
                } else if (config.order_amount) {
                    allocatedCapital = parseFloat(config.order_amount);
                } else if (config.capital) {
                    allocatedCapital = parseFloat(config.capital);
                } else if (config.base_order_amount) {
                    const baseOrder = parseFloat(config.base_order_amount || 0);
                    const safetyOrder = parseFloat(config.safety_order_amount || 0);
                    const maxSafety = parseInt(config.max_safety_orders || 5);
                    allocatedCapital = baseOrder + (safetyOrder * maxSafety);
                }

                // Rough estimate of capital in use
                let usedCapital = 0;
                const isRunning =
                    run.run_status?.toUpperCase() === 'RUNNING' ||
                    run.deployment_status?.toUpperCase() === 'RUNNING' ||
                    run.deployment_status === 'DEPLOYED';

                if (isRunning) {
                    usedCapital = allocatedCapital * 0.3; // Conservative 30% estimate
                }

                const availableCapital = allocatedCapital - usedCapital;
                const currentValue = allocatedCapital;
                const unrealizedPnL = 0;

                // Get fees from trades
                let totalFees = 0;
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
                        totalFees = tradesResponse.data.data.reduce((sum: number, trade: any) => {
                            return sum + parseFloat(trade.fee || trade.trade_fee || 0);
                        }, 0);
                    }
                } catch (feeErr) {
                    console.log(`[Capital/Allocation] Could not fetch fees for ${botName}`);
                }

                console.log(`[Capital/Allocation] ${botName}: Allocated=$${allocatedCapital}, Used=$${usedCapital}, Fees=$${totalFees}`);

                botCapitals.push({
                    botId: run.instance_id || botName,
                    botName,
                    status: isRunning ? 'running' : 'stopped',
                    allocatedCapital,
                    usedCapital,
                    availableCapital: Math.max(0, availableCapital),
                    currentValue,
                    unrealizedPnL,
                    totalFees,
                    strategy: run.strategy_name || config.script_file_name?.replace('.py', '') || 'Unknown',
                    exchange: config.exchange || 'Unknown',
                    tradingPair: config.trading_pair || 'Unknown'
                });

            } catch (err: any) {
                console.error(`[Capital/Allocation] Error processing bot:`, err.message);
            }
        }

        console.log(`[Capital/Allocation] Successfully processed ${botCapitals.length} bots`);

        return NextResponse.json({
            bots: botCapitals
        });

    } catch (error: any) {
        console.error('[Capital/Allocation] Error:', error.message);
        return NextResponse.json({
            error: error.message,
            bots: []
        }, { status: 500 });
    }
}
