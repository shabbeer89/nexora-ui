#!/usr/bin/env python3
"""04 — Technical Health Check Generator"""
import json, urllib.request, base64, datetime, subprocess

FT = base64.b64encode(b"freqtrader:SuperSecurePassword").decode()
HB = base64.b64encode(b"admin:admin123").decode()
ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S")
print(f"# 💻 Developer Technical Health Check\n> Generated: {ts} UTC\n")

# Phase 1: Services
print("## Phase 1: Infrastructure\n")
services = [
    ("nexora-api", "http://localhost:8888/api/scenarios/available", None),
    ("freqtrade", "http://localhost:8080/api/v1/version", FT),
    ("hummingbot-api", "http://localhost:8000/", HB),
    ("gateway", "http://localhost:15888/", None),
]
status = {}
for name, url, auth in services:
    try:
        req = urllib.request.Request(url)
        if auth: req.add_header("Authorization", f"Basic {auth}")
        urllib.request.urlopen(req, timeout=5)
        status[name] = "UP"
    except:
        status[name] = "DOWN"

print("```mermaid")
print("graph TB")
for i, (name, st) in enumerate(status.items()):
    c = "#4CAF50" if st == "UP" else "#f44336"
    print(f'    S{i}["{name}<br/>{"🟢 " + st if st == "UP" else "🔴 " + st}"]')
    print(f'    style S{i} fill:{c},color:#fff')
print("```\n")

# Phase 2: Resources
print("## Phase 2: Resources\n")
print("```")
try:
    r = subprocess.run(["free", "-h"], capture_output=True, text=True)
    for line in r.stdout.strip().split("\n")[:2]: print(line)
except: print("Could not read memory")
try:
    r = subprocess.run(["df", "-h", "/"], capture_output=True, text=True)
    for line in r.stdout.strip().split("\n"): print(line)
except: print("Could not read disk")
print("```\n")

# Phase 3: Connectivity
print("## Phase 3: Connectivity\n")
print("| Service | Port | HTTP Status | Result |")
print("|---------|------|-------------|--------|")
checks = [
    ("nexora-api", 8888, "http://localhost:8888/api/scenarios/available", None),
    ("freqtrade", 8080, "http://localhost:8080/api/v1/version", FT),
    ("hummingbot", 8000, "http://localhost:8000/", HB),
    ("gateway", 15888, "http://localhost:15888/", None),
]
for name, port, url, auth in checks:
    try:
        req = urllib.request.Request(url)
        if auth: req.add_header("Authorization", f"Basic {auth}")
        resp = urllib.request.urlopen(req, timeout=5)
        print(f"| {name} | {port} | {resp.getcode()} | ✅ |")
    except Exception as e:
        print(f"| {name} | {port} | Error | ❌ |")

# Phase 4: Logs
print("\n## Phase 4: Recent Errors\n")
print("```")
try:
    r = subprocess.run(["grep", "-i", "error\|exception\|traceback",
                       "/root/Nexora/logs/nexora-api.log"],
                      capture_output=True, text=True)
    lines = r.stdout.strip().split("\n")[-10:]
    for l in lines:
        if l.strip(): print(l[:120])
    if not any(l.strip() for l in lines): print("No recent errors")
except:
    print("Could not read logs")
print("```")
