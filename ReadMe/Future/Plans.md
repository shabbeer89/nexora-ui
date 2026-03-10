# Multi-Bot Collaboration Strategy

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                     (The Brain)                                 │
│                                                                 │
│  1. Detect Market Regime (RegimeDetector)                       │
│  2. Calculate Capital Allocation (CapitalAllocator)             │
│  3. Route Strategies (CoordinationLayer)                        │
│  4. Execute via Bot APIs                                        │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│   CEX Execution     │              │   DEX Execution     │
│                     │              │                     │
│  • API Port: 8080   │              │  • API Port: 8000   │
│  • FreqAI ML        │              │  • Gateway          │
│  • Hyperopt         │              │  • LP Management    │
│  • 25+ Exchanges    │              │  • AMM Strategies   │
└─────────────────────┘              └─────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│  CENTRALIZED        │              │  DECENTRALIZED      │
│  EXCHANGES          │              │  EXCHANGES          │
│                     │              │                     │
│  Binance, Bybit     │              │  Uniswap, Jupiter   │
│  OKX, KuCoin        │              │  Raydium, dYdX      │
└─────────────────────┘              └─────────────────────┘
```

---

## Why Two Trading Bots?

### Market Segmentation

| Bot | Primary Market | Execution Speed | Unique Capability |
|-----|----------------|-----------------|-------------------|
| **FreqTrade** | CEX (Binance, Bybit, OKX) | 50-200ms | FreqAI ML, Hyperopt optimization, backtesting |
| **Hummingbot** | DEX (Uniswap, Jupiter, Raydium) | 500ms-2s | On-chain execution, liquidity provision, AMM strategies |

### Key Differentiators

#### FreqTrade Strengths
- **FreqAI**: Built-in ML for regime detection and price prediction
- **Hyperopt**: Automated strategy parameter optimization
- **Backtesting**: Fast historical simulation
- **Strategy Framework**: Python-based with extensive indicator libraries (TA-Lib)
- **Exchange Support**: 25+ centralized exchanges out of the box
- **Telegram Alerts**: Native notification integration

#### Hummingbot Strengths
- **Gateway**: Direct DEX smart contract integration
- **Market Making**: Professional bid/ask strategies
- **Liquidity Mining**: Automated LP management
- **Cross-DEX Arbitrage**: On-chain price discrepancy detection
- **AMM Strategies**: Specialized for Uniswap V3, Raydium CLMM
- **On-chain Execution**: Native wallet integration (MetaMask, Phantom)

### When to Use Which Bot

| Situation | Use FreqTrade | Use Hummingbot | Rationale |
|-----------|:-------------:|:--------------:|-----------|
| **BTC/ETH momentum trading** | ✅ | ❌ | CEX has deeper liquidity, faster fills, lower slippage |
| **Scalping with tight stops** | ✅ | ❌ | 50-200ms execution vs 500ms-2s on DEX |
| **Uniswap/Raydium market making** | ❌ | ✅ | Native AMM integration, LP position management |
| **Solana DEX arbitrage** | ❌ | ✅ | On-chain execution with Jupiter/Raydium |
| **Backtesting new strategies** | ✅ | ❌ | FreqTrade has built-in backtester with Hyperopt |
| **ML/AI regime detection** | ✅ | ❌ | FreqAI integration for predictive models |
| **Yield farming / LP automation** | ❌ | ✅ | Hummingbot manages LP positions and compounds |

```
Decision Tree:

                    ┌─────────────────────┐
                    │  What's the venue?  │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
       ┌─────────┐       ┌───────────┐      ┌──────────┐
       │   CEX   │       │   DEX     │      │   BOTH   │
       │(Binance)│       │(Uniswap)  │      │(Arbitrage│
       └────┬────┘       └─────┬─────┘      └────┬─────┘
            │                  │                  │
            ▼                  ▼                  ▼
      ┌───────────┐      ┌───────────┐    ┌────────────┐
      │ FREQTRADE │      │ HUMMINGBOT│    │   NEXORA   │
      │           │      │           │    │ORCHESTRATOR│
      │• Momentum │      │• LP/MM    │    │            │
      │• Scalping │      │• Farming  │    │ Coordinates│
      │• ML/AI    │      │• On-chain │    │ both bots  │
      └───────────┘      └───────────┘    └────────────┘
```

---

## Real-Time Collaboration Scenarios

### Scenario 1: Momentum Trend + Passive LP

**Trigger:** BTC enters strong uptrend (RSI > 65, price above 50 EMA)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Regime: MOMENTUM_BULL (Strength: 0.85)                         │
│  Allocation: 60% CEX / 40% DEX                                  │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ TrendFollowing_BTC  │              │ UniswapV3_LiqMining │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ LONG BTC/USDT       │              │ Add LP ETH/USDC     │
│ @ $42,500           │              │ Range: $2,100-$2,300│
│ Size: $6,000        │              │ Size: $4,000        │
└─────────────────────┘              └─────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     BINANCE         │              │  ETHEREUM MAINNET   │
│                     │              │  (Uniswap V3)       │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. RegimeDetector detects BTC broke above $42,000 with volume spike
   - RSI: 68 (bullish)
   - Price above 50 EMA by 3.2%
   - Regime: MOMENTUM_BULL (strength: 0.85)

2. CapitalAllocator calculates split for $10,000 portfolio
   - CEX allocation: $6,000 (60%)
   - DEX allocation: $4,000 (40%)

3. Orchestrator sends commands:
   - FreqTrade: force_enter("BTC/USDT", side="long", stake=6000)
   - Hummingbot: add_liquidity("ETH/USDC", lower=2100, upper=2300, amount=4000)

4. Execution:
   - FreqTrade: LONG 0.14 BTC @ $42,500 with 5% trailing stop
   - Hummingbot: LP position earning 0.3% APR in fees

5. Exit trigger: RSI drops below 50 OR price crosses below 50 EMA
   - FreqTrade: force_exit("BTC/USDT")
   - Hummingbot: remove_liquidity()

6. Result: BTC rallied to $44,000 (+3.5%)
   - CEX profit: $210 (3.5% of $6,000)
   - DEX fees: $12 (0.3% APR × 1 day)
   - Total: +$222
```

---

### Scenario 2: Range Market Making

**Trigger:** BTC consolidating (ATR < 2%, RSI 40-60)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Regime: RANGE (Strength: 0.72)                                 │
│  Allocation: 30% CEX / 70% DEX                                  │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ MeanReversion_RSI   │              │ PureMarketMaking    │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ Buy RSI < 30        │              │ Bid/Ask Spread 0.1% │
│ Sell RSI > 70       │              │ Order Refresh: 10s  │
│ Size: $3,000        │              │ Size: $7,000        │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. RegimeDetector detects BTC ranging between $41,500-$42,500
   - ATR: 1.8% (low volatility)
   - RSI oscillating: 45-55
   - Regime: RANGE (strength: 0.72)

2. CapitalAllocator shifts to DEX-heavy (ranges favor MM)
   - CEX allocation: $3,000 (30%)
   - DEX allocation: $7,000 (70%)

3. Orchestrator configures:
   - FreqTrade: MeanReversion_RSI strategy
     • Buy when RSI < 30, Sell when RSI > 70
   - Hummingbot: PureMarketMaking on Uniswap
     • Spread: 0.1%, Refresh: 10s

4. Execution over 6 hours:
   - FreqTrade: 3 mean-reversion trades
     • Trade 1: Buy $41,600 → Sell $42,100 (+1.2%)
     • Trade 2: Buy $41,700 → Sell $42,000 (+0.7%)
     • Trade 3: Buy $41,550 → Sell $41,900 (+0.8%)
   - Hummingbot: 142 filled maker orders
     • Avg spread captured: 0.08%

5. Result:
   - CEX profit: $81 (2.7% of $3,000)
   - DEX profit: $79 (142 × $0.56 avg)
   - Total: +$160 in 6 hours
```

---

### Scenario 3: Cross-Venue Arbitrage

**Trigger:** ETH price divergence > 0.5% between Binance and Uniswap

```
    BINANCE: ETH = $2,160                UNISWAP: ETH = $2,150
         │                                      │
         │         PRICE SPREAD: 0.46%          │
         │◄────────────────────────────────────►│
         │                                      │
         ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Action: SELL 1 ETH  │◄────────────►│ Action: BUY 1 ETH   │
│ @ $2,160            │  SIMULTANEOUS │ @ $2,150           │
│                     │              │                     │
│ Profit: +$10        │              │ Cost: -$2,150       │
│ - Fees: ~$3         │              │ - Gas: ~$2          │
└─────────────────────┘              └─────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │   NET PROFIT: ~$5   │
               │   per arb cycle     │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. Hummingbot price feed detects ETH @ $2,150 on Uniswap V3
2. FreqTrade price feed shows ETH @ $2,160 on Binance
3. Orchestrator calculates spread opportunity:
   - Spread: ($2,160 - $2,150) / $2,150 = 0.46%
   - Threshold: 0.40% (profitable after fees)
   - Decision: EXECUTE ARBITRAGE

4. EXECUTE SIMULTANEOUSLY:
   - Hummingbot: BUY 1 ETH on Uniswap @ $2,150
   - FreqTrade: SELL 1 ETH on Binance @ $2,160

5. Fee breakdown:
   - Uniswap swap fee: 0.05% = $1.08
   - Ethereum gas: ~$2.00
   - Binance maker fee: 0.1% = $2.16
   - Total fees: $5.24

6. Profit calculation:
   - Gross: $10.00 (spread)
   - Net: $10.00 - $5.24 = $4.76

7. Daily potential (10 opportunities):
   - 10 × $4.76 = $47.60/day
   - Monthly: ~$1,400
```

---

### Scenario 4: Hedged Position

**Trigger:** High volatility expected (VIX > 25 or major news event)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Regime: HIGH_VOLATILITY                                        │
│  Risk Mode: HEDGED (Delta-Neutral Target)                       │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ ReducedSizeTrend    │              │ PerpHedge_dYdX      │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ LONG 0.5 BTC        │              │ SHORT 0.5 BTC perp  │
│ @ $42,000           │              │ @ $42,050           │
│ Delta: +0.5         │              │ Delta: -0.5         │
└─────────────────────┘              └─────────────────────┘
            │                                    │
            └──────────────┬─────────────────────┘
                           ▼
               ┌─────────────────────┐
               │  NET DELTA: ~0.0    │
               │  Profit from:       │
               │  • Funding rates    │
               │  • Basis spread     │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. MacroContextFilter detects FOMC meeting in 2 hours
   - VIX: 28 (elevated fear)
   - BTC implied volatility: 85%
   - Decision: HEDGE mode activated

2. Current position: LONG 0.5 BTC @ $42,000 (CEX)
   - Unrealized P&L: +$500
   - Exposure: $21,000

3. Orchestrator calculates hedge:
   - Required short: 0.5 BTC to achieve delta-neutral
   - dYdX funding rate: -0.01% (shorts get paid)

4. EXECUTE HEDGE:
   - Hummingbot: SHORT 0.5 BTC perp on dYdX @ $42,050
   - Basis captured: $50 (0.12%)

5. FOMC announces 50bp rate hike (bearish):
   - BTC drops to $40,000 (-4.8%)

6. Result without hedge:
   - Loss: $1,000 (from $42,000 to $40,000)

7. Result WITH hedge:
   - CEX long: -$1,000
   - DEX short: +$1,025 (includes funding)
   - Basis profit: +$50
   - Net P&L: +$75 (protected capital + earned yield)

8. Post-FOMC: Remove hedge when volatility normalizes
```

---

### Scenario 5: Yield Farming + Scalping

**Trigger:** APY > 50% on Raydium pool

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Regime: RANGE (with high DEX yields)                           │
│  Allocation: 40% CEX / 60% DEX                                  │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ QuickScalp_1m       │              │ LP_Raydium_CLMM     │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ Scalp SOL/USDT      │              │ LP in SOL/USDC pool │
│ Timeframe: 1-5 min  │              │ APY: 52%            │
│ Targets: 0.1-0.3%   │              │ Auto-compound: ON   │
│ Size: $4,000        │              │ Size: $6,000        │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. Orchestrator detects high-yield opportunity:
   - Raydium SOL/USDC CLMM pool APY: 52%
   - SOL 24h range: $95-$98 (stable)
   - Decision: YIELD_FARM + SCALP mode

2. Capital allocation for $10,000:
   - CEX scalping: $4,000 (40%)
   - DEX farming: $6,000 (60%)

3. Hummingbot LP setup:
   - Pool: SOL/USDC CLMM
   - Range: $94-$100 (wider for safety)
   - Position: 31 SOL + 3,000 USDC
   - Expected daily yield: $8.55 (52% APY / 365)

4. FreqTrade scalping (24 hours):
   - Trade 1: LONG SOL $95.20 → $95.45 (+0.26%)
   - Trade 2: SHORT SOL $96.80 → $96.40 (+0.41%)
   - Trade 3: LONG SOL $95.50 → $95.90 (+0.42%)
   - ... (17 more trades)
   - Win rate: 14/20 (70%)
   - Avg gain: 0.22%, Avg loss: 0.15%

5. 24-hour result:
   - CEX scalping: +$52 (14 × $8 wins - 6 × $6 losses)
   - DEX yield: +$8.55 (fees + incentives)
   - Total: +$60.55/day

6. Monthly projection:
   - CEX: ~$1,560
   - DEX: ~$256
   - Total: ~$1,816/month (21.8% monthly return)
```

---

### Scenario 6: Emergency Risk-Off

**Trigger:** Daily drawdown > 3% OR kill switch activated

```
                    ⚠️ EMERGENCY TRIGGER ⚠️
                    Drawdown: 3.2% (Limit: 3%)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  🚨 EXECUTING GLOBAL PANIC SELL                                 │
│  Risk Mode: EMERGENCY_SHUTDOWN                                  │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Command:            │              │ Command:            │
│ force_exit_all()    │              │ stop_all_bots()     │
│                     │              │ remove_all_LP()     │
│ Priority: IMMEDIATE │              │ Priority: IMMEDIATE │
│                     │              │                     │
│ Result:             │              │ Result:             │
│ All positions FLAT  │              │ All LP REMOVED      │
└─────────────────────┘              └─────────────────────┘
            │                                    │
            └──────────────┬─────────────────────┘
                           ▼
               ┌─────────────────────┐
               │    100% CASH        │
               │    within minutes   │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. Portfolio status at 14:00 UTC:
   - Starting equity: $50,000
   - Current equity: $48,400
   - Daily drawdown: -3.2% (EXCEEDS 3% LIMIT)

2. RiskManager triggers EMERGENCY_SHUTDOWN:
   - Reason: "Daily drawdown 3.2% exceeds max 3%"
   - Priority: CRITICAL
   - Timestamp: 14:00:05 UTC

3. Orchestrator executes parallel shutdown:

   FreqTrade (14:00:06):
   - force_exit_all() called
   - Position 1: LONG 0.3 BTC @ $41,500 → MARKET SELL
   - Position 2: LONG 2 ETH @ $2,150 → MARKET SELL
   - Position 3: SHORT 50 SOL @ $96 → MARKET COVER
   - All positions closed in 1.2 seconds

   Hummingbot (14:00:06):
   - stop_all_bots() called
   - remove_liquidity() for all LP positions
   - LP 1: ETH/USDC on Uniswap → REMOVED
   - LP 2: SOL/USDC on Raydium → REMOVED
   - Withdrawal to wallet in ~30 seconds

4. Post-shutdown status (14:00:45):
   - CEX balance: $32,100 USDT
   - DEX balance: $16,050 USDC (in wallet)
   - Total: $48,150
   - Status: 100% CASH

5. Alerts sent:
   - Telegram: "🚨 EMERGENCY SHUTDOWN: All positions liquidated"
   - Email: Detailed report with P&L breakdown
   - UI: Kill switch indicator turned RED

6. Outcome:
   - Loss limited to $1,850 (3.7%)
   - Without kill switch, BTC dropped another 5%
   - Potential loss avoided: ~$2,500
   - Net savings: +$650
```

---

### Scenario 7: Funding Rate Arbitrage

**Trigger:** Funding rate divergence > 0.03% between CEX perps and DEX perps

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Funding Rate Monitor:                                          │
│  • Binance BTC Perp: +0.05% (longs pay shorts)                  │
│  • dYdX BTC Perp: +0.01% (longs pay shorts)                     │
│  • Spread: 0.04% (profitable!)                                  │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ SHORT 1 BTC perp    │              │ LONG 1 BTC perp     │
│ on Binance          │              │ on dYdX             │
│                     │              │                     │
│ Collect: +0.05%     │              │ Pay: -0.01%         │
│ every 8 hours       │              │ every 8 hours       │
└─────────────────────┘              └─────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │  NET: +0.04%/8h     │
               │  = +0.12%/day       │
               │  = +3.6%/month      │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. FundingRateMonitor detects divergence:
   - Binance BTC-PERP funding: +0.05% (every 8h)
   - dYdX BTC-PERP funding: +0.01% (every 8h)
   - Spread: 0.04% (exceeds 0.02% threshold)

2. Position sizing for $20,000 capital:
   - Each side: $10,000 notional
   - Leverage: 3x (conservative)

3. EXECUTE FUNDING ARBITRAGE:
   - FreqTrade: SHORT 0.24 BTC perp on Binance @ $42,000
   - Hummingbot: LONG 0.24 BTC perp on dYdX @ $42,020

4. Every 8 hours:
   - Binance short collects: $10,000 × 0.05% = $5.00
   - dYdX long pays: $10,000 × 0.01% = $1.00
   - Net per funding: +$4.00

5. 30-day result:
   - Funding periods: 90 (3 per day × 30)
   - Gross funding income: 90 × $4 = $360
   - Fees/slippage: ~$40
   - Net profit: +$320 (1.6% monthly, delta-neutral)
```

---

### Scenario 8: New Token Launch Sniping

**Trigger:** New token listing detected on CEX, already trading on DEX

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Event: NEW LISTING DETECTED                                    │
│  Token: XYZ launching on Binance in 2 minutes                   │
│  Current DEX price: $0.45                                       │
│  Expected CEX premium: 20-50%                                   │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     HUMMINGBOT      │              │     FREQTRADE       │
│     (FIRST)         │              │     (SECOND)        │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ BUY 1000 XYZ        │              │ SELL 1000 XYZ       │
│ on Uniswap @ $0.45  │              │ on Binance @ $0.60  │
│                     │              │                     │
│ Timing: NOW         │              │ Timing: At listing  │
└─────────────────────┘              └─────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │  Buy DEX: $450      │
               │  Sell CEX: $600     │
               │  Profit: +$150      │
               │  (33% in minutes)   │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. ListingMonitor detects upcoming Binance listing:
   - Token: PEPE2 (new memecoin)
   - Listing time: 15:00 UTC
   - Current DEX price: $0.0012

2. PRE-LISTING (14:55 UTC):
   - Hummingbot: BUY 500,000 PEPE2 on Uniswap
   - Cost: $600 + $15 gas = $615
   - Transfer to Binance wallet (if needed)

3. LISTING MOMENT (15:00 UTC):
   - Binance opens trading
   - Initial price: $0.0019 (+58% premium)
   - FreqTrade: SELL 500,000 PEPE2 @ market

4. Execution:
   - Sell price achieved: $0.0017 (slippage)
   - Revenue: $850
   - Binance fee: $0.85

5. Result:
   - Bought: $615
   - Sold: $849.15
   - Net profit: +$234.15 (38% in 5 minutes)

6. Risk management:
   - Max allocation: 5% of portfolio
   - Stop loss: If CEX price < DEX price, abort
```

---

### Scenario 9: Grid Trading + Impermanent Loss Hedge

**Trigger:** High volatility asset with predictable range

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Asset: ETH ranging $1,800 - $2,200                             │
│  Strategy: Grid profits hedge LP impermanent loss               │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ GridTrading_ETH     │              │ ConcentratedLP      │
│                     │              │                     │
│ Grid: $1,800-$2,200 │              │ Range: $1,850-$2,150│
│ Levels: 20          │              │ Tighter range = more│
│ Per grid: $250      │              │ fees, more IL risk  │
└─────────────────────┘              └─────────────────────┘
            │                                    │
            └──────────────┬─────────────────────┘
                           ▼
               ┌─────────────────────┐
               │  Grid profits cover │
               │  IL from LP         │
               │  = Net positive     │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. Market analysis:
   - ETH 30-day range: $1,820 - $2,180
   - Expected: Continue ranging
   - Strategy: Hedge LP with grid

2. Capital allocation ($10,000):
   - Grid trading (CEX): $5,000
   - Concentrated LP (DEX): $5,000

3. FreqTrade Grid setup:
   - Range: $1,800 - $2,200
   - Grid levels: 20 ($20 apart)
   - Amount per grid: $250
   - Expected fills: 8-12 per day

4. Hummingbot LP setup:
   - Pool: ETH/USDC on Uniswap V3
   - Range: $1,850 - $2,150 (tighter)
   - Fee tier: 0.3%

5. 7-day simulation:
   - ETH moved: $1,900 → $2,100 → $1,950 → $2,050
   
   Grid results:
   - Filled grids: 47
   - Avg profit per grid: $4.20
   - Total: +$197.40

   LP results:
   - Fees earned: +$89.00
   - Impermanent loss: -$156.00
   - Net LP: -$67.00

6. Combined result:
   - Grid: +$197.40
   - LP: -$67.00
   - Total: +$130.40 (2.6% weekly)
   - Grid profits successfully hedged IL!
```

---

### Scenario 10: Flash Crash Recovery

**Trigger:** Sudden 10%+ drop in < 5 minutes (flash crash)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  ⚡ FLASH CRASH DETECTED                                        │
│  BTC: $42,000 → $37,800 (-10%) in 3 minutes                     │
│  Mode: RECOVERY OPPORTUNITY                                     │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ FlashCrashRecovery  │              │ DEX_DipBuyer        │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ BUY BTC @ $37,800   │              │ BUY ETH on Jupiter  │
│ Target: +5% bounce  │              │ (Solana faster)     │
│ Stop: -3%           │              │ Target: +5%         │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. FlashCrashDetector triggers:
   - BTC dropped 10.2% in 3 minutes
   - RSI: 12 (extremely oversold)
   - Volume spike: 500% above average
   - Pattern: Likely liquidation cascade

2. Historical analysis:
   - 87% of flash crashes recover 50%+ within 1 hour
   - Optimal entry: Within 2 minutes of bottom

3. EXECUTE RECOVERY PLAY:
   - FreqTrade: LONG 0.5 BTC @ $37,800 on Binance
   - Hummingbot: LONG 10 SOL @ $85 on Jupiter (faster confirmation)
   - Total deployed: $25,000

4. Position management:
   - Stop loss: -3% ($36,680 for BTC)
   - Take profit 1: +3% (scale out 50%)
   - Take profit 2: +5% (close remaining)

5. Execution timeline:
   - 14:00:00 - Flash crash bottom
   - 14:02:15 - Entries filled
   - 14:18:00 - BTC at $39,100 (+3.4%), TP1 hit
   - 14:45:00 - BTC at $39,700 (+5%), TP2 hit

6. Result:
   - BTC trade: +$950 (5% of $19,000)
   - SOL trade: +$255 (5% of $5,100 - SOL recovered faster)
   - Total: +$1,205 in 45 minutes
```

---

### Scenario 11: Stablecoin Yield Optimization

**Trigger:** Stablecoin APY divergence > 5% between venues

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Stablecoin APY Scanner:                                        │
│  • Binance USDT lending: 8% APY                                 │
│  • Aave USDC supply: 12% APY                                    │
│  • Curve 3pool: 15% APY (with CRV rewards)                      │
│  Decision: Route to highest yield                               │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ Withdraw from       │              │ Deposit to Curve    │
│ Binance Earn        │              │ 3pool via Gateway   │
│ (8% APY)            │              │ (15% APY)           │
│                     │              │                     │
│ Amount: $20,000     │              │ Amount: $20,000     │
└─────────────────────┘              └─────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │  APY gained: +7%    │
               │  Annual extra:      │
               │  $1,400 on $20k     │
               └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. YieldScanner daily check:
   - Current allocation: $50,000 USDT in Binance Earn (8% APY)
   - Detected: Curve 3pool at 15% APY

2. Cost-benefit analysis:
   - APY difference: 7%
   - Bridge cost: ~$50 (ETH gas)
   - Break-even: 50 / (50000 × 0.07 / 365) = 5.2 days

3. EXECUTE YIELD ROTATION:
   - FreqTrade: Withdraw $50,000 USDT from Binance Earn
   - Bridge: USDT to Ethereum (via Stargate)
   - Hummingbot: Deposit to Curve 3pool

4. Timeline:
   - 09:00 - Initiate withdrawal (instant on Binance)
   - 09:05 - Bridge initiated ($50 fee)
   - 09:25 - Funds on Ethereum
   - 09:30 - Deposited to Curve ($30 gas)
   - Total cost: $80

5. 30-day result:
   - Binance (if stayed): $328 (8% APY)
   - Curve (actual): $616 (15% APY)
   - Minus fees: -$80
   - Net gain: +$208 extra in 30 days

6. Auto-rebalance:
   - Weekly scan for better yields
   - Only move if gain > $100 after fees
```

---

### Scenario 12: Breakout Confirmation Trade

**Trigger:** Technical breakout on CEX, confirmed by DEX volume

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Breakout Detection:                                            │
│  • CEX: ETH broke $2,000 resistance with volume                 │
│  • DEX: Jupiter ETH/SOL volume spike +300%                      │
│  • Confirmation: STRONG (both venues agree)                     │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Strategy:           │              │ Strategy:           │
│ BreakoutMomentum    │              │ DEX_BreakoutFollow  │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ LONG ETH with 2x    │              │ LONG SOL (correlated│
│ leverage @ $2,010   │              │ move expected)      │
│ Stop: $1,960        │              │ @ $95               │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. BreakoutDetector analysis:
   - ETH tested $2,000 resistance 4 times in 7 days
   - Current candle: Closed above $2,000 with 2x avg volume
   - DEX check: Jupiter ETH volume +312% in last hour

2. Confirmation score:
   - CEX breakout: ✓
   - DEX volume: ✓✓ (strong)
   - On-chain metrics: Large wallet accumulation
   - Score: 9/10 (high confidence)

3. EXECUTE BREAKOUT TRADE:
   - FreqTrade: LONG 5 ETH @ $2,010 (2x leverage = $20,100 notional)
   - Hummingbot: BUY 50 SOL @ $95 on Jupiter ($4,750)
   - Total exposure: $24,850

4. Risk parameters:
   - ETH stop loss: $1,960 (-2.5%)
   - SOL stop loss: $91 (-4.2%)
   - Max loss: $503 + $200 = $703 (2.8%)

5. Trade execution:
   - 10:00 - Breakout confirmed, entries filled
   - 12:00 - ETH at $2,080 (+3.5%)
   - 14:00 - ETH at $2,150 (+7%), SOL at $102 (+7.4%)
   - 15:00 - Scale out 50%
   - 18:00 - ETH at $2,200 (+9.5%), close remaining

6. Result:
   - ETH: +$950 (9.5% on $10,050 base)
   - SOL: +$330 (7% on $4,750)
   - Total: +$1,280 (5.1% portfolio gain in 8 hours)
```

---

### Scenario 13: Weekend Low-Liquidity Market Making

**Trigger:** Weekend detected, CEX volume drops 50%+

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Time: Saturday 02:00 UTC                                       │
│  CEX Volume: -60% vs weekday average                            │
│  DEX Activity: Relatively stable                                │
│  Strategy: Shift to DEX market making                           │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     FREQTRADE       │              │     HUMMINGBOT      │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ REDUCE positions    │              │ INCREASE MM size    │
│ Wider stops         │              │ Tighter spreads     │
│ Less leverage       │              │ (less competition)  │
│                     │              │                     │
│ Allocation: 20%     │              │ Allocation: 80%     │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. WeekendDetector triggers (Friday 22:00 UTC):
   - Binance BTC volume: -55% vs Thursday
   - Uniswap volume: -20% only
   - Decision: Shift capital to DEX

2. Reallocation for $20,000 portfolio:
   - Weekday split: 60% CEX / 40% DEX
   - Weekend split: 20% CEX / 80% DEX

3. EXECUTE WEEKEND MODE:
   - FreqTrade: Close 50% of positions, widen stops on rest
   - Hummingbot: Increase LP size, add tighter range

4. Weekend activity (48 hours):
   
   FreqTrade (reduced):
   - Only 2 trades taken (vs 8-10 on weekdays)
   - Avoided 3 false breakouts (low volume traps)
   - P&L: +$45

   Hummingbot (increased):
   - LP fees: Higher % due to less competition
   - 89 filled orders (MM strategy)
   - P&L: +$185

5. Sunday 22:00 - Return to normal mode:
   - Shift back to 60/40 allocation
   - Resume normal CEX trading

6. Weekend result:
   - Total: +$230
   - vs staying 60/40: estimated +$120
   - Improvement: +92%
```

---

### Scenario 14: Multi-Chain Arbitrage (Solana + Ethereum)

**Trigger:** Same token, different prices across chains

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXORA ORCHESTRATOR                          │
│                                                                 │
│  Cross-Chain Scanner:                                           │
│  • USDC on Ethereum: $1.002                                     │
│  • USDC on Solana: $0.998                                       │
│  • Spread: 0.4% (profitable after bridge)                       │
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     HUMMINGBOT      │              │     HUMMINGBOT      │
│    (SOLANA BOT)     │              │   (ETHEREUM BOT)    │
│                     │              │                     │
│ Action:             │              │ Action:             │
│ SELL USDC for SOL   │              │ BUY USDC with ETH   │
│ @ $0.998            │              │ @ $1.002            │
│                     │              │                     │
│ Bridge: Wormhole    │◄────────────►│ Receive bridged     │
│ Send to ETH         │              │ funds               │
└─────────────────────┘              └─────────────────────┘
```

**🌍 Real-World Example:**

```
1. CrossChainScanner detects:
   - USDC/SOL on Jupiter: 1 USDC = $0.9982
   - USDC/ETH on Uniswap: 1 USDC = $1.0018
   - Spread: 0.36%

2. Cost analysis for $50,000:
   - Wormhole bridge fee: $2
   - Solana gas: $0.01
   - Ethereum gas: ~$15
   - Total cost: ~$17

3. Profit calculation:
   - Buy 50,000 USDC on Solana: $49,910
   - Sell 50,000 USDC on Ethereum: $50,090
   - Gross: $180
   - Net: $180 - $17 = $163 (0.33%)

4. EXECUTE CROSS-CHAIN ARB:
   Phase 1 (Solana):
   - Swap 499 SOL → 50,000 USDC on Jupiter
   - Initiate Wormhole bridge

   Phase 2 (15 min later, Ethereum):
   - Receive 50,000 USDC
   - Swap to 24.9 ETH on Uniswap

5. Result:
   - Started with: 499 SOL ($49,900)
   - Ended with: 24.9 ETH ($50,063)
   - Net profit: +$163 (0.33% in 20 minutes)

6. Daily potential:
   - 3-5 opportunities per day
   - Avg profit: $150 per cycle
   - Monthly: ~$13,500
```

---

## Production Readiness Assessment

### ✅ What's Ready

| Component | Status | Evidence |
|-----------|--------|----------|
| FreqTrade API Client | ✅ Ready | `force_enter`, `force_exit`, `get_status` working |
| Hummingbot API Client | ✅ Ready | `gateway_swap`, `list_bots`, `start_bot` working |
| Regime Detection | ✅ Ready | `RegimeDetector` with strength calculation |
| Coordination Layer | ✅ Ready | `_route_strategies` maps regimes to strategies |
| Rebalancing Logic | ✅ Ready | `_execute_rebalancing` handles CEX/DEX allocation |
| Strategy Shifting | ✅ Ready | `FleetManager.switch_strategy` for CEX |
| Emergency Shutdown | ✅ Ready | `_emergency_shutdown` with force_exit_all |

### ⚠️ Needs Enhancement

| Gap | Current State | Required Enhancement |
|-----|---------------|---------------------|
| **Scenario UI Control** | Only automated loop | Add `/api/scenarios/{id}/start` and `/api/scenarios/{id}/stop` endpoints |
| **Scenario Registry** | Hardcoded in `_route_strategies` | Create `scenarios.json` config file with definitions |
| **Simultaneous Execution** | Sequential calls | Add `asyncio.gather()` for parallel CEX+DEX execution |
| **Arbitrage Detection** | Not implemented | Add price comparison service between CEX/DEX |
| **Hedging Logic** | Not implemented | Add delta-neutral position calculator |
| **User Scenario Selection** | No UI | Create `/nexora/scenarios` page with toggle controls |

---

## Implementation Roadmap

### Phase 1: Scenario Registry (2 days)
```python
# New file: src/core/scenarios.py
SCENARIOS = {
    "momentum_lp": {
        "name": "Momentum + Passive LP",
        "trigger": {"regime": "MOMENTUM", "strength_min": 0.7},
        "cex_strategy": "TrendFollowing",
        "dex_strategy": "liquidity_mining",
        "allocation": {"cex": 0.6, "dex": 0.4}
    },
    ...
}
```

### Phase 2: API Endpoints (1 day)
```
POST /api/scenarios/{scenario_id}/start
POST /api/scenarios/{scenario_id}/stop
GET  /api/scenarios/active
GET  /api/scenarios/available
```

### Phase 3: UI Dashboard (2 days)

```
┌─────────────────────────────────────────────────────────────────┐
│                    /nexora/scenarios                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Momentum + LP │  │ Range MM      │  │ Arbitrage     │       │
│  │               │  │               │  │               │       │
│  │ Status: ●RUN  │  │ Status: ○OFF  │  │ Status: ○OFF  │       │
│  │ P&L: +$142    │  │ P&L: --       │  │ P&L: --       │       │
│  │               │  │               │  │               │       │
│  │ [STOP]        │  │ [START]       │  │ [START]       │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Hedged        │  │ Yield Farm    │  │ Emergency OFF │       │
│  │               │  │               │  │               │       │
│  │ Status: ○OFF  │  │ Status: ○OFF  │  │ Status: ○ARMED│       │
│  │ P&L: --       │  │ P&L: --       │  │ Trigger: 3%DD │       │
│  │               │  │               │  │               │       │
│  │ [START]       │  │ [START]       │  │ [TRIGGER]     │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Parallel Execution (1 day)
```python
# Upgrade _execute_rebalancing
async def _execute_rebalancing(self, trades):
    await asyncio.gather(
        self._execute_cex(trades),
        self._execute_dex(trades)
    )
```

---

## Summary

| Question | Answer |
|----------|--------|
| Why 2 bots? | Different markets (CEX vs DEX) with complementary capabilities |
| Unique qualities? | FreqTrade=ML/Backtest, Hummingbot=DEX/LP |
| Ready to deploy? | Core ✅, Scenario UI ⚠️ needs 6-day enhancement |
