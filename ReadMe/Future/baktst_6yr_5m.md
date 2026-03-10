# 6-Year Strategy Audit Results (2020-2025)

**Date**: Feb 2, 2026  
**Timeframe**: 5m candles  
**Strategies Tested**: 44 (AIKNN/FreqAI excluded)  
**Failed Strategies**: 2 (PairsTradingV1, Week2ValidatedV1 - code errors)

---

## 🏆 Top 5 Profitable Strategies

| Rank | Strategy | Profit % | Trades | Win/Loss | Max DD | Sharpe |
|------|----------|----------|--------|----------|--------|--------|
| 1 | **Strategy001** | +152.36% | 10 | 9/1 | $43.81 | 0.04 |
| 2 | **Strategy005** | +33.76% | 3 | 3/0 | $0.00 | 0.02 |
| 3 | **Strategy003** | +24.05% | 192 | 191/1 | $33.79 | 0.70 |
| 4 | **Strategy004** | +20.04% | 216 | 215/1 | $24.68 | 0.77 |
| 5 | **Strategy002** | +17.50% | 194 | 193/1 | $49.07 | 0.38 |

---

## 📈 Moderately Profitable

| Strategy | Profit % | Trades | Win Rate |
|----------|----------|--------|----------|
| SimpleTrendFollowing | +8.02% | 2619 | 30.7% |
| SimpleTrendFollowingFiltered | +8.02% | 2619 | 30.7% |
| SimpleTrendFollowingMTF_Aggressive | +2.84% | 243 | 50.2% |
| MachineOptimizedV1 | +1.44% | 236 | 57.2% |
| SimpleRSIMeanReversion | +0.37% | 4 | 100% |

---

## ⚠️ Zero Trades (No Signals Generated)

- SimpleTrendFollowingMTF
- SimpleStrategy
- RegimeAdaptiveStrategy
- PairsTradingBTCETH_Fixed
- OptimizedRSIV1
- MTFMeanReversionStrategy
- CryptoMomentumV1
- BreakoutStrategy

---

## 📉 Worst Performers (Major Losses)

| Strategy | Profit % | Trades | Win Rate | Max DD |
|----------|----------|--------|----------|--------|
| MeanReversionV1 | -90.07% | 5912 | 50.4% | $900.73 |
| VolatilityExpansion_Fixed | -90.05% | 4327 | 28.3% | $900.50 |
| DonchianBreakout | -89.96% | 4615 | 28.3% | $905.90 |
| RangeStrategy | -89.96% | 6034 | 52.4% | $899.57 |
| SimpleRSIV1_Optimized | -89.96% | 2771 | 58.9% | $908.64 |
| MeanReversionStrategy | -89.94% | 3416 | 8.5% | $899.38 |
| ScalpingStrategy | -89.90% | 2511 | 12.3% | $899.04 |
| SimpleGrid | -89.90% | 6044 | 51.6% | $898.99 |

---

## Key Insights

1. **Only 5 strategies are profitable** over the 6-year period
2. **Strategy001-005 series** show exceptional performance with very few trades and near-perfect win rates
3. **Mean reversion strategies consistently fail** with drawdowns near -90%
4. **Grid strategies suffer heavy losses** in trending markets
5. **SimpleTrendFollowing variants** are the only "classic" strategies with positive returns
6. **High-frequency strategies** (Scalping, RSI Extreme) had significant losses

---

## Recommendations

1. **Deploy Strategy001-005** - Investigate why they work and if 10-200 trades over 6 years is acceptable
2. **SimpleTrendFollowing** - Viable for live trading with 8% return over 6 years
3. **Avoid all Mean Reversion** strategies in current market conditions
4. **Fix or remove** the 2 broken strategies (PairsTradingV1, Week2ValidatedV1)
