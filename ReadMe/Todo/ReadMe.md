# Nexora Bot: Adaptive Multi-Strategy Trading System (AMSTS)
## Technical Specification & Architectural Blueprint

Nexora is a professional-grade, hybrid trading system designed to dominate crypto markets through **market regime awareness**, **multi-asset context**, and **automated capital orchestration**. This document serves as the master guide for developers, AI agents, and executives.
The Nexora Bot API is now **CORE IMPLEMENTED** as the unified control plane for the trading system. It connects the Next.js UI to both FreqTrade (CEX) and HummingBot (DEX) backends with authentication and database persistence.

---

### 1. **FreqTrade (FTrade)** - Retail Algo Trading Framework
**Type:** Complete trading framework
**Coverage:** 45%

#### What It Actually Implements:
```
✅ Core Trading Engine
✅ Backtesting (good quality, event-driven)
✅ Strategy framework (Python-based)
✅ Multiple exchange support (via CCXT)
✅ Basic risk management (stop-loss, ROI)
✅ Web UI (FreqUI)
✅ Telegram bot interface
✅ Hyperparameter optimization
✅ FreqAI (ML integration)
✅ Dry-run/paper trading
```

#### Professional System Coverage:
✅ **Satisfied:**
- **Phase 1 (Months 1-3):** Backtesting framework ✅
- **Phase 2 (Months 4-6):** Multi-strategy engine (partial) ✅
- **Phase 3 (Months 7-9):** Some advanced features ✅
- **Phase 4 (Months 10-12):** Backtesting/validation ✅



### 2. **HummingBot (HBot)** - Market Making & Arbitrage Platform
**Type:** Specialized trading framework (market-making focus)
**Coverage:** 50%

#### What It Actually Implements:
```
✅ Multi-strategy framework (market-making, arbitrage, AMM, CLMM)
✅ Gateway middleware for DEX integration
✅ Hummingbot Dashboard (web-based)
✅ Paper trading
✅ Multiple exchange connectors (CEX + DEX)
✅ Advanced order types
✅ Cross-exchange strategies
✅ Strategy performance tracking
✅ Telegram/Discord integration
```

#### Professional System Coverage:
✅ **Satisfied:**
- **Phase 1:** Data infrastructure (multi-exchange) ✅
- **Phase 2:** Multi-strategy coordination ✅
- **Phase 3:** Order execution layer (good) ✅
- **DeFi Integration:** Gateway provides access to Uniswap, Raydium, Jupiter, etc. ✅ (UNIQUE TO HBOT)
- **Multi-timeframe:** Supports multiple symbols/timeframes ✅

```
✅ FreqTrade is better for directional trading - TRUE  
✅ FreqTrade has superior backtesting - TRUE  
✅ FreqAI is a powerful ML framework - TRUE  
✅ FreqTrade has better community/docs - TRUE  
✅ HummingBot is better for market-making - TRUE  
```


### **HYBRID STACK**


## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  NEXORA-UI (Next.js) - INTEGRATED            │
│  URL: http://localhost:3000/nexora                           │
│  ✅ Regime dashboard (RegimeDashboard.tsx)                   │
│  ✅ Unified portfolio (UnifiedPortfolio.tsx)                 │
│  ✅ Strategy performance (StrategyPerformance.tsx)           │
│  ✅ Risk monitoring (RiskMonitoring.tsx)                     │
│  ✅ API client (lib/nexora-api.ts)                           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP API (JWT Auth)
                             │
│         NEXORA-BOT API (FastAPI Layer) - COMPLETE            │
│  URL: http://localhost:8888                                  │
│  ✅ Authentication (JWT + API Key)                           │
│  ✅ Database persistence (SQLite)                            │
│  ✅ Orchestrator Integration (Heartbeat + Execution LIVE)    │
│  ✅ Regime Detection (Efficiency Ratio + FreqAI Integration)  │
│  ✅ Multi-strategy coordination (Platform Routing Engine)    │
│  ✅ Risk management (Portfolio Heat & Sizing Engines)         |
│  ✅ Portfolio aggregation (Aggregated Multi-Exchange View)   │
└───────┬──────────────────────────────────────┬──────────────┘
        │                                      │
        │ REST API                             │ REST API
        │                                      │
