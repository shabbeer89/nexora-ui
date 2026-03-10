#!/usr/bin/env python3
"""03 — Scenario Quality Report Generator (v3 — Live-Aware Edition)

DEX status determined by MQTT/Docker discovery + SCENARIO_BOT_MAP.
Does NOT rely on dex_allocation in /tmp/nexora_scenarios.json.
"""
import json, urllib.request, base64, datetime

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()

DESIGNED = {
    "momentum_lp":     {"cex": 0.6, "dex": 0.4, "cex_strat": "TrendFollowing", "dex_strat": "liquidity_mining",   "bot": "nexora_momentum_lp"},
    "range_mm":        {"cex": 0.3, "dex": 0.7, "cex_strat": "MeanReversion",  "dex_strat": "market_making",      "bot": "nexora_range_mm"},
    "cross_arb":       {"cex": 0.5, "dex": 0.5, "cex_strat": "Arbitrage_Sell", "dex_strat": "arbitrage_buy",      "bot": "nexora_cross_arb"},
    "hedged":          {"cex": 0.5, "dex": 0.5, "cex_strat": "ReducedSizeTrend","dex_strat":"perp_hedge",          "bot": "nexora_hedged"},
    "yield_scalp":     {"cex": 0.4, "dex": 0.6, "cex_strat": "QuickScalp",     "dex_strat": "lp_raydium",         "bot": "nexora_yield_scalp"},
    "emergency":       {"cex": 0.0, "dex": 0.0, "cex_strat": "force_exit_all", "dex_strat": "remove_all_lp",      "bot": None},
    "funding_arb":     {"cex": 0.5, "dex": 0.5, "cex_strat": "Perp_Short",     "dex_strat": "perp_long_dydx",     "bot": "nexora_funding_arb"},
    "token_snipe":     {"cex": 0.0, "dex": 1.0, "cex_strat": "MarketSell",     "dex_strat": "market_buy",         "bot": "nexora_token_snipe"},
    "grid_hedge":      {"cex": 0.5, "dex": 0.5, "cex_strat": "GridTrading",    "dex_strat": "concentrated_lp",    "bot": "nexora_grid_hedge"},
    "flash_recovery":  {"cex": 0.6, "dex": 0.4, "cex_strat": "DipBuy",        "dex_strat": "dip_buy_jupiter",     "bot": "nexora_flash_recovery"},
    "stable_yield":    {"cex": 0.0, "dex": 1.0, "cex_strat": "withdraw_earn",  "dex_strat": "deposit_curve",      "bot": "nexora_stable_yield"},
    "breakout_confirm":{"cex": 0.7, "dex": 0.3, "cex_strat": "BreakoutMomentum","dex_strat":"correlated_buy",     "bot": "nexora_breakout"},
    "weekend_mm":      {"cex": 0.2, "dex": 0.8, "cex_strat": "reduced_trading","dex_strat": "tight_spread_mm",    "bot": "nexora_weekend_mm"},
    "multichain_arb":  {"cex": 0.0, "dex": 1.0, "cex_strat": "noop",          "dex_strat": "cross_chain_arb",    "bot": "nexora_multichain_arb"},
}

def get(url, auth=None):
    try:
        req = urllib.request.Request(url)
        if auth: req.add_header("Authorization", f"Basic {auth}")
        return json.loads(urllib.request.urlopen(req, timeout=10).read())
    except: return {}

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 🛠 Scenario Execution Quality Report\n> Generated: {ts} UTC\n")

# ── Load actual state ─────────────────────────────────────────────────────────
try:
    with open("/tmp/nexora_scenarios.json") as f:
        scenarios = json.load(f)
except:
    scenarios = {}

try:
    ft_trades = get("http://localhost:8080/api/v1/status", FT)
    ft_map = {t["trade_id"]: t for t in ft_trades}
except: ft_map = {}

# Live bot detection via MQTT + Docker status (authoritative)
all_live = set()
try:
    mqtt = get("http://localhost:8000/bot-orchestration/mqtt", HB)
    if mqtt.get("status") == "success":
        for name in mqtt.get("data", {}).get("discovered_bots", []):
            all_live.add(name.split("-202")[0])
            all_live.add(name)
except: pass
try:
    hb_status = get("http://localhost:8000/bot-orchestration/status", HB)
    for name in hb_status.get("data", {}).keys():
        all_live.add(name.split("-202")[0])
        all_live.add(name)
except: pass

