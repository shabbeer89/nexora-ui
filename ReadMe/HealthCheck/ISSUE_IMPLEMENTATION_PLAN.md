# 🔧 Nexora Issue Implementation Plan — All 15 Issues

> **Purpose**: Step-by-step fix instructions for every issue detected by the Issue Tracker report.
> **For**: AI Agents (Gemini Flash, Claude, etc.) — follow each step exactly as written.
> **Date**: 2026-02-24
> **Source**: `09_issue_tracker.md` (15 issues: 11 P1, 4 P2)

---

## 🔑 Prerequisites — Read Before Starting

**You MUST have these to execute the plan:**

```bash
# SSH connection (run every command on the DROPLET unless stated otherwise)
SSH_KEY="/home/drek/AkhaSoft/Nexora/nexora-ui/ReadMe/Deploy/mysshkey"
DROPLET="root@64.227.151.249"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET

# Once on the droplet, all paths are relative to:
cd /root/Nexora
```

**Key file locations (on the droplet):**

| What | Path |
|------|------|
| FreqTrade config | `/root/Nexora/freqtrade/user_data/config.json` |
| FreqTrade strategies | `/root/Nexora/freqtrade/user_data/strategies/` |
| Nexora Bot API code | `/root/Nexora/nexora-bot/src/` |
| Nexora Bot .env | `/root/Nexora/nexora-bot/.env` |
| Scenario state | `/tmp/nexora_scenarios.json` |
| API logs | `/root/Nexora/logs/nexora-api.log` |

**Service credentials:**

| Service | Auth |
|---------|------|
| FreqTrade | `curl -u freqtrader:SuperSecurePassword http://localhost:8080/api/v1/...` |
| Hummingbot | `curl -u admin:admin123 http://localhost:8000/...` |
| Nexora API | `curl http://localhost:8888/api/...` |

---

## 📋 Execution Order

> **IMPORTANT**: Execute these phases IN ORDER. Do NOT skip ahead.

```
PHASE 1: Stop the bleeding (Issues #6, #7)        — 5 minutes
PHASE 2: Fix risk management (Issues #3, #14)      — 10 minutes
PHASE 3: Fix DEX / ghost bots (Issues #8-11, #15)  — 15 minutes
PHASE 4: Strategy evaluation (Issues #1, #4, #12)  — 30 minutes
PHASE 5: Address metrics (Issues #2, #5)           — Automatic after Phase 4
PHASE 6: Config cleanup (Issues #13)               — 5 minutes (only after strategy proven)
```

---

## PHASE 1: Stop the Bleeding 🔴

### Issue #6 — Stoploss is -99% (effectively disabled)

**Problem**: FreqTrade config has `stoploss: -0.99` which means a trade can lose 99% before stopping. This is why Trade #64 dropped to -5.4% with no exit.

**Fix**:

```bash
# Step 1: SSH to droplet
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET

# Step 2: Edit the FreqTrade config
python3 -c "
import json
config_path = '/root/Nexora/freqtrade/user_data/config.json'
with open(config_path) as f:
    config = json.load(f)

# SET STOPLOSS TO -3% (lose max 3% per trade)
config['stoploss'] = -0.03

# SAVE
with open(config_path, 'w') as f:
    json.dump(config, f, indent=4)

print('✅ Stoploss set to', config['stoploss'])
"

# Step 3: Restart FreqTrade to apply
docker restart freqtrade

# Step 4: Wait 10 seconds, then verify
sleep 10
curl -s -u freqtrader:SuperSecurePassword \
  http://localhost:8080/api/v1/show_config | python3 -c "
import json, sys
d = json.load(sys.stdin)
sl = d.get('stoploss')
print(f'Stoploss is now: {sl}')
assert sl == -0.03, f'FAILED: stoploss is {sl}, expected -0.03'
print('✅ VERIFIED: Stoploss correctly set to -3%')
"
```

**Expected result**: Stoploss = `-0.03` (3% max loss per trade)

