#!/usr/bin/env python3
"""09 — Issue Tracker & Progress Report Generator (v4 — Live-Aware Edition)

RULES:
  1. Check DESIGNED architecture vs ACTUAL live state (MQTT + Docker, not just scenario JSON)
  2. SCENARIO_BOT_MAP is the authoritative link: scenario → expected bot name
  3. A scenario's DEX is LIVE if its assigned bot is in MQTT discovered_bots or Docker
  4. A scenario's DEX is NOT DEPLOYED if no bot is assigned (future phases)
  5. A scenario's DEX is DOWN if bot assigned but not running
"""
import json
import urllib.request
import base64
import datetime

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()

# Designed architecture: scenario → {cex%, dex%, bot_name}
# bot=None means not deployed yet (future phases — not a bug, not an issue)
DESIGNED_SCENARIOS = {
    "momentum_lp":     {"cex": 0.6, "dex": 0.4, "strategy": "liquidity_mining",   "bot": "nexora_momentum_lp"},
    "range_mm":        {"cex": 0.3, "dex": 0.7, "strategy": "market_making",      "bot": "nexora_range_mm"},
    "cross_arb":       {"cex": 0.5, "dex": 0.5, "strategy": "arbitrage_buy",      "bot": "nexora_cross_arb"},
    "hedged":          {"cex": 0.5, "dex": 0.5, "strategy": "perp_hedge",         "bot": "nexora_hedged"},
    "yield_scalp":     {"cex": 0.4, "dex": 0.6, "strategy": "lp_raydium",         "bot": "nexora_yield_scalp"},
    "emergency":       {"cex": 0.0, "dex": 0.0, "strategy": "remove_all_lp",      "bot": None},  # Manual
    "funding_arb":     {"cex": 0.5, "dex": 0.5, "strategy": "perp_long_dydx",     "bot": "nexora_funding_arb"},
    "token_snipe":     {"cex": 0.0, "dex": 1.0, "strategy": "market_buy",         "bot": "nexora_token_snipe"},
    "grid_hedge":      {"cex": 0.5, "dex": 0.5, "strategy": "concentrated_lp",    "bot": "nexora_grid_hedge"},
    "flash_recovery":  {"cex": 0.6, "dex": 0.4, "strategy": "dip_buy_jupiter",    "bot": "nexora_flash_recovery"},
    "stable_yield":    {"cex": 0.0, "dex": 1.0, "strategy": "deposit_curve",      "bot": "nexora_stable_yield"},
    "breakout_confirm":{"cex": 0.7, "dex": 0.3, "strategy": "correlated_buy",     "bot": "nexora_breakout"},
    "weekend_mm":      {"cex": 0.2, "dex": 0.8, "strategy": "tight_spread_mm",    "bot": "nexora_weekend_mm"},
    "multichain_arb":  {"cex": 0.0, "dex": 1.0, "strategy": "cross_chain_arb",    "bot": "nexora_multichain_arb"},
}

def get(url, auth=None):
    try:
        req = urllib.request.Request(url)
        if auth:
            req.add_header("Authorization", f"Basic {auth}")
        data = urllib.request.urlopen(req, timeout=5).read()
        return json.loads(data)
    except:
        return {}

issues = []

# ════════════════════════════════════════════════
# 1. CEX TRADING METRICS
# ════════════════════════════════════════════════
try:
    d = get("http://localhost:8080/api/v1/profit", FT)
    tc  = d.get("trade_count", 0) or 0
    pf  = d.get("profit_factor", 0) or 0.0
    wr  = d.get("winrate", 0) or 0.0
    sh  = d.get("sharpe", 0) or 0.0
    so  = d.get("sortino", 0) or 0.0
    dd  = d.get("max_drawdown", 0) or 0.0
    exp = d.get("expectancy", 0) or 0.0
    profit = d.get("profit_all_coin", 0) or 0.0

    if tc > 0:
        if pf < 1.0:
            issues.append(("🔴 P1", "Strategy", f"Profit Factor {pf:.2f} < 1.0 — system is LOSING money", "Kill current strategy, backtest alternatives"))
        elif pf < 1.3:
            issues.append(("🟡 P2", "Strategy", f"Profit Factor {pf:.2f} < 1.3 — below minimum target", "Tune parameters or reduce position size"))

        if wr < 0.5:
            issues.append(("🔴 P1", "Strategy", f"Win Rate {wr*100:.1f}% < 50% — worse than random", "Strategy is fundamentally flawed"))
        elif wr < 0.6:
            issues.append(("🟡 P2", "Strategy", f"Win Rate {wr*100:.1f}% < 60%", "Tighten entry conditions"))

        if sh < 0:
            issues.append(("🔴 P1", "Risk", f"Sharpe Ratio {sh:.2f} < 0 — destroying capital per unit risk", "Review strategy + risk params"))
        if so < 0:
            issues.append(("🔴 P1", "Risk", f"Sortino Ratio {so:.2f} < 0 — excessive downside risk", "Add stop-loss and trailing stop"))
        if exp < 0:
            issues.append(("🔴 P1", "Strategy", f"Expectancy ${exp:.4f}/trade — negative edge", "Every trade costs money on average"))

    if dd > 0.1:
        issues.append(("🔴 P1", "Risk", f"Max Drawdown {dd*100:.2f}% > 10% — emergency threshold", "EMERGENCY STOP, manual review"))
    elif dd > 0.05:
        issues.append(("🟡 P2", "Risk", f"Max Drawdown {dd*100:.2f}% > 5%", "Reduce position sizes"))

    if profit < -50:
        issues.append(("🔴 P1", "P&L", f"Total P&L ${profit:.2f} — system deeply underwater", "Assess whether to continue or reset"))
    elif profit < 0 and tc > 5:
        issues.append(("🟡 P2", "P&L", f"Total P&L ${profit:.2f} — negative but recoverable", "Monitor closely"))

