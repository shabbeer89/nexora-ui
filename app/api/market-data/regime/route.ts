
import { NextResponse } from 'next/server';

export async function GET() {
    // Simulated Market Regime Logic
    // In a real app, this would fetch candles for BTC, calculate SMA/EMA, Volume, etc.

    // Mock Data
    const regime = {
        current: "Trending Bullish",
        confidence: 85,
        indicator: "SMA 50 > SMA 200",
        volatility: "Moderate",
        recommendation: "Long Bias Strategies (DCA, Momentum)"
    };

    return NextResponse.json(regime);
}