---

### Issue #7 — Trade #64 at -5.1% severe loss

**Problem**: BTC/USDT trade #64 is at -5.1% with no exit signal because stoploss was disabled.

**Fix**:

```bash
# Step 1: Check current status of trade #64
curl -s -u freqtrader:SuperSecurePassword \
  http://localhost:8080/api/v1/status | python3 -c "
import json, sys
trades = json.load(sys.stdin)
for t in trades:
    if t['trade_id'] == 64:
        print(f'Trade #64: {t[\"pair\"]} at {t.get(\"profit_pct\",0):.1f}%')
        if t.get('profit_pct', 0) < -5:
            print('⚠️ Still severely negative. Consider force-closing.')
        elif t.get('profit_pct', 0) > -2:
            print('🟢 Recovering. Let the new stoploss handle it.')
        break
else:
    print('Trade #64 is already closed.')
"

# Step 2: IF trade is still at -5% or worse, force close it:
# UNCOMMENT the line below only if trade is severely negative
# curl -s -u freqtrader:SuperSecurePassword -X DELETE \
#   "http://localhost:8080/api/v1/forceexit" \
#   -H "Content-Type: application/json" \
#   -d '{"tradeid": 64}'

# Step 3: After the new stoploss is set (Phase 1 Issue #6),
# the system will automatically prevent future trades from
# reaching -5%. No further action needed.
```

**Expected result**: Trade #64 is either closed or protected by the new -3% stoploss.

---

## PHASE 2: Fix Risk Management 🔴

### Issue #3 — Sortino Ratio -4.29 (excessive downside risk)

**Problem**: No downside protection. Losses are unbounded.

**Fix**: Enable trailing stop to protect profits and limit downside.

```bash
# Step 1: Update FreqTrade config with trailing stop
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET 'python3 -c "
import json
config_path = \"/root/Nexora/freqtrade/user_data/config.json\"
with open(config_path) as f:
    config = json.load(f)

# ENABLE TRAILING STOP
config[\"trailing_stop\"] = True
config[\"trailing_stop_positive\"] = 0.01       # Trail 1% behind peak
config[\"trailing_stop_positive_offset\"] = 0.02 # Activate after +2% profit
config[\"trailing_only_offset_is_reached\"] = True

with open(config_path, \"w\") as f:
    json.dump(config, f, indent=4)

print(\"✅ Trailing stop enabled:\")
print(f\"  trailing_stop: {config[\"trailing_stop\"]}\")
print(f\"  trailing_stop_positive: {config[\"trailing_stop_positive\"]}\")
print(f\"  trailing_stop_positive_offset: {config[\"trailing_stop_positive_offset\"]}\")
"'

# Step 2: Restart FreqTrade
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET "docker restart freqtrade"

# Step 3: Verify
sleep 10
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET \
  'curl -s -u freqtrader:SuperSecurePassword \
   http://localhost:8080/api/v1/show_config | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"trailing_stop: {d.get(\"trailing_stop\")}\")
assert d.get(\"trailing_stop\") == True, \"FAILED\"
print(\"✅ VERIFIED: Trailing stop is ON\")
"'
```

**Expected result**: `trailing_stop: True`, activates at +2% profit, trails 1% behind.

---

### Issue #14 (P2) — Trailing stop disabled

**Resolved by**: Issue #3 fix above. Same change. No additional work needed.

---

## PHASE 3: Fix DEX / Ghost Bots 🔴

### Issue #8 — ZERO Hummingbot bots running (DEX is dead)

**Problem**: The Hummingbot API returns `{"data": {}}` — no bots are deployed. All 3 scenarios have DEX allocations but no actual bots.

**Fix — Option A (Recommended): Disable DEX allocations**

Since the DEX strategies (`liquidity_mining`, `market_buy`, `dip_buy_jupiter`) don't have proper controller configs, the cleanest fix is to set DEX allocations to 0 and focus 100% on CEX until DEX is properly built.

