#!/usr/bin/env python3
"""07 — Bot & Scenario Health Audit Generator (v3 — Live-Aware Edition)

Sources of truth (in order of priority):
  1. MQTT discovered_bots  — what is actually connected and heartbeating RIGHT NOW
  2. Docker active containers — what containers are running (bot may not have MQTT yet)
  3. /tmp/nexora_scenarios.json — scenario state (may be stale)

The SCENARIO_BOT_MAP is the authoritative link between scenario IDs and bot names.
"""
import json, urllib.request, base64, datetime, subprocess

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()

DESIGNED = {
    "momentum_lp":     {"cex": 0.6,  "dex": 0.4,  "bot": "nexora_momentum_lp"},
    "range_mm":        {"cex": 0.3,  "dex": 0.7,  "bot": "nexora_range_mm"},
    "cross_arb":       {"cex": 0.5,  "dex": 0.5,  "bot": "nexora_cross_arb"},
    "hedged":          {"cex": 0.5,  "dex": 0.5,  "bot": "nexora_hedged"},
    "yield_scalp":     {"cex": 0.4,  "dex": 0.6,  "bot": "nexora_yield_scalp"},
    "emergency":       {"cex": 0.0,  "dex": 0.0,  "bot": None},  # Manual action only
    "funding_arb":     {"cex": 0.5,  "dex": 0.5,  "bot": "nexora_funding_arb"},
    "token_snipe":     {"cex": 0.0,  "dex": 1.0,  "bot": "nexora_token_snipe"},
    "grid_hedge":      {"cex": 0.5,  "dex": 0.5,  "bot": "nexora_grid_hedge"},
    "flash_recovery":  {"cex": 0.6,  "dex": 0.4,  "bot": "nexora_flash_recovery"},
    "stable_yield":    {"cex": 0.0,  "dex": 1.0,  "bot": "nexora_stable_yield"},
    "breakout_confirm":{"cex": 0.7,  "dex": 0.3,  "bot": "nexora_breakout"},
    "weekend_mm":      {"cex": 0.2,  "dex": 0.8,  "bot": "nexora_weekend_mm"},
    "multichain_arb":  {"cex": 0.0,  "dex": 1.0,  "bot": "nexora_multichain_arb"},
}

def get(url, auth=None):
    try:
        req = urllib.request.Request(url)
        if auth: req.add_header("Authorization", f"Basic {auth}")
        return json.loads(urllib.request.urlopen(req, timeout=10).read())
    except: return {}

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 🤖 Bot & Scenario Health Audit\n> Generated: {ts} UTC\n")

# ── FreqTrade Mode ───────────────────────────────────────────────────────────
try:
    cfg = get("http://localhost:8080/api/v1/show_config", FT)
    mode = "⚠️ PAPER" if cfg.get("dry_run") else "🟢 LIVE"
    print(f"## FreqTrade Mode\n")
    print(f"- Mode: **{mode}**")
    print(f"- Strategy: `{cfg.get('strategy')}`")
    sl = cfg.get("stoploss")
    print(f"- Stoploss: `{sl*100:.1f}%`" if sl else "- ⚠️ Stoploss: **NOT SET**")
    print(f"- Trailing Stop: `{cfg.get('trailing_stop', False)}`")
    mot = cfg.get("max_open_trades")
    if mot == 0:
        print(f"- Max Open Trades: `0` ⚠️ **SAFETY STOP — no new entries**")
    else:
        print(f"- Max Open Trades: `{mot}`")
except Exception as e:
    print(f"FreqTrade unreachable: {e}")

# ── Open Positions ───────────────────────────────────────────────────────────
print("\n## Open Positions (Age Detection)\n")
try:
    trades = get("http://localhost:8080/api/v1/status", FT)
    if not trades:
        print("No open trades")
    else:
        print("| # | Pair | P&L | Stake | Age | Class |")
        print("|---|------|-----|-------|-----|-------|")
        for t in trades:
            hours = "?"
            try:
                opened = datetime.datetime.strptime(t["open_date"][:19], "%Y-%m-%d %H:%M:%S")
                h = (datetime.datetime.utcnow() - opened).total_seconds() / 3600
                hours = f"{h:.1f}h"
                cls = "⚠️ STALE" if h > 24 else ("🟢 Healthy" if t.get("profit_pct", 0) > -2 else "🔴 Danger")
            except:
                cls = "?"
            emoji = "🟢" if t.get("profit_pct", 0) > 0 else "🔴"
            print(f"| {emoji} #{t['trade_id']} | {t['pair']} | ${t.get('profit_abs',0):.2f} ({t.get('profit_pct',0):.1f}%) | ${t['stake_amount']:.0f} | {hours} | {cls} |")
except Exception as e:
    print(f"Trade fetch error: {e}")