┌───────▼──────────────┐              ┌────────▼──────────────┐
│  FREQTRADE API       │              │  HUMMINGBOT API       │
│  (Port 8080)         │              │  (Port 8000)          │
│  - CEX trading       │              │  - DEX trading        │
│  - FreqAI regime     │              │  - DCA strategies     │
│  - Backtesting       │              │  - Market making      │
└──────────────────────┘              └───────────────────────┘
```

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nexora Dashboard                        │
│                   http://localhost:3000                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nexora Bot Control Plane                   │
│                   http://localhost:8888                     │
│            (Orchestrates CEX, DEX, and ML)                  │
└─────────────────────────────────────────────────────────────┘
              │                │                │
    ┌─────────┴────────┬───────┴────────┬───────┴─────────┐
    ▼                  ▼                ▼                  ▼
┌─────────┐      ┌──────────┐    ┌──────────┐      ┌──────────┐
│ Gateway │      │ Hummingbot│    │FreqTrade │      │  Other   │
│  (DEX)  │      │   (CEX)   │    │   (ML)   │      │ Services │
│  :15888 │      │   :8000   │    │  :8080   │      │          │
└─────────┘      └──────────┘    └──────────┘      └──────────┘
```
## FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXORA UI (Port 3000)                      │
│  - Volume Profile Charts (API Ready)                         │
│  - Hedging Display (API Ready)                               │
│  - Kelly Sizing (API Ready)                                  │
│  - Risk Monitoring Dashboard                                 │
│  - Emergency Controls                                        │
│  - Performance Analytics                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API + WebSockets
┌──────────────────▼──────────────────────────────────────────┐
│              NEXORA API (Port 8888)                          │
│  ✅ /api/microstructure/volume-profile                       │
│  ✅ /api/microstructure/orderbook                            │
│  ✅ /api/risk/hedges                                         │
│  ✅ /api/risk/kelly-sizing                                   │
│  ✅ /api/risk/portfolio-heat                                 │
│  ✅ /health, /docs                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│            NEXORA ORCHESTRATOR (Brain)                       │
│  ✅ Regime Detection (7 regimes)                             │
│  ✅ Professional Risk Manager (3-5% daily target)           │
│  ✅ Performance Tracker                                      │
│  ✅ Capital Allocator                                        │
│  ✅ FreqTrade Fleet Manager                                 │
│  ✅ Order Book Analyzer                                      │
└──-----─┬───────┬──────────┬────────┬─────────────────────────────┘
         │       │          │        │
         │       │          │        ├─→ PostgreSQL (Database)
         │       │          │        └─→ Redis (Cache)
         │       │          │
         ▼       ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│FreqTrade │ │FreqTrade │ │Hummingbot│ ⚠️ READ-ONLY CONTROL VIA API
