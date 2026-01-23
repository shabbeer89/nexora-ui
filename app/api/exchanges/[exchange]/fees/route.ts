import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.HUMMINGBOT_API_URL || 'http://localhost:8888';

const getAuthHeaders = (request: Request) => {
    const authHeader = request.headers.get('authorization');
    return {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
    };
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ exchange: string }> }
) {
    try {
        const { exchange } = await params;
        const { searchParams } = new URL(request.url);
        const pair = searchParams.get('pair');

        if (!exchange) {
            return NextResponse.json({ error: 'Exchange missing' }, { status: 400 });
        }

        // 1. Try to fetch from Hummingbot API (some CEX connectors might include this in trading rules or account info)
        // For now, we use a robust fallback map of common exchange fees
        // In a real production environment, we would query the exchange API directly or via Hummingbot Gateway
        const DEFAULT_FEES: Record<string, { maker: number; taker: number }> = {
            'binance': { maker: 0.1, taker: 0.1 },
            'binance_paper_trade': { maker: 0.1, taker: 0.1 },
            'kucoin': { maker: 0.1, taker: 0.1 },
            'kucoin_paper_trade': { maker: 0.1, taker: 0.1 },
            'gate_io': { maker: 0.2, taker: 0.2 },
            'ascend_ex': { maker: 0.1, taker: 0.1 },
            'bybit': { maker: 0.1, taker: 0.1 },
            'okx': { maker: 0.08, taker: 0.1 },
            'kraken': { maker: 0.16, taker: 0.26 },
            'mexc': { maker: 0, taker: 0.1 },
            'uniswap': { maker: 0.3, taker: 0.3 }, // LP fee
        };

        const baseExchange = exchange.replace('_paper_trade', '');
        const fees = DEFAULT_FEES[exchange] || DEFAULT_FEES[baseExchange] || { maker: 0.1, taker: 0.1 };

        return NextResponse.json({
            exchange,
            pair,
            maker: fees.maker,
            taker: fees.taker,
            source: 'config'
        });

    } catch (error: any) {
        console.error('[Fees] Error:', error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
