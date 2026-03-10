# Nexora UI - Paper Trading Information Guide

## 📊 Complete Page-to-Data Mapping

This guide shows where to find all paper trading information in the Nexora UI.

---

## 🎯 Core Trading Data Pages

### 1. **Portfolio Information**

#### Total Portfolio View
- **URL**: `http://localhost:3000/nexora/portfolio-global`
- **Sidebar**: Finance & Performance → **Total Portfolio**
- **Icon**: Wallet (Green)
- **Shows**:
  - Combined CEX + DEX portfolio
  - Total balance across all exchanges
  - Asset allocation breakdown
  - Position values and P&L

#### Portfolio (Legacy/Detailed)
- **URL**: `http://localhost:3000/nexora/portfolio`
- **Sidebar**: Not directly linked (use URL)
- **Shows**:
  - Detailed portfolio breakdown
  - Individual exchange balances
  - Asset-by-asset view

---

### 2. **Trade & Order Information**

#### Active Trades
- **URL**: `http://localhost:3000/nexora/trades`
- **Sidebar**: Execution Engine → **Active Trades**
- **Icon**: Briefcase (Blue)
- **Shows**:
  - Currently open positions
  - Entry price, current price, P&L
  - Stop loss and take profit levels
  - Position size and leverage
  - Real-time trade updates

#### Advanced Orders
- **URL**: `http://localhost:3000/nexora/orders`
- **Sidebar**: Execution Engine → **Advanced Orders**
- **Icon**: GanttChartSquare (Indigo)
- **Shows**:
  - Open orders (limit, stop, etc.)
  - Order status (pending, filled, cancelled)
  - Order history
  - Order book depth

#### Trade History
- **URL**: `http://localhost:3000/nexora/history`
- **Sidebar**: Finance & Performance → **Trade History**
- **Icon**: History (Slate)
- **Shows**:
  - Completed trades
  - Historical P&L
  - Trade execution details
  - Win/loss statistics
  - Trade timeline

---

### 3. **Strategy & Bot Management**

#### Fleet Orchestration
- **URL**: `http://localhost:3000/nexora/engines`
- **Sidebar**: Execution Engine → **Fleet Orchestration**
- **Icon**: LayoutGrid (Cyan)
- **Shows**:
  - All running bots/engines
  - Bot status and health
  - Strategy assignments
  - Performance per bot

#### Alpha Engines (Strategies)
- **URL**: `http://localhost:3000/nexora/strategies`
- **Sidebar**: Execution Engine → **Alpha Engines**
- **Icon**: Zap (Yellow)
- **Shows**:
  - Active trading strategies
  - Strategy performance metrics
  - Strategy parameters
  - Signals generated

#### Trading Bots
- **URL**: `http://localhost:3000/nexora/orchestration`
- **Sidebar**: Execution Engine → **Trading Bots**
- **Icon**: Brain (Emerald)
- **Shows**:
  - Individual bot details
  - Bot configuration
  - Bot-specific trades
  - Bot performance

---

### 4. **Analytics & Performance**

#### Analytics Dashboard
- **URL**: `http://localhost:3000/nexora/analytics`
- **Sidebar**: Finance & Performance → **Analytics**
- **Icon**: BarChart3 (Cyan)
- **Shows**:
  - Performance metrics (Sharpe, Sortino, Calmar)
  - Win rate and profit factor
  - Drawdown analysis
  - Return charts
  - Risk-adjusted returns

#### Capital Manager
- **URL**: `http://localhost:3000/nexora/capital`
- **Sidebar**: Finance & Performance → **Capital Manager**
- **Icon**: TrendingUp (Blue)
- **Shows**:
  - Capital allocation
  - Kelly criterion sizing
  - Position sizing recommendations
  - Portfolio heat
  - Risk per trade

---

### 5. **Market Data & Signals**

#### Dashboard (Overview)
- **URL**: `http://localhost:3000/nexora/overview`
- **Sidebar**: Mission Control → **Dashboard**
- **Icon**: LayoutDashboard (Cyan)
- **Shows**:
  - System overview
  - Key metrics summary
  - Recent signals
  - Active positions summary
  - System health

#### Market Overview (Cockpit)
- **URL**: `http://localhost:3000/nexora/cockpit`
- **Sidebar**: Mission Control → **Market Overview**
- **Icon**: Activity (Emerald)
- **Shows**:
  - Market regime detection
  - Current market conditions
  - Volatility indicators
  - Trend signals
  - Market microstructure

#### Global Activity
- **URL**: `http://localhost:3000/nexora/activity`
- **Sidebar**: Mission Control → **Global Activity**
- **Icon**: Activity (Blue)
- **Shows**:
  - Real-time activity feed
  - Trade executions
  - Order updates
  - Signal alerts
  - System events