│Scalping  │ │  Trend   │ │DEX Trades│ Nexora orchestrates these
│(Port8080)│ │(Port8081)│ │(Port 8000)│ independently via REST APIs
└──────────┘ └──────────┘ └──────────┘
```


### Access the API
- **API Base URL:** http://localhost:8888
- **Interactive Docs:** http://localhost:8888/docs
- **OpenAPI Schema:** http://localhost:8888/openapi.json

### Test Authentication
```bash
# Login
curl -X POST http://localhost:8888/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response: {"access_token":"eyJ0eXAi...","token_type":"bearer"}
```

### Access the Dashboard
```bash
cd /media/shabbeer-hussain/Store13/Nexora/Bot/Nexora/nexora-ui
npm run dev
# Open: http://localhost:3000/nexora
```

### Environment Configuration
Already configured in `nexora-ui/.env.local`:
```bash
NEXT_PUBLIC_NEXORA_API_URL=http://localhost:8888
NEXT_PUBLIC_WS_URL=ws://localhost:8888/ws
```

## Features Implemented

### ✅ Backend (Core Developed)

| Feature | Status | Details |
|---------|--------|---------|
| **FastAPI Layer** | ✅ BUILT | Core endpoints operational |
| **Authentication** | ✅ BUILT | JWT + API key, role-based access |
| **Database** | ✅ BUILT | SQLite with 4 tables |
| **Orchestrator Integration** | ✅ BUILT | Decision engine & Move execution LIVE |
| **Risk Management** | ✅ BUILT | Heat & Sizing Engines functional |
| **CORS** | ✅ BUILT | Configured for Next.js |
| **Error Handling** | ✅ BUILT | Graceful fallbacks |
| **Documentation** | ✅ BUILT | Swagger UI at /docs |

### ✅ Frontend (Alpha)

| Feature | Status | Details |
|---------|--------|---------|
| **API Client** | ✅ BUILT | TypeScript, full type safety |
| **Regime Dashboard** | ✅ BUILT | Real-time updates |
| **Unified Portfolio** | ✅ BUILT | CEX + DEX aggregation |
| **Strategy Performance** | ✅ BUILT | Performance visualization |
| **Risk Monitoring** | ✅ BUILT | Exposure & heatmap views |
| **Navigation** | ✅ BUILT | Sidebar integration |
| **Authentication** | ✅ BUILT | Login flow |



### Professional System Plan's Alpha Sources:

| Alpha Source | % of Total Profit | Which Bot Provides This? |
|--------------|-------------------|--------------------------|
| **Regime Detection** | 20-25% | ✅ FreqTrade (FreqAI) |
| **Directional CEX Trading** | 40-50% | ✅ FreqTrade (core strength) |
| **DeFi On-Chain Alpha** | 20-30% | ✅ HummingBot ONLY |
| **Risk Management** | 5-10% (loss prevention) | 🟡 Custom (FreqTrade base) |
| **Order Book Analysis** | 3-5% | 🟡 Custom (both limited) |


### If You Use HYBRID (FreqTrade + HummingBot):

- ✅ Get 65-75% alpha from CEX (FreqTrade)
- ✅ Get 20-30% alpha from DeFi (HummingBot)
- ✅ Use FreqTrade for backtesting ALL strategies
- ✅ Use FreqAI for regime detection
- ✅ Deploy CEX strategies on FreqTrade
- ✅ Deploy DEX strategies on HummingBot
- ⚠️ Need coordination layer (100-150 hours custom work)


---

## WHAT EACH BOT DOES IN THE HYBRID STACK

### FreqTrade Responsibilities (Core Intelligence):

- Built specifically for directional trading (trend following, breakouts, mean reversion)
- Superior backtesting engine with realistic slippage modeling
- Built-in ML framework (FreqAI) for regime detection
- Hyperopt for parameter optimization
- Better suited for the multi-strategy adaptive system we need


1. **Historical Backtesting** - Validate ALL strategies (CEX + DEX)
   - Test DEX strategies on historical data via simulation
   - FreqTrade's engine can backtest ANY strategy logic
   
2. **FreqAI Regime Detection** - Brain of the entire system
   - Train models on both CEX and DEX data
   - Outputs regime → drives strategy selection on both platforms
   
3. **Hyperparameter Optimization** - Tune ALL strategies
   - Hyperopt works for any strategy logic
   - Find optimal parameters for both CEX and DEX strategies
   
4. **CEX Trade Execution** - Direct trading on Binance, etc.
   - 70% of total trades
   - Directional strategies (trend, mean rev, breakout)

### HummingBot Responsibilities (DeFi Execution):

- Market making strategies
- High-frequency trading
- DEX/DeFi integration
- Cross-exchange arbitrage

1. **DEX Trade Execution** - Via Gateway middleware
   - Uniswap V3 (Ethereum)
   - Raydium/Meteora/Orca (Solana)
   - Jupiter aggregator (Solana)
   
2. **DeFi Alpha Strategies** - 30% of total trades
   - Liquidity provision (Uniswap V3 concentrated liquidity)
   - DEX market making (Raydium AMM)
   - Cross-DEX arbitrage (Jupiter)
   - Yield farming optimizations
   
3. **On-Chain Data** - Feed regime detector
   - On-chain volume, liquidity depth
   - Gas prices, MEV activity
   - Whale wallet movements

### Custom Coordination Layer (You Build):

1. **Unified Regime Detection** - FreqAI models + custom logic
2. **Portfolio Risk Manager** - Allocate capital across CEX/DEX
3. **Strategy Router** - Deploy right strategy to right platform
4. **Position Monitor** - Aggregate view across both platforms
5. **Rebalancing Engine** - Move capital between CEX/DEX as needed

```
Choose HYBRID (CORRECT) if:
✅ You want 100% of alpha (CEX 70% + DeFi 30%)
✅ You accept 150 hours of coordination coding
✅ You want FreqTrade's backtesting + HBot's DeFi
✅ You want the edge the professional plan describes
✅ You actually want to be professional
```


### 1. CORE FOCUS & PHILOSOPHY

| Aspect | FreqTrade | Hummingbot | Winner for Option B |
|--------|-----------|------------|-------------------|
| **Primary Use Case** | Directional trading (trend, mean reversion) | Market making & HFT | ✅ FreqTrade |
| **Strategy Type** | Entry/exit signals, stop loss, take profit | Bid/ask spread capture, liquidity provision | ✅ FreqTrade |
| **Speed Requirements** | Medium (1-5 second order latency OK) | High (millisecond latency critical) | ✅ FreqTrade (we don't need HFT) |
| **Profitability Model** | Capture price movements | Capture bid-ask spread | ✅ FreqTrade |

**Analysis:**
Option B needs to identify market regimes and execute directional strategies (trend following, breakouts, mean reversion). FreqTrade was built for exactly this. Hummingbot's market making focus is a mismatch.

---

### 2. BACKTESTING CAPABILITIES (CRITICAL FOR OPTION B)

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Backtesting Engine** | Robust, event-driven | Basic (paper trading focused) | ✅✅✅ FreqTrade |
| **Realistic Slippage** | Yes (configurable models) | Limited | ✅✅ FreqTrade |
| **Order Book Simulation** | Yes | Limited | ✅ FreqTrade |
| **Walk-Forward Analysis** | Yes | No | ✅✅ FreqTrade |
| **Hyperparameter Optimization** | Yes (Hyperopt built-in) | No | ✅✅✅ FreqTrade |
| **Multi-Timeframe Testing** | Yes | Limited | ✅ FreqTrade |
| **Strategy Comparison** | Yes (side-by-side) | Limited | ✅ FreqTrade |

---

**Hummingbot Backtesting:**
- Primarily paper trading focused
- Limited historical replay
- No hyperparameter optimization
- Not designed for strategy validation

**Verdict:** FreqTrade's backtesting is **production-grade**. This alone makes it superior for Option B, where we need to validate strategies across 2+ years of data before risking capital.

---

### 3. MACHINE LEARNING INTEGRATION

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Built-in ML Framework** | Yes (FreqAI) | No | ✅✅✅ FreqTrade |
| **Regime Detection** | Yes (via FreqAI) | No | ✅✅ FreqTrade |
| **Feature Engineering** | Extensive (10k+ features) | Manual | ✅✅ FreqTrade |
| **Model Types Supported** | LightGBM, XGBoost, CatBoost, PyTorch, TensorFlow | None built-in | ✅✅ FreqTrade |
| **Adaptive Retraining** | Yes (on separate thread) | No | ✅✅ FreqTrade |
| **Outlier Detection** | Yes (built-in) | No | ✅ FreqTrade |

**FreqAI Capabilities (Critical for Option B):**

FreqAI is FreqTrade's built-in ML framework that:
- Creates feature sets from indicators you define
- Trains models to predict targets (price direction, volatility, etc.)
- Retrains automatically as new data arrives
- Supports multiple ML libraries
- Handles data normalization, outlier removal
- Backtests with realistic adaptive training

---

### 4. STRATEGY DEVELOPMENT & CUSTOMIZATION

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Strategy Language** | Python | Python | Tie |
| **Strategy Templates** | Many (trend, mean rev, breakout) | Mostly market making | ✅ FreqTrade |
| **Custom Indicators** | Easy (TA-Lib, pandas-ta) | Easy | Tie |
| **Multi-Timeframe Support** | Excellent | Good | ✅ FreqTrade |
| **Entry/Exit Logic** | Sophisticated | Basic | ✅ FreqTrade |
| **Position Management** | Advanced | Basic | ✅✅ FreqTrade |
| **Portfolio Management** | Yes | Limited | ✅ FreqTrade |
```

