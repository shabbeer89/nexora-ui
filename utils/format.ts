export const formatStrategyName = (strategyName?: string): string => {
    if (!strategyName) return 'Unknown Strategy';

    const normalized = strategyName.toLowerCase().trim();

    const mapping: Record<string, string> = {
        'simple_pmm': 'Pure Market Making',
        'avellaneda_market_making': 'Avellaneda Market Making',
        'cross_exchange_market_making': 'Cross Exchange Market Making',
        'cross_exchange_mining': 'Liquidity Mining',
        'amm_arb': 'AMM Arbitrage',
        'arbitrage': 'Arbitrage',
        'celo_arb': 'Celo Arbitrage',
        'spot_perpetual_arbitrage': 'Spot Perpetual Arbitrage',
        'perpetual_market_making': 'Perpetual Market Making',
        'script': 'Custom Script',
    };

    if (mapping[normalized]) {
        return mapping[normalized];
    }

    // Fallback: Replace underscores with spaces and capitalize words
    return normalized
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const formatCurrency = (amount: number, currency: string): string => {
    return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)} ${currency}`;
};

export const formatExchangeName = (exchange?: string): string => {
    if (!exchange) return 'N/A';

    // Handle paper trade suffix
    const isPaper = exchange.endsWith('_paper_trade');
    const baseName = isPaper ? exchange.replace('_paper_trade', '') : exchange;

    // Capitalize properly (e.g. binance -> Binance)
    const formatted = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    return isPaper ? `${formatted} (Paper)` : formatted;
};