#### Live Charts
- **URL**: `http://localhost:3000/nexora/charts`
- **Sidebar**: Mission Control → **Live Charts**
- **Icon**: CandlestickChart (Purple)
- **Shows**:
  - Real-time price charts
  - Technical indicators
  - Volume profile
  - Order book visualization
  - Trade markers

---

### 6. **Risk Management**

#### Risk Guardian
- **URL**: `http://localhost:3000/nexora/risk`
- **Sidebar**: Risk & Protection → **Risk Guardian**
- **Icon**: ShieldAlert (Rose)
- **Shows**:
  - Portfolio risk metrics
  - Position limits
  - Correlation risk
  - VaR (Value at Risk)
  - Circuit breaker status

#### Drawdown Control
- **URL**: `http://localhost:3000/nexora/drawdown`
- **Sidebar**: Risk & Protection → **Drawdown Control**
- **Icon**: TrendingDown (Red)
- **Shows**:
  - Current drawdown
  - Maximum drawdown limits
  - Drawdown recovery tracking
  - Historical drawdown chart

---

### 7. **AI & Machine Learning**

#### FreqAI Models
- **URL**: `http://localhost:3000/nexora/ml`
- **Sidebar**: Intelligence Lab → **FreqAI models**
- **Icon**: BrainCircuit (Purple)
- **Shows**:
  - ML model status
  - Model predictions
  - Prediction confidence
  - Model performance metrics
  - Training progress

#### Global Macro
- **URL**: `http://localhost:3000/nexora/macro`
- **Sidebar**: Intelligence Lab → **Global Macro**
- **Icon**: Globe (Sky)
- **Shows**:
  - Macro indicators
  - Correlation analysis
  - Market context
  - Economic signals

---

### 8. **System Monitoring**

#### System Terminal
- **URL**: `http://localhost:3000/nexora/terminal`
- **Sidebar**: Execution Engine → **System Terminal**
- **Icon**: Terminal (Blue)
- **Shows**:
  - Real-time logs from all 11 services
  - System events
  - Trade execution logs
  - Error messages
  - Debug information

#### System Alerts
- **URL**: `http://localhost:3000/nexora/alerts`
- **Sidebar**: Operations → **System Alerts**
- **Icon**: Bell (Amber)
- **Shows**:
  - Active alerts
  - Alert history
  - Alert configuration
  - Notification settings

---

## 🎯 Quick Reference: What to Check for Paper Trading

### Daily Trading Workflow

1. **Start Here**: [Dashboard](http://localhost:3000/nexora/overview)
   - Get overall system status
   - Check key metrics

2. **Check Positions**: [Active Trades](http://localhost:3000/nexora/trades)
   - Monitor open positions
   - Check P&L

3. **Review Portfolio**: [Total Portfolio](http://localhost:3000/nexora/portfolio-global)
   - Verify balances
   - Check allocation

4. **Monitor Performance**: [Analytics](http://localhost:3000/nexora/analytics)
   - Review metrics
   - Track progress

5. **Check Signals**: [Market Overview](http://localhost:3000/nexora/cockpit)
   - See current regime
   - Review signals

6. **Watch Logs**: [System Terminal](http://localhost:3000/nexora/terminal)
   - Monitor execution
   - Check for errors

---

## 📋 Summary Table

| Data Type | Primary Page | URL | Sidebar Location |
|-----------|-------------|-----|------------------|
| **Portfolio** | Total Portfolio | `/nexora/portfolio-global` | Finance & Performance |
| **Open Trades** | Active Trades | `/nexora/trades` | Execution Engine |
| **Orders** | Advanced Orders | `/nexora/orders` | Execution Engine |
| **Trade History** | Trade History | `/nexora/history` | Finance & Performance |
| **Performance** | Analytics | `/nexora/analytics` | Finance & Performance |
| **Signals** | Market Overview | `/nexora/cockpit` | Mission Control |
| **Charts** | Live Charts | `/nexora/charts` | Mission Control |
| **Bots** | Trading Bots | `/nexora/orchestration` | Execution Engine |
| **Risk** | Risk Guardian | `/nexora/risk` | Risk & Protection |
| **Logs** | System Terminal | `/nexora/terminal` | Execution Engine |

---

## 🔗 Base URL

All pages are accessed via: `http://localhost:3000` + page path

Example: `http://localhost:3000/nexora/trades`

---

## 💡 Pro Tips

1. **Multi-Monitor Setup**: Open multiple pages in different tabs/windows
   - Tab 1: Active Trades
   - Tab 2: System Terminal
   - Tab 3: Live Charts
   - Tab 4: Market Overview

2. **Key Pages for Paper Trading**:
   - Most Important: Active Trades, Portfolio, Analytics
   - For Debugging: System Terminal, Alerts
   - For Strategy: Market Overview, FreqAI Models

3. **Real-Time Updates**: Most pages use WebSocket connections for live data
   - Look for "Live Stream Active" indicators
   - Green pulse dots indicate active connections

4. **Mobile Access**: All pages are responsive and work on mobile devices
