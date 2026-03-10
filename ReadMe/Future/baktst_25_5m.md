# 2025 Strategy Backtest Results (Full Year)

**Date**: Feb 2, 2026  
**Timeframe**: 5m candles  
**Config**: `backtest_clean_config.json` (BTC/USDT only)  
**Strategies Tested**: 45 (1 error: Week2ValidatedV1)

---

## 🏆 Only 2 Profitable Strategies

| Rank | Strategy | Profit % | Trades | Win Rate |
|------|----------|----------|--------|----------|
| 1 | **VolatilityExpansion** | +2.49% | 4 | 50% |
| 2 | **SimpleRSIMeanReversion** | +0.44% | 1 | 100% |

---

## ⚪ Zero Trade Strategies (No Signals)

- SimpleTrendFollowingMTF
- SimpleStrategy  
- RegimeAdaptiveStrategy
- PairsTradingBTCETH_Fixed
- OptimizedRSIV1
- MTFMeanReversionStrategy
- CryptoMomentumV1
- BreakoutStrategy

---

## 📊 Moderate Loss Strategies

| Strategy | Profit % | Trades | Win Rate | Max DD |
|----------|----------|--------|----------|--------|
| MTFTrendStrategy | -0.62% | 2 | 0% | $6.22 |
| MachineOptimizedV1 | -1.05% | 5 | 40% | $24.26 |
| RegimeAdaptiveV2 | -5.21% | 31 | 38.7% | $68.62 |
| SimpleTrendFollowingMTF_Aggressive | -11.01% | 34 | 52.9% | $132.55 |
| Strategy004 | -11.36% | 87 | 95.4% | $254.04 |

---

## 📉 Heavy Loss Strategies (Bottom 10)

| Strategy | Profit % | Trades | Win Rate | Max DD |
|----------|----------|--------|----------|--------|
| MeanReversionV1 | -99.44% | 2733 | 30% | $1009.98 |
| VolatilityExpansion_Fixed | -99.44% | 2628 | 22.6% | $994.44 |
| WeeklyMomentum | -99.44% | 2604 | 14.2% | $994.42 |
| WeeklyMomentum_Fixed | -99.44% | 2659 | 10.1% | $994.43 |
| DonchianBreakout | -97.50% | 1723 | 20.1% | $975.05 |
| DonchianBreakout_Fixed | -97.50% | 1723 | 20.1% | $975.05 |
| PairsTradingV1 | -94.43% | 1448 | 16.7% | $944.33 |
| ScalpingStrategy | -93.35% | 1024 | 8.7% | $933.49 |
| TrendFollowingStrategy | -86.06% | 936 | 13.9% | $860.65 |
| SimpleGrid | -84.12% | 870 | 41% | $852.45 |

---

## Key Insights for 2025

1. **Only 2 strategies profitable** - VolatilityExpansion (+2.49%) and SimpleRSIMeanReversion (+0.44%)
2. **Strategy001-005 series all lost money** in 2025 (unlike 6-year where they excelled)
3. **High-frequency strategies devastated** - ScalpingStrategy, PairsTradingV1, DonchianBreakout all lost >90%
4. **Mean reversion failed completely** - All mean reversion variants lost 99%+ 
5. **2025 was a challenging year** - Even SimpleTrendFollowing (-53%) struggled

---

## Comparison: 6-Year vs 2025

| Strategy | 6-Year Profit | 2025 Profit | Verdict |
|----------|--------------|-------------|---------|
| Strategy001 | +152.36% | -42.50% | 6yr only |
| VolatilityExpansion | -4.84% | +2.49% | 2025 only |
| SimpleTrendFollowing | +8.02% | -53.21% | Inconsistent |

**Conclusion**: No single strategy works across all market conditions. VolatilityExpansion is the only strategy profitable in 2025.
