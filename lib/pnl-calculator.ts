export interface TradeItem {
    id: string;
    price: number;
    quantity: number;
    fee: number;
    timestamp: number;
    side: 'buy' | 'sell';
}

export interface PnLResult {
    totalRealizedPnL: number;
    totalVolume: number;
    totalFees: number;
    winningTrades: number;
    losingTrades: number;
    totalTrades: number;
    tradesWithPnL: any[];
}

export function calculateFIFO(trades: any[]): PnLResult {
    interface InventoryItem {
        price: number;
        quantity: number;
        fee: number;
        timestamp: number;
    }

    const inventory: InventoryItem[] = [];
    let totalRealizedPnL = 0;
    let totalVolume = 0;
    let totalFees = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    // Parse timestamp helper
    const parseTimestamp = (ts: any): number => {
        if (!ts) return Date.now();
        if (typeof ts === 'number') {
            return ts > 32503680000 ? ts : ts * 1000;
        }
        return Date.parse(ts) || Date.now();
    };

    // Sort trades by timestamp for proper FIFO processing
    const sortedTrades = [...trades].sort((a: any, b: any) => {
        const timeA = parseTimestamp(a.timestamp);
        const timeB = parseTimestamp(b.timestamp);
        return timeA - timeB;
    });

    const tradesWithPnL = sortedTrades.map((trade: any, idx: number) => {
        const side = (trade.trade_type || trade.side || 'buy').toLowerCase();
        const price = parseFloat(trade.price) || 0;
        const quantity = parseFloat(trade.amount) || parseFloat(trade.quantity) || 0;
        const fee = parseFloat(trade.trade_fee_in_quote) || parseFloat(trade.trade_fee) || 0;
        const timestamp = parseTimestamp(trade.timestamp);

        let tradePnL = 0;
        let isUnmatchedSell = false;
        totalFees += fee;
        totalVolume += price * quantity;

        if (side === 'buy') {
            inventory.push({ price, quantity, fee, timestamp });
        } else if (side === 'sell') {
            let remainingToSell = quantity;
            let costBasis = 0;
            let matchedQuantity = 0;

            while (remainingToSell > 0 && inventory.length > 0) {
                const oldest = inventory[0];
                const sellFromThis = Math.min(remainingToSell, oldest.quantity);
                costBasis += sellFromThis * oldest.price;
                matchedQuantity += sellFromThis;
                oldest.quantity -= sellFromThis;
                remainingToSell -= sellFromThis;

                if (oldest.quantity <= 0.00000001) {
                    inventory.shift();
                }
            }

            // Unmatched portion
            if (remainingToSell > 0.00000001) {
                costBasis += remainingToSell * price;
                isUnmatchedSell = true;
            }

            const revenue = quantity * price;
            // Full PnL for this trade event
            tradePnL = revenue - costBasis - fee;

            // Stats calculation (only for matched or fully processed)
            if (!isUnmatchedSell || matchedQuantity > 0.00000001) {
                const matchedRevenue = matchedQuantity * price;
                const matchedPnL = matchedRevenue - (costBasis - remainingToSell * price) - (fee * matchedQuantity / quantity);

                if (matchedPnL > 0) winningTrades++;
                else if (matchedPnL < 0) losingTrades++;

                totalRealizedPnL += matchedPnL;
                tradePnL = matchedPnL;
            } else {
                tradePnL = -fee;
                totalRealizedPnL -= fee;
            }
        }

        return {
            ...trade,
            timestampMs: timestamp,
            pnl: tradePnL,
            isUnmatchedSell
        };
    });

    return {
        totalRealizedPnL,
        totalVolume,
        totalFees,
        winningTrades,
        losingTrades,
        totalTrades: trades.length,
        tradesWithPnL
    };
}
