#!/usr/bin/env python3
"""05 — Trading Pulse Check Generator (v4 — Live-Aware & Consistent)"""
import json, urllib.request, base64, datetime

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()

# Authoritative scenario architecture
DESIGNED = {
    "momentum_lp":     {"cex": 0.6, "dex": 0.4, "bot": "nexora_momentum_lp"},
    "range_mm":        {"cex": 0.3, "dex": 0.7, "bot": "nexora_range_mm"},
    "cross_arb":       {"cex": 0.5, "dex": 0.5, "bot": "nexora_cross_arb"},
    "hedged":          {"cex": 0.5, "dex": 0.5, "bot": "nexora_hedged"},
    "yield_scalp":     {"cex": 0.4, "dex": 0.6, "bot": None},
    "emergency":       {"cex": 0.0, "dex": 0.0, "bot": None},
    "funding_arb":     {"cex": 0.5, "dex": 0.5, "bot": "nexora_funding_arb"},
    "token_snipe":     {"cex": 0.0, "dex": 1.0, "bot": "nexora_token_snipe"},
    "grid_hedge":      {"cex": 0.5, "dex": 0.5, "bot": None},
    "flash_recovery":  {"cex": 0.6, "dex": 0.4, "bot": "nexora_flash_recovery"},
    "stable_yield":    {"cex": 0.0, "dex": 1.0, "bot": None},
    "breakout_confirm":{"cex": 0.7, "dex": 0.3, "bot": "nexora_breakout"},
    "weekend_mm":      {"cex": 0.2, "dex": 0.8, "bot": "nexora_weekend_mm"},
    "multichain_arb":  {"cex": 0.0, "dex": 1.0, "bot": None},
}

def get(url, auth=None):
    try:
        req = urllib.request.Request(url)
        if auth: req.add_header("Authorization", f"Basic {auth}")
        return json.loads(urllib.request.urlopen(req, timeout=10).read())
    except: return {}

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 📈 Trading Pulse Check\n> Generated: {ts} UTC\n")

# 1. Trading mode
try:
    cfg = get("http://localhost:8080/api/v1/show_config", FT)
    mode = "⚠️ PAPER TRADING" if cfg.get("dry_run") else "🟢 LIVE"
    print("## Trading Mode\n")
    print(f"- Mode: **{mode}**")
    print(f"- Strategy: `{cfg.get('strategy')}`")
    print(f"- Timeframe: `{cfg.get('timeframe')}`")
    sl = cfg.get("stoploss")
    if sl: print(f"- Stoploss: `{sl*100:.1f}%`")
    else: print("- ⚠️ Stoploss: **NOT SET**")
    print(f"- Trailing Stop: `{cfg.get('trailing_stop', False)}`")
    print(f"- Max Open Trades: `{cfg.get('max_open_trades', 'Unlimited')}`")
except Exception as e:
    print(f"Config error: {e}")

# 2. Performance Metrics
print("\n## Performance Metrics\n")
try:
    d = get("http://localhost:8080/api/v1/profit", FT)
    pf = d.get("profit_factor", 0) or 0.0
    wr = d.get("winrate", 0) or 0.0
    sh = d.get("sharpe", 0) or 0.0
    so = d.get("sortino", 0) or 0.0
    dd = d.get("max_drawdown", 0) or 0.0
    exp = d.get("expectancy", 0) or 0.0
    tc = d.get("profit_all_coin", 0) or 0.0

    print("| Metric | Value | Min Target | Status |")
    print("|--------|-------|------------|--------|")
    print(f"| Total P&L | ${tc:.2f} | > $0 | {'🟢' if tc > 0 else '⚪' if tc == 0 else '🔴'} |")
    print(f"| Closed P&L | ${d.get('profit_closed_coin',0):.2f} | > $0 | {'🟢' if d.get('profit_closed_coin',0) > 0 else '⚪' if d.get('profit_closed_coin',0) == 0 else '🔴'} |")
    print(f"| Win Rate | {wr*100:.1f}% | > 60% | {'🟢' if wr > 0.6 else '🟡' if wr > 0.5 else '🔴'} |")
    print(f"| Profit Factor | {pf:.2f} | > 1.3 | {'🟢' if pf > 1.3 else '🟡' if pf > 1.0 else '🔴'} |")
    print(f"| Sharpe | {sh:.2f} | > 1.0 | {'🟢' if sh > 1.0 else '🟡' if sh > 0 else '🔴'} |")
    print(f"| Sortino | {so:.2f} | > 1.5 | {'🟢' if so > 1.5 else '🟡' if so > 0 else '🔴'} |")
    print(f"| Max DD | {dd*100:.2f}% | < 5% | {'🟢' if dd < 0.05 else '🟡' if dd < 0.1 else '🔴'} |")
    print(f"| Expectancy | ${exp:.4f}/trade | > $0.30 | {'🟢' if exp > 0.3 else '🟡' if exp > 0 else '🔴'} |")
    print(f"| Avg Duration | {d.get('avg_duration', 'N/A')} | 15m-4h | — |")
    print(f"| Trades | {d.get('trade_count', 0)} ({d.get('winning_trades', 0)}W/{d.get('losing_trades', 0)}L) | — | — |")
    print(f"| Volume | ${d.get('trading_volume', 0):,.2f} | — | — |")
    # print(f"| SQN | {d.get('sqn', 0):.4f} | — | — |")

    # Gauge chart
    print("\n### Performance Gauge\n")
    print("```mermaid")
    print("pie title Metric Health (of 6 key metrics)")
    greens = sum([pf > 1.3, wr > 0.6, sh > 1.0, so > 1.5, dd < 0.05, exp > 0.3])
    yellows = sum([1.0 <= pf <= 1.3, 0.5 <= wr <= 0.6, 0 < sh <= 1.0, 0 < so <= 1.5, 0.05 <= dd <= 0.1, 0 < exp <= 0.3])
    reds = 6 - greens - yellows
    if greens: print(f'    "🟢 On Track" : {greens}')
    if yellows: print(f'    "🟡 Marginal" : {yellows}')
    if reds: print(f'    "🔴 Failing" : {reds}')
    print("```\n")

    if pf > 1.3 and wr > 0.6 and sh > 1.0: print("### VERDICT: 🟢 ON TRACK")
    elif tc == 0 and d.get('trade_count', 0) == 0: print("### VERDICT: ⚪ IDLE — No trades executed")
    elif pf > 1.0 and wr > 0.55: print("### VERDICT: 🟡 MARGINAL")
    else: print("### VERDICT: 🔴 OFF TRACK — System is LOSING money")
