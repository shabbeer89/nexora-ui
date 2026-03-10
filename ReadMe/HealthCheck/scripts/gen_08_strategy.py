#!/usr/bin/env python3
"""08 — Strategy Health & Risk Assessment Generator"""
import json, urllib.request, base64, datetime

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()

def get(url, auth=None):
    req = urllib.request.Request(url)
    if auth: req.add_header("Authorization", f"Basic {auth}")
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 🛡 Strategy Health & Risk Assessment\n> Generated: {ts} UTC\n")

# Current strategy
try:
    cfg = get("http://localhost:8080/api/v1/show_config", FT)
    mode = "⚠️ PAPER" if cfg.get("dry_run") else "🟢 LIVE"
    print("## Current Strategy\n")
    print(f"- **Strategy**: `{cfg.get('strategy')}`")
    print(f"- **Mode**: {mode}")
    print(f"- **Timeframe**: `{cfg.get('timeframe')}`")
    sl = cfg.get("stoploss")
    print(f"- **Stoploss**: `{sl*100:.1f}%`" if sl else "- ⚠️ **Stoploss**: NOT SET")
    print(f"- **Trailing Stop**: `{cfg.get('trailing_stop', False)}`")
    print(f"- **Max Open Trades**: `{cfg.get('max_open_trades', 'Unlimited')}`")
except Exception as e:
    print(f"Config error: {e}")

# Kill/Keep analysis
print("\n## Kill/Keep/Adjust Analysis\n")
try:
    d = get("http://localhost:8080/api/v1/profit", FT)
    pf = d.get("profit_factor", 0); wr = d.get("winrate", 0)
    sh = d.get("sharpe", 0); dd = d.get("max_drawdown", 0)
    exp = d.get("expectancy", 0)

    def decide(val, keep, adj):
        if keep: return "🟢 KEEP"
        elif adj: return "🟡 ADJUST"
        else: return "🔴 KILL"

    metrics = [
        ("Profit Factor", f"{pf:.2f}", "> 1.3", "1.0-1.3", "< 1.0", decide(pf, pf > 1.3, pf > 1.0)),
        ("Win Rate", f"{wr*100:.1f}%", "> 60%", "50-60%", "< 50%", decide(wr, wr > 0.6, wr > 0.5)),
        ("Sharpe", f"{sh:.2f}", "> 1.0", "0-1.0", "< 0", decide(sh, sh > 1.0, sh > 0)),
        ("Max DD", f"{dd*100:.2f}%", "< 5%", "5-10%", "> 10%", decide(dd, dd < 0.05, dd < 0.1)),
        ("Expectancy", f"${exp:.4f}", "> $0.30", "$0-$0.30", "< $0", decide(exp, exp > 0.3, exp > 0)),
    ]

    print("| Metric | Value | Keep 🟢 | Adjust 🟡 | Kill 🔴 | Decision |")
    print("|--------|-------|---------|-----------|---------|----------|")
    for m in metrics:
        print(f"| {m[0]} | {m[1]} | {m[2]} | {m[3]} | {m[4]} | {m[5]} |")

    kills = sum(1 for m in metrics if "KILL" in m[5])
    adjusts = sum(1 for m in metrics if "ADJUST" in m[5])
    keeps = sum(1 for m in metrics if "KEEP" in m[5])

    # Decision flow mermaid
    print("\n### Decision Flow\n")
    print("```mermaid")
    print("graph TD")
    for i, m in enumerate(metrics):
        color = "#4CAF50" if "KEEP" in m[5] else "#FF9800" if "ADJUST" in m[5] else "#f44336"
        print(f'    M{i}["{m[0]}: {m[1]}<br/>{m[5]}"]')
        print(f'    style M{i} fill:{color},color:#fff')

    if kills >= 3:
        print(f'    VERDICT["🔴 KILL STRATEGY"]')
        print(f'    style VERDICT fill:#f44336,color:#fff')
    elif kills >= 1:
        print(f'    VERDICT["🟡 ADJUST — Reduce size 50%"]')
        print(f'    style VERDICT fill:#FF9800,color:#fff')
    else:
        print(f'    VERDICT["🟢 KEEP RUNNING"]')
        print(f'    style VERDICT fill:#4CAF50,color:#fff')

    for i in range(len(metrics)):
        print(f'    M{i} --> VERDICT')
    print("```\n")

    if kills >= 3: print("### 🔴 OVERALL: **KILL** — 3+ failing metrics")
    elif kills >= 1: print("### 🟡 OVERALL: **ADJUST** — Reduce position size 50%")
    else: print("### 🟢 OVERALL: **KEEP** — Strategy performing well")
except Exception as e:
    print(f"Profit error: {e}")

# Risk check
print("\n## Risk Check\n")
try:
    cfg = get("http://localhost:8080/api/v1/show_config", FT)
    print("| Check | Value | Pass? |")
    print("|-------|-------|-------|")
    sl = cfg.get("stoploss")
    sl_ok = sl is not None and sl > -0.5
    print(f"| Stoploss | {f'{sl*100:.1f}%' if sl else 'NOT SET'} | {'✅' if sl_ok else '❌'} |")
    print(f"| Trailing Stop | {cfg.get('trailing_stop', False)} | {'✅' if cfg.get('trailing_stop') else '⚠️'} |")
    mot = cfg.get("max_open_trades")
    print(f"| Max Open Trades | {mot} | {'✅' if mot and mot > 0 else '⚠️'} |")
    print(f"| Mode | {'PAPER' if cfg.get('dry_run') else 'LIVE'} | {'⚠️ Paper' if cfg.get('dry_run') else '🟢'} |")

    # Position heat
    trades = get("http://localhost:8080/api/v1/status", FT)
    total_stake = sum(t.get("stake_amount", 0) for t in trades)
    bal = get("http://localhost:8080/api/v1/balance", FT)
    total_bal = bal.get("total", 1)
    heat = (total_stake / total_bal * 100) if total_bal > 0 else 0
    emoji = "🟢" if heat < 50 else "🟡" if heat < 80 else "🔴"
    print(f"\n**Position Heat**: {emoji} {heat:.1f}% (${total_stake:.0f} / ${total_bal:.0f})")
except Exception as e:
    print(f"Risk error: {e}")

# Available strategies
print("\n## Available Strategies\n")
import subprocess
try:
    r = subprocess.run(["ls", "/root/Nexora/freqtrade/user_data/strategies/"],
                      capture_output=True, text=True)
    strats = [s.strip() for s in r.stdout.split("\n") if s.endswith(".py") and "__" not in s]
    print(f"**{len(strats)}** strategies available:\n")
    for s in sorted(strats):
        print(f"- `{s}`")
except:
    print("Could not list strategies")
