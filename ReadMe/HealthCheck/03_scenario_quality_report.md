# 🛠 Scenario Execution Quality Report
> Generated: 2026-02-26 06:03:54 UTC

## Scenario Architecture (Designed)

```mermaid
graph LR
    subgraph "momentum_lp"
        momentum_lp_CEX["TrendFollowing<br/>60% CEX"]
        momentum_lp_DEX["liquidity_mining<br/>40% DEX"]
    end
    subgraph "range_mm"
        range_mm_CEX["MeanReversion<br/>30% CEX"]
        range_mm_DEX["market_making<br/>70% DEX"]
    end
    subgraph "cross_arb"
        cross_arb_CEX["Arbitrage_Sell<br/>50% CEX"]
        cross_arb_DEX["arbitrage_buy<br/>50% DEX"]
    end
    subgraph "hedged"
        hedged_CEX["ReducedSizeTrend<br/>50% CEX"]
        hedged_DEX["perp_hedge<br/>50% DEX"]
    end
    subgraph "yield_scalp"
        yield_scalp_CEX["QuickScalp<br/>40% CEX"]
        yield_scalp_DEX["lp_raydium<br/>60% DEX"]
    end
    subgraph "emergency"
    end
    subgraph "funding_arb"
        funding_arb_CEX["Perp_Short<br/>50% CEX"]
        funding_arb_DEX["perp_long_dydx<br/>50% DEX"]
    end
    subgraph "token_snipe"
        token_snipe_DEX["market_buy<br/>100% DEX"]
    end
    subgraph "grid_hedge"
        grid_hedge_CEX["GridTrading<br/>50% CEX"]
        grid_hedge_DEX["concentrated_lp<br/>50% DEX"]
    end
    subgraph "flash_recovery"
        flash_recovery_CEX["DipBuy<br/>60% CEX"]
        flash_recovery_DEX["dip_buy_jupiter<br/>40% DEX"]
    end
    subgraph "stable_yield"
        stable_yield_DEX["deposit_curve<br/>100% DEX"]
    end
    subgraph "breakout_confirm"
        breakout_confirm_CEX["BreakoutMomentum<br/>70% CEX"]
        breakout_confirm_DEX["correlated_buy<br/>30% DEX"]
    end
    subgraph "weekend_mm"
        weekend_mm_CEX["reduced_trading<br/>20% CEX"]
        weekend_mm_DEX["tight_spread_mm<br/>80% DEX"]
    end
    subgraph "multichain_arb"
        multichain_arb_DEX["cross_chain_arb<br/>100% DEX"]
    end
```

## Designed vs Actual Allocations

| Scenario | Designed CEX | Designed DEX | Bot | DEX Status | Integrity |
|----------|-------------|-------------|-----|------------|-----------|
| momentum_lp | 60% | 40% | `nexora_momentum_lp` | 🟢 LIVE | ✅ LIVE |
| range_mm | 30% | 70% | `nexora_range_mm` | 🟢 LIVE | ✅ LIVE |
| cross_arb | 50% | 50% | `nexora_cross_arb` | 🟢 LIVE | ✅ LIVE |
| hedged | 50% | 50% | `nexora_hedged` | 🟢 LIVE | ✅ LIVE |
| yield_scalp | 40% | 60% | `nexora_yield_scalp` | 🔴 DOWN | 🔴 DOWN |
| emergency | 0% | 0% | — | ⚪ N/A | ✅ N/A |
| funding_arb | 50% | 50% | `nexora_funding_arb` | 🟢 LIVE | ✅ LIVE |
| token_snipe | 0% | 100% | `nexora_token_snipe` | 🟢 LIVE | ✅ LIVE |
| grid_hedge | 50% | 50% | `nexora_grid_hedge` | 🔴 DOWN | 🔴 DOWN |
| flash_recovery | 60% | 40% | `nexora_flash_recovery` | 🟢 LIVE | ✅ LIVE |
| stable_yield | 0% | 100% | `nexora_stable_yield` | 🔴 DOWN | 🔴 DOWN |
| breakout_confirm | 70% | 30% | `nexora_breakout` | 🟢 LIVE | ✅ LIVE |
| weekend_mm | 20% | 80% | `nexora_weekend_mm` | 🟢 LIVE | ✅ LIVE |
| multichain_arb | 0% | 100% | `nexora_multichain_arb` | 🔴 DOWN | 🔴 DOWN |

> ✅ **9** of 13 DEX scenarios LIVE. **0** pending Phase 4. 4 down/unreachable.

## Isolation Verification

| Scenario | CEX trade_id | CEX Status | DEX Bot | DEX Status | P&L |
|----------|-------------|------------|---------|------------|-----|
| momentum_lp | None | ❌ Missing | nexora_momentum_lp | 🟢 LIVE | $0.00 |
| range_mm | None | ❌ Missing | nexora_range_mm | 🟢 LIVE | $0.00 |
| cross_arb | None | ❌ Missing | nexora_cross_arb | 🟢 LIVE | $0.00 |
| hedged | None | ❌ Missing | nexora_hedged | 🟢 LIVE | $0.00 |
| yield_scalp | None | ❌ Missing | nexora_yield_scalp | 🔴 DOWN | $0.00 |
| emergency | — | ⚪ N/A | — | ⚪ N/A | $0.00 |
| funding_arb | None | ❌ Missing | nexora_funding_arb | 🟢 LIVE | $0.00 |
| token_snipe | — | ⚪ N/A | nexora_token_snipe | 🟢 LIVE | $0.00 |
| grid_hedge | None | ❌ Missing | nexora_grid_hedge | 🔴 DOWN | $0.00 |
| flash_recovery | None | ❌ Missing | nexora_flash_recovery | 🟢 LIVE | $0.00 |
| stable_yield | — | ⚪ N/A | nexora_stable_yield | 🔴 DOWN | $0.00 |
| breakout_confirm | None | ❌ Missing | nexora_breakout | 🟢 LIVE | $0.00 |
| weekend_mm | None | ❌ Missing | nexora_weekend_mm | 🟢 LIVE | $0.00 |
| multichain_arb | — | ⚪ N/A | nexora_multichain_arb | 🔴 DOWN | $0.00 |

## P&L Accuracy Audit

| Scenario | Stored | FreqTrade | Delta | Match? |
|----------|--------|-----------|-------|--------|
| momentum_lp | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| range_mm | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| cross_arb | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| hedged | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| yield_scalp | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| emergency | $0.00 | N/A | — | ⚪ No CEX allocation |
| funding_arb | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| token_snipe | $0.00 | N/A | — | ⚪ No CEX allocation |
| grid_hedge | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| flash_recovery | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| stable_yield | $0.00 | N/A | — | ⚪ No CEX allocation |
| breakout_confirm | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| weekend_mm | $0.00 | N/A | — | ⚠️ Trade closed/missing |
| multichain_arb | $0.00 | N/A | — | ⚪ No CEX allocation |