# ── Hummingbot — MQTT + Docker discovery ─────────────────────────────────────
print("\n## Hummingbot Instances\n")

# 1. MQTT discovered_bots (heartbeating right now)
mqtt_data = get("http://localhost:8000/bot-orchestration/mqtt", HB)
mqtt_discovered = set()
if mqtt_data.get("status") == "success":
    raw = mqtt_data.get("data", {}).get("discovered_bots", [])
    for name in raw:
        # strip timestamp suffix: nexora_range_mm-20260224-190302 → nexora_range_mm
        base = name.split("-202")[0]
        mqtt_discovered.add(base)
        mqtt_discovered.add(name)  # keep original too

# 2. Docker running containers with "nexora" in name
docker_running = set()
try:
    hb_status = get("http://localhost:8000/bot-orchestration/status", HB)
    for name in hb_status.get("data", {}).keys():
        base = name.split("-202")[0]
        docker_running.add(base)
        docker_running.add(name)
except: pass

all_live_bots = mqtt_discovered | docker_running

print(f"- MQTT Discovered: **{len(mqtt_discovered)}** bots")
print(f"- Docker Active: **{len(docker_running)}** bots")
print(f"- Combined live: {sorted(all_live_bots)}\n")

# ── Scenario ↔ Bot Cross-Reference ───────────────────────────────────────────
print("## Scenario ↔ Bot Cross-Reference (Designed vs Actual)\n")

try:
    with open("/tmp/nexora_scenarios.json") as f:
        scenarios = json.load(f)
except:
    scenarios = {}

try:
    ft_trades = get("http://localhost:8080/api/v1/status", FT)
    ft_ids = {t["trade_id"] for t in ft_trades}
except:
    ft_ids = set()

running_count = 0; disabled_count = 0; ghost_count = 0; not_deployed_count = 0
s_dex = set()

print("| Scenario | CEX Class | DEX (Designed) | Bot Deployed | DEX Status |")
print("|----------|-----------|----------------|--------------|------------|")

for sid, designed in DESIGNED.items():
    info = scenarios.get(sid, {})
    tid = info.get("cex_trade_id")

    # CEX status
    if designed["cex"] > 0:
        if tid and tid in ft_ids: cex_cls = "🟢 RUNNING"
        elif tid: cex_cls = "👻 Ghost"
        else: cex_cls = "❌ Missing"
    else:
        cex_cls = "⚪ N/A"

    # DEX status — use DESIGNED bot name as the lookup key
    dex_designed = f"{designed['dex']*100:.0f}%"
    assigned_bot = designed["bot"]

    if designed["dex"] == 0:
        dex_cls = "⚪ N/A"
        bot_display = "—"
    elif assigned_bot is None:
        dex_cls = "🔴 NOT DEPLOYED"
        bot_display = "—"
        not_deployed_count += 1
    elif assigned_bot in all_live_bots or any(assigned_bot in b for b in all_live_bots):
        dex_cls = "🟢 LIVE"
        bot_display = f"`{assigned_bot}`"
        running_count += 1
        s_dex.add(assigned_bot)
    else:
        dex_cls = "👻 Ghost/Down"
        bot_display = f"`{assigned_bot}`"
        ghost_count += 1

    print(f"| {sid} | {cex_cls} | {dex_designed} | {bot_display} | {dex_cls} |")

# Orphan bots (running but not mapped to any scenario)
mapped_bots = {d["bot"] for d in DESIGNED.values() if d["bot"]}
orphan_bots = all_live_bots - mapped_bots - {b for b in all_live_bots if any(b in m or m in b for m in mapped_bots)}

print("\n### Classification Summary\n")
print("```mermaid")
print("pie title DEX Bot Coverage")
if running_count: print(f'    "🟢 LIVE" : {running_count}')
if ghost_count: print(f'    "👻 Ghost/Down" : {ghost_count}')
if not_deployed_count: print(f'    "🔴 Not Deployed" : {not_deployed_count}')
print("```\n")

scenarios_needing_dex = sum(1 for d in DESIGNED.values() if d["dex"] > 0)
print(f"- ✅ **{running_count}** of {scenarios_needing_dex} DEX scenarios have a live bot")
print(f"- 🔴 **{not_deployed_count}** DEX scenarios have no bot assigned yet (future phases)")
if ghost_count:
    print(f"- 👻 **{ghost_count}** bots assigned but not currently running")

# Legend
print("\n## Legend\n")
print("| Symbol | Meaning |")
print("|--------|---------|")
print("| 🟢 LIVE | Bot is heartbeating via MQTT or confirmed in Docker |")
print("| 👻 Ghost/Down | Bot was assigned but not currently running |")
print("| 🔴 NOT DEPLOYED | Scenario needs a bot but none assigned yet |")
print("| ⚠️ STALE | Open trade > 24h |")
print("| ⚪ N/A | Designed allocation is 0% |")
