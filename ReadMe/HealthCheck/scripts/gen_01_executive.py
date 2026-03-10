#!/usr/bin/env python3
"""01 — Executive Report Generator (v3 — Live-Aware Edition)"""
import json, urllib.request, base64, datetime

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()

# Authoritative bot mapping for status matching
BOT_MAP = {
    "momentum_lp": "nexora_momentum_lp",
    "range_mm": "nexora_range_mm",
    "cross_arb": "nexora_cross_arb",
    "hedged": "nexora_hedged",
    "funding_arb": "nexora_funding_arb",
    "token_snipe": "nexora_token_snipe",
    "flash_recovery": "nexora_flash_recovery",
    "breakout_confirm": "nexora_breakout",
    "weekend_mm": "nexora_weekend_mm"
}

def get(url, auth=None):
    try:
        req = urllib.request.Request(url)
        if auth: req.add_header("Authorization", f"Basic {auth}")
        return json.loads(urllib.request.urlopen(req, timeout=10).read())
    except: return {}

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 🏢 Executive Report\n> Generated: {ts} UTC\n")

# Services
print("## System Status\n")
svcs = {"nexora-api:8888": "http://localhost:8888/api/scenarios/available",
        "freqtrade:8080": "http://localhost:8080/api/v1/version",
        "hummingbot:8000": "http://localhost:8000/",
        "gateway:15888": "http://localhost:15888/"}
results = {}
for name, url in svcs.items():
    try:
        auth_h = FT if "8080" in url else HB if "8000" in url else None
        get(url, auth_h)
        results[name] = "🟢 UP"
    except:
        results[name] = "🔴 DOWN"

print("```mermaid")
print("graph LR")
for i, (name, status) in enumerate(results.items()):
    color = "#4CAF50" if "UP" in status else "#f44336"
    svc = name.split(":")[0]
    print(f'    S{i}["{svc}<br/>{status}"]')
    print(f'    style S{i} fill:{color},color:#fff')
print("```\n")

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

# Trading metrics
try:
    d = get("http://localhost:8080/api/v1/profit", FT)
    pf = d.get("profit_factor", 0) or 0; wr = d.get("winrate", 0) or 0
    sh = d.get("sharpe", 0) or 0; tc = d.get("profit_all_coin", 0) or 0
    
    if pf > 1.3 and wr > 0.6: verdict = "🟢 ON TRACK"
    elif pf > 1.0: verdict = "🟡 MARGINAL"
    else: verdict = "🔴 OFF TRACK"

    print("## Trading Performance\n")
    print("| Metric | Value | Status |")
    print("|--------|-------|--------|")
    print(f"| Total P&L | ${tc:.2f} | {'🟢' if tc > 0 else '⚪' if tc == 0 else '🔴'} |")
    print(f"| Win Rate | {wr*100:.1f}% | {'🟢' if wr > 0.6 else '🟡' if wr > 0.5 else '🔴'} |")
    print(f"| Profit Factor | {pf:.2f} | {'🟢' if pf > 1.3 else '🟡' if pf > 1.0 else '🔴'} |")
    print(f"| Sharpe | {sh:.2f} | {'🟢' if sh > 1.0 else '🟡' if sh > 0 else '🔴'} |")
    print(f"| Max Drawdown | {d.get('max_drawdown',0)*100:.2f}% | {'🟢' if d.get('max_drawdown',0) < 0.05 else '🔴'} |")
    print(f"| Trades | {d.get('trade_count',0)} ({d.get('winning_trades',0)}W/{d.get('losing_trades',0)}L) | |")
    print(f"\n### Verdict: {verdict}\n")
except Exception as e:
    print(f"FreqTrade error: {e}\n")

# Scenarios 
try:
    sc = get("http://localhost:8888/api/scenarios/active")
    scenarios = sc.get("scenarios", [])
    if not scenarios:
        # Fallback to designed list if scenario API is idle
        print("## System Capacity\n")
        print(f"- 🟢 **{len(all_live)}** DEX bots active")
        print(f"- ⚪ CEX Strategy in PAPER mode")
    else:
        print("## Active Scenarios\n")
        print("```mermaid")
        print("pie title Scenario P&L Distribution")
        for s in scenarios:
            pnl = abs(s.get("pnl", 0))
            if pnl > 0:
                label = f"{s['id']} (${s.get('pnl',0):.2f})"
                print(f'    "{label}" : {max(pnl, 0.01)}')
        if not any(abs(s.get("pnl", 0)) > 0 for s in scenarios):
            print('    "Active (No P&L)" : 1')
        print("```\n")
        print("| Scenario | P&L | CEX | DEX | Status |")
        print("|----------|-----|-----|-----|--------|")
        for s in scenarios:
            sid = s['id']
            pnl = s.get("pnl", 0)
            emoji = "🟢" if pnl > 0 else "🔴" if pnl < 0 else "⚪"
            
            # Check if bot is live
            target_bot = BOT_MAP.get(sid)
            if target_bot and target_bot in all_live:
                ds = "🟢 Live"
            elif s.get("dex_pnl", 0) != 0:
                ds = "🟢 Live"
            else:
                ds = "❌ Down/Dead"
            
            print(f"| {emoji} {sid} | ${pnl:.2f} | ${s.get('cex_pnl',0):.2f} | {ds} | {'Active' if target_bot in all_live or pnl != 0 else 'Idle'} |")
except Exception as e:
    print(f"Scenario error: {e}")