```bash
# Step 1: Update scenario state to set DEX allocations to 0
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET 'python3 -c "
import json

with open(\"/tmp/nexora_scenarios.json\") as f:
    state = json.load(f)

for sid, info in state.items():
    old_dex = info.get(\"dex_allocation\", 0)
    old_cex = info.get(\"cex_allocation\", 0)
    
    # Move DEX allocation to CEX
    info[\"cex_allocation\"] = old_cex + old_dex
    info[\"dex_allocation\"] = 0
    info[\"dex_bot_name\"] = \"\"
    info[\"dex_pnl\"] = 0.0
    
    print(f\"{sid}: DEX {old_dex} → 0, CEX {old_cex} → {info[\"cex_allocation\"]}\")

with open(\"/tmp/nexora_scenarios.json\", \"w\") as f:
    json.dump(state, f, indent=2)

print(\"\\n✅ All DEX allocations set to 0. CEX now has full capital.\")
"'
```

**Fix — Option B (If you want DEX to work):**
This requires significant code work:
1. Create Hummingbot V2 controller YAML configs for each strategy
2. Place them in `/root/Nexora/hbot/hummingbot_files/controller_configs/`
3. Use the proper `deploy-v2-controllers` endpoint with correct script + config
4. This is a multi-day effort — recommend Option A for now.

**Expected result**: Ghost bot errors disappear. DEX shows as `⚪ N/A (0% allocation)`.

---

### Issues #9, #10, #11 — Ghost DEX bots (momentum_lp, token_snipe, flash_recovery)

**Resolved by**: Issue #8 fix above. Once DEX allocation is 0, ghost bots are eliminated.

**Verify**:
```bash
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET 'python3 -c "
import json
with open(\"/tmp/nexora_scenarios.json\") as f:
    state = json.load(f)
for sid, info in state.items():
    dex = info.get(\"dex_allocation\", 0)
    bot = info.get(\"dex_bot_name\", \"\")
    if dex > 0 or bot:
        print(f\"❌ {sid} still has DEX: alloc={dex}, bot={bot}\")
    else:
        print(f\"✅ {sid}: DEX clean (0 allocation, no bot)\")
"'
```

---

### Issue #15 (P2) — momentum_lp CEX trade #63 is ghost

**Problem**: Scenario `momentum_lp` references `cex_trade_id: 63` but that trade is not in FreqTrade's open trades (it was already closed).

**Fix**:

```bash
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET 'python3 -c "
import json

with open(\"/tmp/nexora_scenarios.json\") as f:
    state = json.load(f)

# Clear the stale trade reference for momentum_lp
if \"momentum_lp\" in state:
    old_tid = state[\"momentum_lp\"].get(\"cex_trade_id\")
    state[\"momentum_lp\"][\"cex_trade_id\"] = None
    state[\"momentum_lp\"][\"cex_pnl\"] = 0.0
    print(f\"Cleared stale trade #{old_tid} from momentum_lp\")

with open(\"/tmp/nexora_scenarios.json\", \"w\") as f:
    json.dump(state, f, indent=2)

print(\"✅ Ghost trade reference removed\")
"'
```

**Expected result**: `momentum_lp` no longer references a closed trade.

---

## PHASE 4: Strategy Evaluation 🔴

### Issue #1 — Profit Factor 0.96 (system losing money)
### Issue #4 — Expectancy -$0.003/trade (negative edge)
### Issue #12 (P2) — Win Rate 56.5% (below 60% target)

**Problem**: The current `FreqAIStrategy` on 1h timeframe is not profitable. Every metric is below the minimum target.

**Fix — Step 1: Run backtests on the top 5 promising strategies**