except Exception as e:
    print(f"Profit error: {e}")

# 3. Open positions
print("\n## Open Positions\n")
try:
    trades = get("http://localhost:8080/api/v1/status", FT)
    if not trades: print("No open trades")
    else:
        print("| # | Pair | P&L | % | Stake | Opened |")
        print("|---|------|-----|---|-------|--------|")
        for t in trades:
            emoji = "🟢" if t.get("profit_pct", 0) > 0 else "🔴"
            print(f"| {emoji} #{t['trade_id']} | {t['pair']} | ${t.get('profit_abs',0):.2f} | {t.get('profit_pct',0):.1f}% | ${t['stake_amount']:.0f} | {t['open_date'][:16]} |")
except Exception as e:
    print(f"Trades error: {e}")

# 4. Scenario Tracking (Live-Aware)
print("\n## Scenario Tracking\n")

# Live bot detection
all_live = set()
try:
    mqtt = get("http://localhost:8000/bot-orchestration/mqtt", HB)
    if mqtt.get("status") == "success":
        for name in mqtt.get("data", {}).get("discovered_bots", []):
            all_live.add(name.split("-202")[0])
except: pass
try:
    hb_status = get("http://localhost:8000/bot-orchestration/status", HB)
    for name in hb_status.get("data", {}).keys():
        all_live.add(name.split("-202")[0])
except: pass

try:
    # Get live metrics from API where available
    sc_api = get("http://localhost:8888/api/scenarios/active")
    live_metrics = {s['id']: s for s in sc_api.get("scenarios", [])}
    
    print("| Scenario | P&L | CEX | DEX | Status |")
    print("|----------|-----|-----|-----|--------|")
    for sid, d in DESIGNED.items():
        m = live_metrics.get(sid, {})
        pnl = m.get("pnl", 0)
        emoji = "🟢" if pnl > 0 else "🔴" if pnl < 0 else "⚪"
        
        bot = d["bot"]
        if bot and (bot in all_live or any(bot in b for b in all_live)):
            ds = "🟢 Live"
        elif d["dex"] == 0:
            ds = "⚪ N/A"
        else:
            ds = "🔴 Down/Dead"
            
        print(f"| {emoji} {sid} | ${pnl:.2f} | ${m.get('cex_pnl',0):.2f} | {ds} | {'Active' if ds == '🟢 Live' or pnl != 0 else 'Idle'} |")
except Exception as e:
    print(f"Scenario error: {e}")

# 5. DEX System Integrity
print("\n## 🏗 DEX System Integrity\n")
try:
    hb = get("http://localhost:8000/bot-orchestration/status", HB)
    bots = hb.get("data", {})
    if not bots:
        print("🔴 **ZERO Hummingbot bots running**")
    else:
        print(f"🟢 **{len(bots)}** bot(s) active")
        print(f"> Detected: {sorted(all_live)}")
except Exception as e:
    print(f"🔴 Hummingbot API unreachable: {e}")

# 6. Balance
print("\n## Balance\n")
try:
    bal = get("http://localhost:8080/api/v1/balance", FT)
    print(f"**Total: {bal.get('total',0):.2f} {bal.get('stake','USDT')}**\n")
    print("| Currency | Balance | Free |")
    print("|----------|---------|------|")
    for c in bal.get("currencies", []):
        if c.get("balance", 0) > 0:
            print(f"| {c['currency']} | {c['balance']:.4f} | {c['free']:.4f} |")
except Exception as e:
    print(f"Balance error: {e}")