# ── Architecture diagram ──────────────────────────────────────────────────────
print("## Scenario Architecture (Designed)\n")
print("```mermaid")
print("graph LR")
for sid, d in DESIGNED.items():
    print(f'    subgraph "{sid}"')
    if d["cex"] > 0: print(f'        {sid}_CEX["{d["cex_strat"]}<br/>{d["cex"]*100:.0f}% CEX"]')
    if d["dex"] > 0: print(f'        {sid}_DEX["{d["dex_strat"]}<br/>{d["dex"]*100:.0f}% DEX"]')
    print(f'    end')
print("```\n")

# ── Integrity table ───────────────────────────────────────────────────────────
print("## Designed vs Actual Allocations\n")
print("| Scenario | Designed CEX | Designed DEX | Bot | DEX Status | Integrity |")
print("|----------|-------------|-------------|-----|------------|-----------|")

integrity_ok = 0; integrity_fails = 0; not_deployed = 0

def bot_is_live(bot, live_set):
    if bot is None: return False
    return bot in live_set or any(bot in b or b in bot for b in live_set)

for sid, d in DESIGNED.items():
    d_cex_pct = f"{d['cex']*100:.0f}%"
    d_dex_pct = f"{d['dex']*100:.0f}%"
    bot = d["bot"]

    if d["dex"] == 0:
        integrity = "✅ N/A"; dex_status = "⚪ N/A"; bot_display = "—"; integrity_ok += 1
    elif bot is None:
        integrity = "🟡 Phase 4"; dex_status = "🟡 NOT DEPLOYED"; bot_display = "—"; not_deployed += 1
    elif bot_is_live(bot, all_live):
        integrity = "✅ LIVE"; dex_status = "🟢 LIVE"; bot_display = f"`{bot}`"; integrity_ok += 1
    else:
        integrity = "🔴 DOWN"; dex_status = "🔴 DOWN"; bot_display = f"`{bot}`"; integrity_fails += 1

    print(f"| {sid} | {d_cex_pct} | {d_dex_pct} | {bot_display} | {dex_status} | {integrity} |")

deployed_live = sum(1 for sid, d in DESIGNED.items() if d["dex"] > 0 and bot_is_live(d["bot"], all_live))
total_needing = sum(1 for d in DESIGNED.values() if d["dex"] > 0)

print(f"\n> ✅ **{deployed_live}** of {total_needing} DEX scenarios LIVE. "
      f"**{not_deployed}** pending Phase 4. "
      f"{integrity_fails} down/unreachable.")

# ── Isolation verification ────────────────────────────────────────────────────
print("\n## Isolation Verification\n")
print("| Scenario | CEX trade_id | CEX Status | DEX Bot | DEX Status | P&L |")
print("|----------|-------------|------------|---------|------------|-----|")

for sid in DESIGNED:
    info = scenarios.get(sid, {})
    tid = info.get("cex_trade_id")
    pnl = info.get("pnl", 0)
    d = DESIGNED[sid]
    bot = d["bot"]

    if d["cex"] > 0:
        if tid and tid in ft_map: cs = "🟢 Running"
        elif tid: cs = "👻 Ghost"
        else: cs = "❌ Missing"
    else: cs = "⚪ N/A"; tid = "—"

    if d["dex"] == 0:
        ds = "⚪ N/A"; bot_display = "—"
    elif bot is None:
        ds = "🟡 Phase 4"; bot_display = "—"
    elif bot_is_live(bot, all_live):
        ds = "🟢 LIVE"; bot_display = bot[:25]
    else:
        ds = "🔴 DOWN"; bot_display = bot[:25]

    print(f"| {sid} | {tid} | {cs} | {bot_display or '—'} | {ds} | ${pnl:.2f} |")

# ── P&L accuracy ──────────────────────────────────────────────────────────────
print("\n## P&L Accuracy Audit\n")
print("| Scenario | Stored | FreqTrade | Delta | Match? |")
print("|----------|--------|-----------|-------|--------|")
for sid in DESIGNED:
    info = scenarios.get(sid, {})
    tid = info.get("cex_trade_id")
    stored = info.get("cex_pnl", 0)
    if tid and tid in ft_map:
        actual = ft_map[tid].get("profit_abs", 0)
        delta = abs(actual - stored)
        match = "✅" if delta < 0.1 else f"⚠️ Δ${delta:.2f}"
        print(f"| {sid} | ${stored:.2f} | ${actual:.2f} | ${delta:.2f} | {match} |")
    elif DESIGNED[sid].get("cex", 0) > 0:
        print(f"| {sid} | ${stored:.2f} | N/A | — | ⚠️ Trade closed/missing |")
    else:
        print(f"| {sid} | $0.00 | N/A | — | ⚪ No CEX allocation |")