```bash
# Step 1: List all available strategies
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET \
  'ls /root/Nexora/freqtrade/user_data/strategies/*.py | \
   grep -v __pycache__ | grep -v archive | grep -v audit'

# Step 2: Run backtests on 5 promising strategies (1 month of data)
# Run each one and compare results.
# Execute THESE 5 backtests (they are the most likely to be profitable
# based on strategy names and common trading patterns):

STRATEGIES=(
  "SimpleTrendFollowing"
  "DonchianBreakout"
  "MeanReversionV1"
  "TrendFollowingV2"
  "VolatilityExpansion"
)

for STRAT in "${STRATEGIES[@]}"; do
  echo "=== Testing $STRAT ==="
  ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET \
    "docker exec freqtrade freqtrade backtesting \
      --strategy $STRAT \
      --timeframe 5m \
      --timerange 20260101-20260224 \
      --config /freqtrade/user_data/config.json \
      2>&1 | tail -20"
  echo ""
done
```

**Step 2: Interpret results**

For each strategy backtest, look for these numbers:
```
Profit total:          (must be POSITIVE)
Win Rate:              (must be > 60%)
Profit Factor:         (must be > 1.3)
Max Drawdown:          (must be < 5%)
```

**Step 3: Switch to the best strategy**

```bash
# Replace "BestStrategyName" with the actual winner from backtests
BEST_STRATEGY="BestStrategyName"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET "python3 -c \"
import json
config_path = '/root/Nexora/freqtrade/user_data/config.json'
with open(config_path) as f:
    config = json.load(f)

config['strategy'] = '$BEST_STRATEGY'

# Also switch to 5m timeframe for more trading opportunities
config['timeframe'] = '5m'

with open(config_path, 'w') as f:
    json.dump(config, f, indent=4)

print(f'✅ Strategy changed to: {config[\"strategy\"]}')
print(f'✅ Timeframe changed to: {config[\"timeframe\"]}')
\""

# Restart FreqTrade
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET "docker restart freqtrade"
```

**Step 4: Verify the new strategy**

```bash
# Wait for restart
sleep 15

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET \
  'curl -s -u freqtrader:SuperSecurePassword \
   http://localhost:8080/api/v1/show_config | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"Strategy: {d.get(\"strategy\")}\")
print(f\"Timeframe: {d.get(\"timeframe\")}\")
print(f\"Stoploss: {d.get(\"stoploss\")}\")
print(f\"Trailing: {d.get(\"trailing_stop\")}\")
"'
```

**Expected result**: New strategy running with PF > 1.3 after a few days of operation.

> **NOTE TO AGENT**: If NO strategy passes the backtest criteria (PF > 1.3, WR > 60%), then STOP TRADING. Set `max_open_trades: 0` in the config and report to the user that no strategy meets the AIM targets and manual strategy development is needed.

---

## PHASE 5: Metrics Recovery (Automatic) 🔴

### Issue #2 — Sharpe Ratio -2.06
### Issue #5 — Total P&L -$30.54

**These issues resolve AUTOMATICALLY** once Phases 1-4 are complete:

- **Sharpe Ratio** improves when: stoploss limits losses (Phase 1), trailing stop protects profits (Phase 2), and strategy has positive expectancy (Phase 4)
- **Total P&L** recovers when: strategy is profitable and risk management prevents large drawdowns

**No manual action needed.** Just monitor after 48 hours:

```bash
# Run after 48 hours of new strategy operation
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET \
  'curl -s -u freqtrader:SuperSecurePassword \
   http://localhost:8080/api/v1/profit | python3 -c "
import json, sys
d = json.load(sys.stdin)
pf = d.get(\"profit_factor\", 0)
sh = d.get(\"sharpe\", 0)
tc = d.get(\"profit_all_coin\", 0)
print(f\"Profit Factor: {pf:.2f} (target: > 1.3)\")
print(f\"Sharpe Ratio:  {sh:.2f} (target: > 1.0)\")
print(f\"Total P&L:     \${tc:.2f} (target: > \$0)\")
if pf > 1.3 and sh > 1.0 and tc > 0:
    print(\"\\n🟢 ALL METRICS RECOVERED — System is on track!\")
elif pf > 1.0:
    print(\"\\n🟡 IMPROVING — Keep monitoring\")
else:
    print(\"\\n🔴 STILL FAILING — Strategy switch may not have worked. Re-evaluate.\")
"'
```