### 5. RISK MANAGEMENT

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Stop Loss Types** | Fixed, trailing, custom | Basic | ✅ FreqTrade |
| **Take Profit** | ROI table, custom exit | Basic | ✅ FreqTrade |
| **Position Sizing** | Fixed, dynamic, custom | Fixed | ✅✅ FreqTrade |
| **Max Open Trades** | Configurable | Configurable | Tie |
| **Portfolio Risk Limits** | Yes | Limited | ✅ FreqTrade |
| **Drawdown Protection** | Yes | Limited | ✅ FreqTrade |


```

**Verdict:** FreqTrade's risk management is **comprehensive and production-ready**.

---

### 6. EXCHANGE SUPPORT

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **CEX Support** | 70+ via CCXT | 50+ | ✅ FreqTrade |
| **DEX Support** | Limited | Excellent | ✅ Hummingbot |
| **Futures/Margin** | Yes | Yes | Tie |
| **API Quality** | Mature | Mature | Tie |

**Analysis:** Both are excellent for CEX. Hummingbot wins on DEX but Option B focuses on CEX trading.

---

### 7. DATA & INDICATORS

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Technical Indicators** | 200+ (TA-Lib, pandas-ta) | Manual implementation | ✅✅ FreqTrade |
| **Custom Indicators** | Easy | Medium | ✅ FreqTrade |
| **Data Storage** | SQLite/PostgreSQL | PostgreSQL | Tie |
| **Historical Data** | Easy download | Manual | ✅ FreqTrade |
| **Real-time Candles** | Yes | Yes | Tie |

**FreqTrade Data Download:**
```bash
# Download 2 years of data in seconds
freqtrade download-data \
  --exchange binance \
  --pairs BTC/USDT ETH/USDT \
  --timerange 20230101-20251231 \
  --timeframes 5m 15m 1h 4h 1d
