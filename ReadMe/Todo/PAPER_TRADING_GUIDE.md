# PAPER TRADING QUICK START GUIDE
**Date:** 2026-01-22 12:45 PM IST  
**Status:** Ready to Start Paper Trading

---

## 🎯 PAPER TRADING SETUP

### Current Status
- ✅ All Phase 1-4 implementations complete
- ✅ Emergency controls functional
- ✅ Hedging engine ready
- ✅ Paper trading scripts created
- ⏳ FreqTrade needs installation

---

## OPTION 1: START NEXORA API ONLY (Recommended for Testing)

### Step 1: Start Nexora API
```bash
cd /home/drek/AkhaSoft/Nexora/nexora-bot

# Set environment variables
export PAPER_TRADING=true
export FREQTRADE_API_URL="http://localhost:8080"
export FREQTRADE_API_USERNAME="freqtrader"
export FREQTRADE_API_PASSWORD="SuperSecurePassword"

# Start API
python3 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8888 --reload
```

### Step 2: Start Nexora UI (New Terminal)
```bash
cd /home/drek/AkhaSoft/Nexora/nexora-ui
npm run dev
```

### Step 3: Access UI
Open browser: http://localhost:3000

### Step 4: Test All New Features
1. ✅ Click "Emergency Pause" button
2. ✅ Click "Emergency Resume" button
3. ✅ Test "Emergency Shutdown" button
4. ✅ View Advanced Orders UI
5. ✅ View Hyperopt Dashboard
6. ✅ Test Alert Configuration
7. ✅ View Hedging Dashboard

---

## OPTION 2: FULL PAPER TRADING WITH FREQTRADE

### Step 1: Install FreqTrade
```bash
cd /home/drek/AkhaSoft/Nexora/freqtrade

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install FreqTrade
pip install -e .

# Or install from PyPI
pip install freqtrade
```

### Step 2: Verify Installation
```bash
freqtrade --version
```

### Step 3: Start Paper Trading
```bash
cd /home/drek/AkhaSoft/Nexora
./start_paper_trading.sh
```

### Step 4: Monitor Performance
```bash
# In new terminal
python3 monitor_paper_trading.py
```

---

## MANUAL START (If Scripts Fail)

### Terminal 1: FreqTrade
```bash
cd /home/drek/AkhaSoft/Nexora/freqtrade
source .venv/bin/activate  # If using venv

freqtrade trade \
    --config user_data/config.json \
    --strategy RegimeAdaptiveStrategy
```

### Terminal 2: Nexora API
```bash
cd /home/drek/AkhaSoft/Nexora/nexora-bot

export PAPER_TRADING=true
export FREQTRADE_API_URL="http://localhost:8080"

python3 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8888 --reload
```

### Terminal 3: Nexora UI
```bash
cd /home/drek/AkhaSoft/Nexora/nexora-ui
npm run dev
```

### Terminal 4: Monitor
```bash
cd /home/drek/AkhaSoft/Nexora
python3 monitor_paper_trading.py
```

---

## TESTING CHECKLIST

### Phase 1: Emergency Controls ✅
- [ ] Start system
- [ ] Open UI at http://localhost:3000
- [ ] Navigate to Emergency Controls
- [ ] Click "Pause" - verify API call succeeds
- [ ] Click "Resume" - verify API call succeeds
- [ ] Click "Emergency Shutdown" - verify API call succeeds

### Phase 1: Manual Trade Exit ✅
- [ ] Navigate to Trade Manager
- [ ] View active trades (if any)
- [ ] Click "Exit" on a trade
- [ ] Verify API call to `/api/trades/{id}/exit` succeeds

### Phase 1: Advanced Orders ✅
- [ ] Navigate to Advanced Orders UI
- [ ] Create TWAP order
- [ ] Verify API call to `/api/orders/advanced` succeeds
- [ ] Create VWAP order
- [ ] Create Iceberg order
- [ ] View all advanced orders

### Phase 1: Hyperopt Results ✅
- [ ] Navigate to Hyperopt Dashboard
- [ ] Verify API call to `/api/hyperopt/results` succeeds
- [ ] View optimization results

### Phase 1: Alert Configuration ✅
- [ ] Navigate to Alerts Manager
- [ ] Update Telegram settings
- [ ] Click Save
- [ ] Verify PUT `/api/alerts/config/telegram` succeeds

### Phase 2: Hedging ✅
- [ ] Navigate to Risk Dashboard
- [ ] View current portfolio delta
- [ ] Click "Create Hedge"
- [ ] Verify POST `/api/risk/hedges` succeeds
- [ ] View active hedges
- [ ] Close a hedge
- [ ] Verify DELETE `/api/risk/hedges/{id}` succeeds

---

## PAPER TRADING METRICS TO TRACK

### Daily Metrics
- **Target:** 3-5% daily profit
- **Max Drawdown:** <10%
- **Win Rate:** >60%
- **Sharpe Ratio:** >2.0

### Track These Daily:
1. Starting balance
2. Ending balance
3. Total P&L
4. Number of trades
5. Win rate
6. Max drawdown
7. Emergency control tests

### Success Criteria (7 Days Minimum)
- [ ] Average daily return: 3-5%
- [ ] Max drawdown: <10%
- [ ] Win rate: >60%
- [ ] No system crashes
- [ ] Emergency controls work every time
- [ ] All features functional

---

## MONITORING DASHBOARD

The `monitor_paper_trading.py` script provides:
- Real-time balance tracking
- Daily P&L percentage
- Win rate calculation
- Max drawdown monitoring
- Target progress (3-5% daily)
- Trade statistics

Updates every 30 seconds automatically.

---

## LOGS LOCATION

All logs saved to:
```
/home/drek/AkhaSoft/Nexora/logs/paper_trading/
```

Files:
- `freqtrade_YYYYMMDD_HHMMSS.log`
- `nexora_api_YYYYMMDD_HHMMSS.log`
- `nexora_ui_YYYYMMDD_HHMMSS.log`

---

## STOPPING PAPER TRADING

### Using Script:
```bash
./stop_paper_trading.sh
```

### Manual:
```bash
# Find PIDs
ps aux | grep -E "(freqtrade|uvicorn|npm)"

# Kill processes
kill <PID>
```

---

## TROUBLESHOOTING

### FreqTrade Not Starting
```bash
# Install FreqTrade
cd /home/drek/AkhaSoft/Nexora/freqtrade
python3 -m pip install -e .
```

### API Not Accessible
```bash
# Check if running
curl http://localhost:8888/health

# Check logs
tail -f logs/paper_trading/nexora_api_*.log
```

### UI Not Loading
```bash
# Check if running
curl http://localhost:3000

# Reinstall dependencies
cd /home/drek/AkhaSoft/Nexora/nexora-ui
npm install
npm run dev
```

---

## NEXT STEPS

1. **Today:** Test all Phase 1 endpoints
2. **Day 1-7:** Paper trade and monitor daily
3. **Day 7:** Review results, tune parameters
4. **Day 8-14:** Continue paper trading
5. **Day 14:** Final review before live

**DO NOT go live until:**
- ✅ 7+ days successful paper trading
- ✅ 3-5% daily target achieved
- ✅ Max drawdown <10%
- ✅ All emergency controls tested
- ✅ Win rate >60%

---

**Last Updated:** 2026-01-22 12:45 PM IST  
**Status:** 🚀 Ready to Start Paper Trading  
**Next Action:** Choose Option 1 or 2 and begin testing
