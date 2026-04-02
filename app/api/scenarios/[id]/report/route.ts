/**
 * Scenario Report API Route
 * ==========================
 * GET /api/scenarios/[id]/report
 * 
 * Constructs a scenario report by:
 * 1. Fetching scenario details (including execution_log with trade history)
 * 2. Fetching P&L data
 * 3. Fetching FreqTrade completed/active trades from /api/trades
 * 4. Parsing execution_log entries into structured trade objects
 */

import { NextResponse } from 'next/server';

const API_URL = process.env.NEXORA_BACKEND_URL || process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

/**
 * Parse execution_log entries like:
 *   "🏛️ CEX BUY: ETH/USDT (0.203 @ $1972.67) | Closed with 1.00% profit"
 * into structured trade objects for the ScenarioReportModal table.
 */
function parseExecutionLog(logEntries: any[]): any[] {
    const trades: any[] = [];
    
    for (const entry of logEntries) {
        const msg = entry.message || '';
        
        // Match: "CEX BUY: ETH/USDT (0.203 @ $1972.67) | Closed with 1.00% profit"
        const cexMatch = msg.match(
            /CEX\s+(BUY|SELL):\s+(\S+)\s+\(([0-9.]+)\s+@\s+\$([0-9.,]+)\)\s*\|\s*Closed with\s+([0-9.]+)%\s+profit/i
        );
        
        if (cexMatch) {
            const tradeType = cexMatch[1].toUpperCase();
            const pair = cexMatch[2];
            const amount = parseFloat(cexMatch[3]);
            const price = parseFloat(cexMatch[4].replace(',', ''));
            const profitPct = parseFloat(cexMatch[5]) / 100;
            const volume = amount * price;
            const profitAbs = volume * profitPct;
            
            trades.push({
                trade_id: `log-${trades.length + 1}`,
                pair: pair,
                is_short: tradeType === 'SELL',
                is_open: false,
                open_rate: price,
                close_rate: price * (1 + profitPct),
                amount: amount,
                profit_abs: profitAbs,
                profit_ratio: profitPct,
                close_date: entry.timestamp,
                source: 'execution_log',
                type: 'CEX',
            });
            continue;
        }
        
        // Match DEX trades: "DEX BUY: ..." or "DEX SELL: ..."
        const dexMatch = msg.match(
            /DEX\s+(BUY|SELL):\s+(\S+)\s+\(([0-9.]+)\s+@\s+\$([0-9.,]+)\)/i
        );
        
        if (dexMatch) {
            const tradeType = dexMatch[1].toUpperCase();
            const market = dexMatch[2];
            const amount = parseFloat(dexMatch[3]);
            const price = parseFloat(dexMatch[4].replace(',', ''));
            
            trades.push({
                market: market,
                symbol: market,
                exchange: 'DEX',
                trade_type: tradeType,
                price: price,
                amount: amount,
                timestamp: new Date(entry.timestamp).getTime() / 1000,
                source: 'execution_log',
                type: 'DEX',
            });
            continue;
        }
    }
    
    return trades;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: scenarioId } = await params;

    try {
        const authHeader = request.headers.get('authorization');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        // Fetch scenario details (includes execution_log), PnL, and real trades in parallel
        const [scenarioRes, pnlRes, tradesRes, activeTradesRes] = await Promise.all([
            fetch(`${API_URL}/api/scenarios/${scenarioId}`, {
                headers,
                signal: AbortSignal.timeout(10000),
            }).catch(err => ({ ok: false, status: 500, json: async () => null, error: err.message })),
            fetch(`${API_URL}/api/scenarios/${scenarioId}/pnl`, {
                headers,
                signal: AbortSignal.timeout(10000),
            }).catch(err => ({ ok: false, status: 500, json: async () => null, error: err.message })),
            fetch(`${API_URL}/api/trades`, {
                headers,
                signal: AbortSignal.timeout(8000),
            }).catch(err => ({ ok: false, status: 500, json: async () => null, error: err.message })),
            fetch(`${API_URL}/api/trades/active`, {
                headers,
                signal: AbortSignal.timeout(8000),
            }).catch(err => ({ ok: false, status: 500, json: async () => null, error: err.message })),
        ]);

        // Get scenario data
        if (!scenarioRes.ok) {
            const status = 'status' in scenarioRes ? scenarioRes.status : 500;
            return NextResponse.json(
                { error: `Scenario not found: ${scenarioId}` },
                { status }
            );
        }

        const scenario = await scenarioRes.json();
        const pnlData = pnlRes.ok ? await pnlRes.json() : null;
        const tradesData = tradesRes.ok ? await tradesRes.json() : null;
        const activeTradesData = activeTradesRes.ok ? await activeTradesRes.json() : null;

        // Parse execution_log into structured trades
        const executionLog = scenario.execution_log || [];
        const parsedTrades = parseExecutionLog(executionLog);
        
        // Separate parsed trades by type
        const cexLogTrades = parsedTrades.filter(t => t.type === 'CEX');
        const dexLogTrades = parsedTrades.filter(t => t.type === 'DEX');

        // Get real FreqTrade completed trades (from /api/trades)
        const allCompletedTrades = tradesData?.trades || [];
        const allActiveTrades = activeTradesData?.trades || [];

        // Format FreqTrade completed trades into the modal format
        const freqTradeCompleted = allCompletedTrades.map((t: any) => ({
            trade_id: t.trade_id || t.id,
            pair: t.symbol || t.pair,
            is_short: t.is_short || false,
            is_open: false,
            open_rate: t.entry_price || t.open_rate,
            close_rate: t.exit_price || t.close_rate,
            amount: t.metadata?.amount || t.amount || 0,
            profit_abs: t.pnl_usd || t.profit_abs || 0,
            profit_ratio: t.pnl_pct || t.profit_ratio || 0,
            close_date: t.exit_time || t.close_date,
            source: 'freqtrade',
            strategy: t.strategy,
        }));

        // Format FreqTrade active/open trades
        const freqTradeOpen = allActiveTrades.map((t: any) => ({
            trade_id: t.trade_id || t.id,
            pair: t.symbol || t.pair,
            is_short: t.is_short || false,
            is_open: true,
            open_rate: t.entry_price || t.open_rate,
            current_rate: t.current_rate || t.exit_price,
            amount: t.metadata?.amount || t.amount || 0,
            profit_abs: t.pnl_usd || t.profit_abs || 0,
            profit_ratio: t.pnl_pct || t.profit_ratio || 0,
            open_date: t.entry_time || t.open_date,
            source: 'freqtrade',
            strategy: t.strategy,
        }));

        // Extract trading pairs referenced in this scenario's execution_log
        const scenarioPairs = new Set<string>();
        for (const entry of executionLog) {
            const msg = entry.message || '';
            const pairMatch = msg.match(/(?:CEX|DEX)\s+\w+:\s+(\S+)/i);
            if (pairMatch) {
                // Normalize: "ETH/USDT" and "ETH-USDT" should both match
                scenarioPairs.add(pairMatch[1].replace('-', '/'));
            }
        }

        // Filter global trades to only those matching this scenario's pairs
        const scenarioCompleted = freqTradeCompleted.filter((t: any) => {
            const normalizedPair = (t.pair || '').replace('-', '/');
            return scenarioPairs.has(normalizedPair);
        });

        const scenarioOpen = freqTradeOpen.filter((t: any) => {
            const normalizedPair = (t.pair || '').replace('-', '/');
            return scenarioPairs.has(normalizedPair);
        });

        // Use filtered FreqTrade trades if available, otherwise fall back to parsed logs
        const cexRecentTrades = scenarioCompleted.length > 0 
            ? scenarioCompleted 
            : cexLogTrades;
        
        const cexOpenTrades = scenarioOpen;


        // Construct the report in the format ScenarioReportModal expects
        const report = {
            scenario_info: {
                id: scenario.id,
                name: scenario.name,
                description: scenario.description,
                category: scenario.category,
                trigger: scenario.trigger,
                allocation: scenario.allocation,
                cex_strategy: scenario.cex_strategy,
                dex_strategy: scenario.dex_strategy,
                risk_params: scenario.risk_params,
                is_auto: scenario.is_auto,
                status: scenario.status || 'inactive',
                started_at: scenario.started_at,
                pnl: pnlData?.pnl ?? scenario.pnl ?? 0.0,
                cex_pnl: pnlData?.cex_pnl ?? scenario.cex_pnl ?? 0.0,
                dex_pnl: pnlData?.dex_pnl ?? scenario.dex_pnl ?? 0.0,
                capital: pnlData?.capital ?? scenario.capital ?? 0.0,
            },
            cex_data: {
                open_trades: cexOpenTrades,
                recent_trades: cexRecentTrades,
            },
            dex_data: {
                active_orders: [],
                recent_trades: dexLogTrades,
                lp_fees: 0.0,
            },
            timestamp: pnlData?.timestamp || new Date().toISOString(),
        };

        return NextResponse.json(report);
    } catch (error: any) {
        console.error(`[ScenarioReport] Error building report for ${scenarioId}:`, error.message);
        return NextResponse.json(
            { error: `Failed to build report: ${error.message}` },
            { status: 500 }
        );
    }
}