```

**Verdict:** FreqTrade makes data management **trivial**.

---

### 8. PERFORMANCE & SCALABILITY

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Execution Latency** | 1-5 seconds | <100ms | Hummingbot (but irrelevant for Option B) |
| **Resource Usage** | Medium | Medium | Tie |
| **Multi-Pair Scaling** | Excellent | Good | ✅ FreqTrade |
| **Parallel Processing** | Yes | Yes | Tie |

**Analysis:** Hummingbot is faster, but Option B doesn't need millisecond latency. We're making directional decisions over minutes/hours, not microseconds.

---

### 9. DEPLOYMENT & OPERATIONS

| Feature | FreqTrade | Hummingbot | Winner |
|---------|-----------|------------|--------|
| **Docker Support** | Excellent | Excellent | Tie |
| **Telegram Bot** | Yes (comprehensive) | Limited | ✅✅ FreqTrade |
| **Web UI** | Yes (FreqUI) | Yes | Tie |
| **API** | REST + WebSocket | REST | ✅ FreqTrade |
| **Multi-Bot Management** | Yes | Yes | Tie |
| **Cloud Deployment** | Easy | Easy | Tie |

**FreqTrade Telegram Bot:**
- /status - Current positions
- /profit - P&L summary
- /performance - Win rate per pair
- /balance - Account balance
- /start, /stop - Control trading
- /forcebuy, /forcesell - Manual override
- /reload_config - Update without restart

**Verdict:** FreqTrade's Telegram integration is **excellent for monitoring**.

---

## 1. System Philosophy: The "Live Brain"
Nexora treats the market as a shifting environment. Instead of running a single static strategy, it employs an **Orchestrator** that dynamically detects market regimes (Trend, Range, Volatility) and switches between specialized sub-systems.

### The AMSTS Pillars
*   **Adaptive**: Real-time regime detection via ML (FreqAI) and technical signals.
*   **Multi-Strategy**: Simultaneous execution of Trend-Following, Mean Reversion, and Market Making.
*   **Systemic**: A unified lifecycle including research, validation, execution, and risk management.

---

## 2. Hybrid Architecture (CEX & DEX)
Nexora operates on a **Three-Node Hybrid Architecture**, keeping execution engines independent while centralizing intelligence.

### A. Execution Engines
| Feature | FreqTrade (CEX Core) | Hummingbot (DEX Core) |
| :--- | :--- | :--- |
| **Primary Use** | Directional & ML Trading | HFT, DEX & LP Management |
| **Key Advantage** | Robust Backtesting (FreqAI) | Low Latency (Gateway) |
| **Asset Focus** | BTC, ETH, Altcoins (Binance) | SOL, Uniswap, Raydium, Meteora |
| **Tech Stack** | Python / TA-Lib | Python / C++ / Node.js (Gateway) |

### B. The Orchestrator (Nexora-Bot)
The Orchestrator resides in `src/core/orchestrator.py` and acts as the "Pre-Frontal Cortex." It manages the heartbeat loop and communicates with engines via REST APIs.

---

### The Architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOM ORCHESTRATOR                           │
│                   (New Repository: "nexora-bot")               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  - Regime Detection (FreqAI models + custom logic)         │ │
│  │  - Capital Allocation (risk-based portfolio manager)       │ │
│  │  - Strategy Router (which platform gets which strategy)    │ │
│  │  - Position Monitor (unified view across CEX + DEX)        │ │
│  │  - Rebalancing Engine (move capital between platforms)     │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────┬───────────────────────┬──────────────────────────┘
                │                       │
                │ REST API              │ REST API
                │ (Control)             │ (Control)
                │                       │
    ┌───────────▼──────────┐   ┌────────▼─────────────────┐
    │    FREQTRADE         │   │      HUMMINGBOT          │
    │  (Standalone Repo)   │   │    (Standalone Repo)     │
    │                      │   │                          │
    │  - FreqUI enabled    │   │  - Dashboard enabled     │
    │  - API server ✅     │   │  - API server ✅         │
    │  - Runs in Docker    │   │  - Runs in Docker        │
    │  - Port 8080         │   │  - Port 8888             │
    └──────────┬───────────┘   └──────────┬───────────────┘
               │                          │
               │                          │
    ┌──────────▼───────────┐   ┌──────────▼───────────────┐
    │    BINANCE CEX       │   │   UNISWAP/RAYDIUM DEX    │
    │  - Spot trading      │   │  - Via Gateway           │
    │  - Futures           │   │  - On-chain execution    │
    └──────────────────────┘   └──────────────────────────┘
```

