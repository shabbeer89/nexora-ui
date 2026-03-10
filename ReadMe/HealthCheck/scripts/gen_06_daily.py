#!/usr/bin/env python3
"""06 — Daily Trading Report Generator"""
import json, urllib.request, base64, datetime

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()

def get(url, auth=None):
    req = urllib.request.Request(url)
    if auth: req.add_header("Authorization", f"Basic {auth}")
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 📊 Daily Trading Report\n> Generated: {ts} UTC\n")

# Trade history
try:
    d = get("http://localhost:8080/api/v1/trades?limit=50", FT)
    trades = d.get("trades", [])
    closed = [t for t in trades if not t["is_open"]]
    total_pnl = sum(t.get("profit_abs", 0) for t in closed)
    wins = [t for t in closed if t.get("profit_abs", 0) > 0]
    losses = [t for t in closed if t.get("profit_abs", 0) <= 0]

    print("## Trade Summary\n")
    print(f"- **Closed Trades**: {len(closed)}")
    print(f"- **Total P&L**: ${total_pnl:.2f}")
    print(f"- **Record**: {len(wins)}W / {len(losses)}L")
    avg_win = sum(t.get("profit_abs", 0) for t in wins) / max(len(wins), 1)
    avg_loss = sum(t.get("profit_abs", 0) for t in losses) / max(len(losses), 1)
    print(f"- **Avg Win**: ${avg_win:.2f} | **Avg Loss**: ${avg_loss:.2f}")
    print()

    # Win/Loss distribution mermaid
    print("```mermaid")
    print("pie title Trade Results")
    if wins: print(f'    "Wins ({len(wins)})" : {len(wins)}')
    if losses: print(f'    "Losses ({len(losses)})" : {len(losses)}')
    print("```\n")

    # Trade table
    print("## Recent Trades (Last 10)\n")
    print("| # | Pair | P&L | % | Open | Close |")
    print("|---|------|-----|---|------|-------|")
    for t in sorted(closed, key=lambda x: x.get("close_date", ""), reverse=True)[:10]:
        emoji = "🟢" if t.get("profit_abs", 0) > 0 else "🔴"
        print(f"| {emoji} #{t['trade_id']} | {t['pair']} | ${t.get('profit_abs',0):.2f} | {t.get('profit_pct',0):.1f}% | {t.get('open_date','')[:16]} | {t.get('close_date','')[:16]} |")

    # P&L by pair
    pairs = {}
    for t in closed:
        p = t.get("pair", "unknown")
        if p not in pairs: pairs[p] = {"pnl": 0, "count": 0}
        pairs[p]["pnl"] += t.get("profit_abs", 0)
        pairs[p]["count"] += 1
    
    print("\n## P&L by Pair\n")
    print("| Pair | Trades | P&L | Avg |")
    print("|------|--------|-----|-----|")
    for p, v in sorted(pairs.items(), key=lambda x: x[1]["pnl"], reverse=True):
        avg = v["pnl"] / max(v["count"], 1)
        emoji = "🟢" if v["pnl"] > 0 else "🔴"
        print(f"| {emoji} {p} | {v['count']} | ${v['pnl']:.2f} | ${avg:.2f} |")
except Exception as e:
    print(f"Trade error: {e}")

# HB status
print("\n## Hummingbot DEX Status\n")
try:
    hb = get("http://localhost:8000/bot-orchestration/status", HB)
    bots = hb.get("data", {})
    if not bots:
        print("❌ **ZERO active Hummingbot bots — DEX is non-functional**")
        print("> 13 of 14 scenarios architecturally require DEX.")
        print("> Without DEX, you are running at ~45% of designed system capacity.")
    else:
        for name, info in bots.items():
            print(f"- 🟢 **{name}**: {info}")
except Exception as e:
    print(f"HB error: {e}")
