/**
 * PerformanceEngine - Client-side performance analytics
 * =====================================================
 * Calculates trading performance metrics from trade data.
 * This is a simplified version that runs entirely in the browser.
 */

export interface PerformanceMetrics {
    totalReturn: number;
    winRate: number;
    profitFactor: number;
    tradesCount: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
}

interface Trade {
    pnl?: number;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: string | number;
}

export class PerformanceEngine {
    private startingCapital: number;

    constructor(startingCapital: number = 10000) {
        this.startingCapital = startingCapital;
    }

    getEmptyMetrics(): PerformanceMetrics {
        return {
            totalReturn: 0,
            winRate: 0,
            profitFactor: 0,
            tradesCount: 0,
            avgWin: 0,
            avgLoss: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
        };
    }

    calculateMetrics(trades: Trade[], equityCurve: number[]): PerformanceMetrics {
        if (!trades || trades.length === 0) {
            return this.getEmptyMetrics();
        }

        const tradesWithPnl = trades.filter(t => t.pnl !== undefined && t.pnl !== null);

        if (tradesWithPnl.length === 0) {
            return {
                ...this.getEmptyMetrics(),
                tradesCount: trades.length,
            };
        }

        const wins = tradesWithPnl.filter(t => (t.pnl || 0) > 0);
        const losses = tradesWithPnl.filter(t => (t.pnl || 0) < 0);

        const totalPnl = tradesWithPnl.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalWins = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

        const winRate = (wins.length / tradesWithPnl.length) * 100;
        const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
        const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

        // Calculate max drawdown from equity curve
        let maxDrawdown = 0;
        if (equityCurve.length > 0) {
            let peak = equityCurve[0];
            for (const value of equityCurve) {
                if (value > peak) peak = value;
                const drawdown = ((peak - value) / peak) * 100;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }
        }

        // Calculate Sharpe Ratio (simplified - assumes daily returns)
        const returns: number[] = [];
        for (let i = 1; i < equityCurve.length; i++) {
            const dailyReturn = (equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1];
            returns.push(dailyReturn);
        }

        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const stdDev = returns.length > 1
            ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
            : 0;
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

        return {
            totalReturn: (totalPnl / this.startingCapital) * 100,
            winRate,
            profitFactor: isFinite(profitFactor) ? profitFactor : 999,
            tradesCount: trades.length,
            avgWin,
            avgLoss,
            maxDrawdown,
            sharpeRatio,
        };
    }
}