## 3. Repository & Data Structure
The project is organized to be modular and scalable:

```text
nexora-bot/
├── ReadMe/                      # Documentation
├── main.py                      # System Entry Point
├── .env                         # API Keys & Unified Config
├── requirements.txt             # Python Dependencies
├── src/
│   ├── core/                    # Intelligence Layer
│   │   ├── orchestrator.py      # Heartbeat Loop
│   │   ├── regime_detector.py   # Regime Classification
│   │   ├── capital_allocator.py # Allocation Math
│   │   └── coordination.py      # Platform Routing
│   ├── connectors/              # Platform Clients
│   │   ├── freqtrade_client.py  # FBot API Bridge
│   │   └── hummingbot_client.py # HBot API Bridge
│   └── utils/                   # Infrastructure
│       ├── database.py          # PostgreSQL Interface
│       └── logger.py            # Structured Logging
└── scripts/                     # Operational Tools
    ├── test_phase2.py           # Phase 2 Validation
    ├── test_phase3.py           # Phase 3 Validation
    └── test_phase4.py           # Phase 4 Validation
```

### ✅ CRITICAL (3 repos) - 100% Required

```
/media/shabbeer-hussain/Store13/Nexora/Bot/Nexora/
├── nexora-bot/              ← ORCHESTRATOR (The Brain)
├── nexora-ui/               ← FRONTEND (Dashboard & Control)
├── hbot/                    ← DEX ENGINE
│   ├── hummingbot/          
│   ├── gateway/             
│   └── hummingbot-api/      
└── freqtrade/               ← CEX ENGINE
```

---

## 4. Adaptive Intelligence Logic

### 4.1 Regime Detection Framework
The `RegimeDetector` classifies the market using the following technical math:

*   **TREND_UP**: (EMA_Fast > EMA_Slow) AND (ADX > 25)
*   **RANGE**: (ADX < 20) AND (Bollinger Band Width is Narrow)
*   **BREAKOUT**: (Volume > 1.5x Avg) AND (Price > 20-period High)
*   **HIGH_VOL**: (ATR > 2.0x ATR_MA)
*   **RISK_OFF**: (Correlation with SPX > 0.8) AND (SPX in Downtrend)