---

## PHASE 6: Config Cleanup (P2) 🟡

### Issue #13 — FreqTrade in PAPER mode

**Problem**: `dry_run: true` means no real trades are placed.

> **⚠️ DO NOT switch to live until the strategy has proven profitable in paper mode for at least 5 consecutive profitable days.**

**Pre-conditions before going live**:
- [ ] New strategy running for 5+ days
- [ ] Profit Factor > 1.3 for the entire period
- [ ] Sharpe > 1.0
- [ ] Max Drawdown < 5%
- [ ] All Phase 1-4 fixes verified

**When ready to go live**:

```bash
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET "python3 -c \"
import json
config_path = '/root/Nexora/freqtrade/user_data/config.json'
with open(config_path) as f:
    config = json.load(f)

# SWITCH TO LIVE
config['dry_run'] = False

# Safety: Start with small stake
config['stake_amount'] = 50  # Start with $50 per trade, not $600

with open(config_path, 'w') as f:
    json.dump(config, f, indent=4)

print('⚠️ LIVE MODE ENABLED')
print(f'Stake amount: \${config[\"stake_amount\"]}')
print('Monitor closely for the first 24 hours!')
\""

# Restart
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET "docker restart freqtrade"
```

---

## 📊 Verification: Run After All Phases

After completing all phases, regenerate the Issue Tracker report:

```bash
# Upload the latest issue tracker script
scp -i $SSH_KEY -o StrictHostKeyChecking=no \
  /home/drek/AkhaSoft/Nexora/nexora-ui/ReadMe/HealthCheck/scripts/gen_09_issues.py \
  $DROPLET:/tmp/

# Generate fresh report
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $DROPLET \
  "python3 /tmp/gen_09_issues.py" > \
  /home/drek/AkhaSoft/Nexora/nexora-ui/ReadMe/HealthCheck/09_issue_tracker.md

# Check it
cat /home/drek/AkhaSoft/Nexora/nexora-ui/ReadMe/HealthCheck/09_issue_tracker.md
```

**Success criteria**:
- P1 issues: 0 (was 11)
- P2 issues: ≤ 2 (was 4)
- Profit Factor: > 1.0 (was 0.96)
- Stoploss: -3% (was -99%)
- Trailing Stop: enabled (was disabled)
- Ghost bots: 0 (was 4)
- DEX allocation: 0 across all scenarios

---

## ⏱ Timeline Summary

| Phase | Time | Issues Fixed | Impact |
|-------|------|-------------|--------|
| Phase 1 | 5 min | #6, #7 | Prevents catastrophic losses |
| Phase 2 | 10 min | #3, #14 | Protects profits with trailing stop |
| Phase 3 | 15 min | #8, #9, #10, #11, #15 | Eliminates ghost bots and DEX noise |
| Phase 4 | 30 min | #1, #4, #12 | Finds a profitable strategy |
| Phase 5 | Automatic | #2, #5 | Metrics recover with new strategy |
| Phase 6 | 5 min | #13 | Go live (only after validation) |
| **Total** | **~65 min** | **15/15** | |

---

## 🚫 What NOT to Do

1. **Do NOT go live (Phase 6) before the strategy proves profitable** — this is the #1 mistake
2. **Do NOT skip Phase 1** — without stoploss, any strategy can blow up the account
3. **Do NOT try to fix DEX before CEX is profitable** — focus on one revenue source first
4. **Do NOT change multiple things at once** — change one variable, monitor, then change the next
5. **Do NOT use `localhost` in any configs** — always use `127.0.0.1` (IPv6 avoidance)

---

> **Reference**: For the full system guide, see `NEXORA_MONITORING_PROMPT.md` in the same directory.
> **To re-check issues**: Run `python3 /tmp/gen_09_issues.py` on the droplet.