except Exception as e:
    issues.append(("🔴 P1", "Infra", f"Cannot reach FreqTrade API: {e}", "Check docker restart freqtrade"))

# ════════════════════════════════════════════════
# 2. CEX CONFIGURATION
# ════════════════════════════════════════════════
try:
    cfg = get("http://localhost:8080/api/v1/show_config", FT)
    if cfg.get("dry_run"):
        issues.append(("🟡 P2", "Config", "FreqTrade in PAPER mode — not generating real P&L", "Switch to live when strategy is validated"))

    sl = cfg.get("stoploss")
    if sl is None or sl > -0.01:
        issues.append(("🔴 P1", "Risk", f"Stoploss is {sl*100:.1f}%" if sl else "Stoploss NOT SET", "Set stoploss to -2% to -5%"))

    if not cfg.get("trailing_stop"):
        issues.append(("🟡 P2", "Config", "Trailing stop disabled — profits not protected", "Enable trailing_stop with 1-2% offset"))

    mot = cfg.get("max_open_trades")
    if mot is not None and mot == 0:
        issues.append(("🟡 P2", "Config", "max_open_trades = 0 — Safety Stop active, no new entries", "Enable entries when profitable strategy found"))
except:
    pass

# ════════════════════════════════════════════════
# 3. OPEN POSITIONS — LOSS / STALE DETECTION
# ════════════════════════════════════════════════
try:
    trades = get("http://localhost:8080/api/v1/status", FT)
    for t in trades:
        pct = t.get("profit_pct", 0)
        if pct < -5:
            issues.append(("🔴 P1", "Position", f"Trade #{t['trade_id']} {t['pair']} at {pct:.1f}% — severe loss", "Consider force-closing"))
        try:
            opened = datetime.datetime.strptime(t["open_date"][:19], "%Y-%m-%d %H:%M:%S")
            hours = (datetime.datetime.utcnow() - opened).total_seconds() / 3600
            if hours > 24:
                issues.append(("🟡 P2", "Position", f"Trade #{t['trade_id']} stale ({hours:.0f}h open)", "Check exit logic"))
        except:
            pass
except:
    pass

# ════════════════════════════════════════════════
# 4. DEX / HUMMINGBOT — LIVE-AWARE CHECK
# Queries MQTT + Docker, not dex_allocation in scenario JSON
# ════════════════════════════════════════════════
mqtt_discovered = set()
docker_active = set()
hb_reachable = False

try:
    mqtt_data = get("http://localhost:8000/bot-orchestration/mqtt", HB)
    if mqtt_data.get("status") == "success":
        raw = mqtt_data.get("data", {}).get("discovered_bots", [])
        for name in raw:
            base = name.split("-202")[0]
            mqtt_discovered.add(base)
            mqtt_discovered.add(name)
    hb_reachable = True
except:
    issues.append(("🔴 P1", "Infra", "Hummingbot API unreachable at port 8000", "docker restart hummingbot-api"))

try:
    hb_status = get("http://localhost:8000/bot-orchestration/status", HB)
    for name in hb_status.get("data", {}).keys():
        base = name.split("-202")[0]
        docker_active.add(base)
        docker_active.add(name)
    hb_reachable = True
except:
    pass

all_live = mqtt_discovered | docker_active

# Check scenarios with DEX requirement
scenarios_needing_dex = [(sid, d) for sid, d in DESIGNED_SCENARIOS.items() if d["dex"] > 0]
deployed_assigned = [d["bot"] for _, d in scenarios_needing_dex if d["bot"] is not None]
undeployed_scenarios = [(sid, d) for sid, d in scenarios_needing_dex if d["bot"] is None]
down_bots = [(sid, d) for sid, d in scenarios_needing_dex if d["bot"] is not None
             and d["bot"] not in all_live and not any(d["bot"] in b or b in d["bot"] for b in all_live)]

# Report: bots that went down
for sid, d in down_bots:
    issues.append(("🔴 P1", "DEX", f"{sid}: bot '{d['bot']}' assigned but NOT RUNNING", f"Redeploy: POST /bot-orchestration/deploy-v2-script with instance_name={d['bot']}"))