### 4.2 Microstructure Signals
Integrated via Hummingbot's L2 data:
*   **Order Book Imbalance (OBI)**: Calculated as `(Bid_Vol - Ask_Vol) / Total_Vol`.
*   **Liquidity Depth**: Tracks total volume within 1% of the mid-price to detect slippage risk.
*   **Absorption**: Detected when high volume occurs with minimal price variance over 5 snapshots.


## 4. Coordination & Strategy Execution

### 4.1 The Coordination Layer (`src/core/coordination.py`)
This is the "Nervous System" that translates market regimes into platform-specific instructions:
*   **Trending**: Shifts capital to FreqTrade for aggressive trend-following.
*   **Ranging**: Shifts capital to Hummingbot for liquidity provision and market making.
*   **High Volatility**: Triggers "Preservation Mode" (Reduced exposure/tight stops).

### 4.2 FreqTrade Logic (RegimeAdaptiveStrategy.py)
The FreqTrade arm utilizes **FreqAI** for predictive analysis:
*   **Predictive Labels**: Predicts regime direction and future volatility.
*   **Dynamic Stops**: Adjusts stop-loss percentages based on the active regime (tight in ranges, wide in trends).
*   **Time-Exits**: Automatically sheds "stagnant" trades that fail to move profitably within 2-4 hours.

---

## 5. Risk Management & The "Nuke" Protocol
Nexora prioritizes capital preservation above all else.

### 5.1 Tiered Protections
1.  **Warning (Drawdown > max * 0.5)**: Scaled reduction of position sizing (50%).
2.  **Circuit Breaker (Volatility Spike > 3x)**: Automatic pause of new entries.
3.  **Hard Stop (Drawdown >= max)**: Immediate closure of all positions and bot logout.

### 5.2 Disaster Recovery
*   **Watchdog Service**: Runs as a separate process to monitor the Orchestrator. If no heartbeat is detected in the PostgreSQL database for 300 seconds, it sends a **Critical Failure** alert.
*   **Emergency Liquidation**: A stateless `emergency_liquidate.py` script that ignores all strategy logic and executes market-sell orders across both platforms via a single command.

---

## 6. Infrastructure & Persistence (PostgreSQL)
Nexora maintains a "Long-term Memory" for performance auditing.

### Database Tables:
*   **regime_history**: Logs every detected regime, its strength, and source.
*   **capital_allocation**: Records target vs. actual balances on CEX/DEX.
*   **performance_audit**: Captures heartbeat latency, memory usage, and risk events.
*   **trade_logs**: Unified trade history normalized across FreqTrade and Hummingbot.

---

## 7. Operational Workflow (The Heartbeat)
The Orchestrator cycle runs every 60-300 seconds (configurable):

1.  **Macro Ingestion**: Pull Fear & Greed, SPX, DXY via `MacroConnector`.
2.  **Context Filtering**: If Macro Filter = `False`, system enters "Preservation Mode."
3.  **Regime Scan**: Calculate latest regime; if changed, notify Telegram.
4.  **Portfolio Refresh**: Unified balance fetch from CEX/DEX.
5.  **Risk Audit**: Run all circuit breakers in `RiskManager`.
6.  **Rebalancing Strategy**:
    *   Compare `current_allocation` to `target_regime_allocation`.
    *   If `drift > threshold`, calculate required capital movements.
7.  **Execution Routing**:
    *   Shift FreqTrade strategies via REST API.
    *   Stop/Start Hummingbot instances.
8.  **Persistence**: Commit all data to PostgreSQL `nexora` database.

---

## 8. Development Onboarding
To run the system in dev/test mode:
1.  **Dependencies**: `pip install requests pandas numpy psycopg2 yfinance`.
2.  **PostgreSQL**: Ensure `nexora` DB is running with the schema from `src/utils/database.py`.
3.  **Dry Run**: Ensure `config.json` has `"dry_run": true` to log decisions without executing trades.
4.  **Audit**: Run `scripts/test_phase4.py` to simulate a week of orchestration in 10 minutes.


Username	Password	Role	Permissions
admin	admin123	Admin	Full access
trader	trader123	Trader	Read + Write
viewer	viewer123	Viewer	Read only
---

**Last Updated**: 2026-01-15
