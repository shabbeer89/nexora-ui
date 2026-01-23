/**
 * Portfolio API Route
 * ====================
 * GET /api/portfolio - Get portfolio state from Hummingbot API
 * Enhanced to include bot status and recent trades for complete picture
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
        console.log('[Portfolio] Fetching from Hummingbot API...');

        const axiosConfig = {
            headers: getAuthHeaders(request),
            validateStatus: () => true
        };

        // Calculate 24h ago timestamp
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

        // Fetch multiple data sources in parallel, with isolation for each
        const [portfolioRes, botsRes, tradesRes, historyRes] = await Promise.all([
            axios.post(`${API_URL}/portfolio/state`, { account_names: ['master_account'] }, axiosConfig)
                .catch(err => ({ status: 500, data: null, error: err.message })),
            axios.get(`${API_URL}/bot-orchestration/status`, axiosConfig)
                .catch(err => ({ status: 500, data: null, error: err.message })),
            axios.post(`${API_URL}/trading/trades`, { limit: 50 }, axiosConfig)
                .catch(err => ({ status: 500, data: null, error: err.message })),
            axios.post(`${API_URL}/portfolio/history`, {
                account_names: ['master_account'],
                start_time: twentyFourHoursAgo,
                end_time: twentyFourHoursAgo + (5 * 60 * 1000), // 5 min window
                limit: 1,
                interval: '5m'
            }, axiosConfig).catch(err => ({ status: 500, data: null, error: err.message }))
        ]);

        let totalValue = 0;
        const assets: any[] = [];
        const connectedExchanges: any[] = [];
        const recentActivity: any[] = [];

        // Process portfolio balances
        if (portfolioRes.status === 200 && portfolioRes.data?.balances) {
            for (const [exchange, balances] of Object.entries(portfolioRes.data.balances)) {
                connectedExchanges.push({ id: exchange, name: exchange, status: 'connected' });

                for (const [symbol, details] of Object.entries(balances as any)) {
                    const amount = (details as any).total || 0;
                    if (amount > 0) {
                        assets.push({
                            symbol,
                            amount,
                            value: 0,
                            allocation: 0,
                            exchange
                        });
                    }
                }
            }
        }

        // Also add exchanges from running bots (paper trading may not show in balances)
        if (botsRes.status === 200 && botsRes.data?.data) {
            const botInstances = Object.entries(botsRes.data.data as any);
            const configConfigs = { ...axiosConfig, timeout: 5000 };

            await Promise.all(botInstances.map(async ([botName, botData]) => {
                try {
                    const configRes = await axios.get(`${API_URL}/scripts/configs/${botName}`, configConfigs);
                    if (configRes.status === 200 && configRes.data?.exchange) {
                        const exchange = configRes.data.exchange;
                        if (!connectedExchanges.find(e => e.id === exchange)) {
                            connectedExchanges.push({
                                id: exchange,
                                name: exchange.replace('_paper_trade', ' (Paper)'),
                                status: (botData as any).status === 'running' ? 'active' : 'connected'
                            });
                        }
                    }
                } catch {
                    // Config not found, skip
                }
            }));
        }

        // Process recent trades for activity
        if (tradesRes.status === 200) {
            const trades = tradesRes.data?.data || tradesRes.data || [];
            if (Array.isArray(trades)) {
                trades.slice(0, 50).forEach((trade: any) => {
                    const tradeType = (trade.trade_type || 'BUY').toUpperCase();
                    const amount = parseFloat(trade.amount) || 0;
                    const price = parseFloat(trade.price) || 0;
                    const pnl = parseFloat(trade.pnl);
                    const volume = price * amount;

                    // Only show PnL for sell trades (buy trades don't have realized PnL)
                    const hasPnL = !isNaN(pnl) && pnl !== 0 && tradeType === 'SELL';

                    recentActivity.push({
                        type: 'Trade',
                        description: `${tradeType} ${amount.toFixed(4)} ${trade.trading_pair || 'UNKNOWN'}`,
                        time: trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : 'Recently',
                        // Show PnL for sells (with +/- prefix), volume for buys (labeled clearly)
                        value: hasPnL
                            ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`
                            : `Vol: $${volume.toFixed(2)}`,
                        // Add valueType to help UI styling
                        valueType: hasPnL ? (pnl >= 0 ? 'profit' : 'loss') : 'volume'
                    });
                });
            }
        }

        // Fetch prices for assets to calculate total value
        try {
            // Group assets by exchange
            const assetsByExchange: Record<string, string[]> = {};
            assets.forEach(asset => {
                if (!assetsByExchange[asset.exchange]) assetsByExchange[asset.exchange] = [];
                // Assume USDT pairs for valuation for now
                if (asset.symbol !== 'USDT') {
                    assetsByExchange[asset.exchange].push(`${asset.symbol}-USDT`);
                }
            });

            // Fetch prices for each exchange
            const pricePromises = Object.entries(assetsByExchange).map(async ([exchange, pairs]) => {
                if (pairs.length === 0) return null;
                try {
                    const priceRes = await axios.post(`${API_URL}/market-data/prices`, {
                        connector_name: exchange,
                        trading_pairs: pairs
                    }, axiosConfig);
                    return { exchange, prices: priceRes.data };
                } catch (e) {
                    return null;
                }
            });

            const priceResults = await Promise.all(pricePromises);
            const priceMap: Record<string, number> = {};

            priceResults.forEach(res => {
                if (res && res.prices) {
                    // Map "BTC-USDT" -> 90000
                    // Response format varies, assuming list or dict
                    if (Array.isArray(res.prices)) {
                        res.prices.forEach((p: any) => {
                            priceMap[`${res.exchange}:${p.trading_pair}`] = parseFloat(p.price);
                        });
                    } else if (typeof res.prices === 'object') {
                        // If formatted as key-value
                        Object.entries(res.prices).forEach(([pair, price]: [string, any]) => {
                            priceMap[`${res.exchange}:${pair}`] = parseFloat(price);
                        });
                    }
                }
            });

            // Calculate value
            assets.forEach(asset => {
                if (asset.symbol === 'USDT' || asset.symbol === 'USDC') {
                    asset.value = asset.amount; // Stablecoins
                } else {
                    const pair = `${asset.symbol}-USDT`;
                    const price = priceMap[`${asset.exchange}:${pair}`];
                    if (price) {
                        asset.value = asset.amount * price;
                    }
                }
            });

        } catch (err) {
            console.log('[Portfolio] Error fetching prices:', err);
        }

        // Calculate total value from assets
        totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

        // Calculate 24h change from historical data
        let change24h = 0;
        let change24hPercent = 0;

        if (historyRes.status === 200 && historyRes.data?.data?.length > 0) {
            // Extract total value from 24h ago
            const historicalData = historyRes.data.data[0];
            let historicalValue = 0;

            // Sum up all token values from historical snapshot
            if (historicalData.balances) {
                Object.values(historicalData.balances).forEach((balance: any) => {
                    if (balance.total_value_usd) {
                        historicalValue += balance.total_value_usd;
                    }
                });
            } else if (historicalData.total_value_usd) {
                historicalValue = historicalData.total_value_usd;
            }

            if (historicalValue > 0) {
                change24h = totalValue - historicalValue;
                change24hPercent = ((totalValue - historicalValue) / historicalValue) * 100;
            }
        }

        return NextResponse.json({
            totalValue,
            change24h,
            change24hPercent,
            assets,
            connectedExchanges,
            recentActivity
        });

    } catch (error: any) {
        console.error('[Portfolio] Error:', {
            message: error.message,
            stack: error.stack,
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            responseStatus: error.response?.status,
            responseData: error.response?.data
        });

        return NextResponse.json({
            totalValue: 0,
            change24h: 0,
            change24hPercent: 0,
            assets: [],
            connectedExchanges: [],
            recentActivity: [],
            error: error.message,
            details: error.response?.data || 'No response data',
            path: '/api/portfolio'
        }, { status: 500 });
    }
}