# Report: future phases as P2 (not P1 — they were never deployed, design choice)
if undeployed_scenarios:
    sids = ", ".join(sid for sid, _ in undeployed_scenarios)
    issues.append(("🟡 P2", "DEX", f"{len(undeployed_scenarios)} DEX scenarios not yet deployed: {sids}", "Phase 4 build-out — deploy remaining bots"))

# ════════════════════════════════════════════════
# RENDER REPORT
# ════════════════════════════════════════════════
p1 = [i for i in issues if "P1" in i[0]]
p2 = [i for i in issues if "P2" in i[0]]
now = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")

print(f"# 🚨 Issue Tracker & Progress Report")
print(f"> Generated: {now} UTC\n")

print(f"## Summary\n")
p1_count = len(p1)
p2_count = len(p2)
prefix = "✅" if p1_count == 0 else "🔴"
print(f"- **{prefix} P1 (Critical)**: {p1_count}" + (" — RESOLVED" if p1_count == 0 else ""))
print(f"- **🟡 P2 (Important)**: {p2_count}\n")

print("```mermaid")
print("pie title Issue Priority Distribution")
if p1: print(f'    "🔴 Critical (P1)" : {len(p1)}')
if p2: print(f'    "🟡 Important (P2)" : {len(p2)}')
if not issues: print('    "✅ No Issues" : 1')
print("```\n")

areas = {}
for i in issues:
    a = i[1]
    areas[a] = areas.get(a, 0) + 1
if areas:
    print("```mermaid")
    print("pie title Issues by Area")
    for a, c in sorted(areas.items(), key=lambda x: -x[1]):
        print(f'    "{a} ({c})" : {c}')
    print("```\n")

print("## All Issues\n")
print("| # | Priority | Area | Issue | Action Required |")
print("|---|----------|------|-------|-----------------|")
for idx, (pri, area, issue, action) in enumerate(sorted(issues, key=lambda x: x[0]), 1):
    print(f"| {idx} | {pri} | {area} | {issue} | {action} |")
if not issues:
    print("| — | ✅ | — | No issues detected | Keep monitoring |")

# System Integrity table — now uses live bot detection
live_count = 0
not_deployed_count = 0
down_count = 0

print("\n## 🏗 System Integrity: Designed vs Actual\n")
print("| Scenario | Designed DEX% | DEX Strategy | Bot | Status |")
print("|----------|--------------|--------------|-----|--------|")
for sid, designed in DESIGNED_SCENARIOS.items():
    dex_pct = f"{designed['dex']*100:.0f}%"
    strategy = designed["strategy"]
    bot = designed["bot"]

    if designed["dex"] == 0:
        status = "✅ N/A"
        bot_display = "—"
    elif bot is None:
        status = "🟡 NOT DEPLOYED (Phase 4)"
        bot_display = "—"
        not_deployed_count += 1
    elif bot in all_live or any(bot in b or b in bot for b in all_live):
        status = "🟢 LIVE"
        bot_display = f"`{bot}`"
        live_count += 1
    else:
        status = "🔴 DOWN"
        bot_display = f"`{bot}`"
        down_count += 1

    print(f"| {sid} | {dex_pct} | {strategy} | {bot_display} | {status} |")

total_needing_dex = len(scenarios_needing_dex)
print(f"\n> **{live_count} of {total_needing_dex}** DEX scenarios LIVE. "
      f"{not_deployed_count} pending Phase 4 deployment. "
      f"{down_count} down/unreachable.")

# Progress roadmap
print("\n## Progress Roadmap\n")
print("```mermaid")
print("flowchart LR")
if live_count > 0:
    print(f'    DONE["✅ DONE<br/>Phase 8+: {live_count} DEX bots live"]')
    print('    style DONE fill:#4CAF50,color:#fff')
    print('    DONE --> NOW')
if len(p1) > 0:
    print('    NOW["🔴 NOW<br/>Fix P1 Issues"]')
    print('    style NOW fill:#f44336,color:#fff')
    print('    NOW --> NEXT')
else:
    print('    NOW["🟡 NOW<br/>Address P2 Issues"]')
    print('    style NOW fill:#FF9800,color:#fff')
    print('    NOW --> NEXT')
print('    NEXT["🟣 NEXT<br/>Phase 4: 5 more DEX bots"]')
print('    style NEXT fill:#9C27B0,color:#fff')
print('    NEXT --> VALIDATE["Validate<br/>Backtest Strategy"]')
print('    style VALIDATE fill:#2196F3,color:#fff')
print('    VALIDATE --> LIVE["🟢 Go Live<br/>Real Capital"]')
print('    style LIVE fill:#4CAF50,color:#fff')
print("```\n")

# Immediate actions
print("## ⚡ Immediate Actions Required\n")
if p1:
    for idx, (_, area, issue, action) in enumerate(p1, 1):
        print(f"{idx}. **[{area}]** {action}")
        print(f"   - *Cause*: {issue}")
else:
    print("✅ No critical actions required. System is healthy.")

print(f"\n---\n> Next review: Run `bash scripts/run_all_reports.sh` to regenerate all reports")
