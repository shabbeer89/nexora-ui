# Emergency Controls - Verification Guide

**How to confirm each action was successful**

---

## 🔍 Verification Methods

### 1. Backend Logs (Primary)
Watch the Nexora backend logs in real-time:

```bash
# If running in terminal, just watch the output
cd /home/drek/AkhaSoft/Nexora/nexora-bot
./venv/bin/python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8888

# Or tail the log file if logging to file
tail -f logs/nexora-api.log
```

### 2. Process Status
Check process states:

```bash
# Watch process status in real-time
watch -n 1 'ps aux | grep -E "(freqtrade|hummingbot)" | grep -v grep'

# Or one-time check
ps aux | grep -E "(freqtrade|hummingbot)" | grep -v grep
```

### 3. UI Status Indicator
The status banner at the top of Emergency Controls page shows:
- 🟢 **RUNNING** - Normal operations
- 🟡 **PAUSED** - Trading halted
- 🔴 **SHUTDOWN** - System offline

### 4. UI Terminal Logs
Watch the terminal logs in the UI to see if trading activity continues.

---

## ✅ Verification for Each Control

### 1. Pause Trading

**Backend Logs:**
```
🛑 SYSTEM PAUSE REQUESTED
Discovered 2 FreqTrade, 1 Hummingbot processes
FreqTrade API pause failed: ..., falling back to process signals
✅ Paused process 96692
✅ Paused process 96693
✅ Paused process 95947
```

**Process Check:**
```bash
ps aux | grep freqtrade
# Look for STAT column = 'T' (stopped/paused)
# Example: root  96692  0.0  14.0  ... T    10:00  ...
```

**UI Verification:**
- Status banner turns **YELLOW** → "⏸ PAUSED - Trading halted"
- Terminal logs **stop updating**
- Response shows: `"paused_count": 3`

---

### 2. Resume Trading

**Backend Logs:**
```
▶️ SYSTEM RESUME REQUESTED
Discovered 2 FreqTrade, 1 Hummingbot processes
✅ Resumed process 96692
✅ Resumed process 96693
✅ Resumed process 95947
```

**Process Check:**
```bash
ps aux | grep freqtrade
# Look for STAT column = 'S' or 'Sl' (running)
# Example: root  96692  5.7  14.0  ... Sl   10:00  ...
```

**UI Verification:**
- Status banner turns **GREEN** → "● RUNNING - All systems operational"
- Terminal logs **resume updating**
- Response shows: `"resumed_count": 3`

---

### 3. Emergency Shutdown

**Backend Logs:**
```
🚨 EMERGENCY SHUTDOWN INITIATED
Discovered 2 FreqTrade, 1 Hummingbot processes
✅ All FreqTrade positions closed
✅ Hummingbot stopped
🔪 Terminating all trading processes...
✅ Terminated FreqTrade process 96692
✅ Terminated FreqTrade process 96693
✅ Terminated Hummingbot process 95947
```

**Process Check:**
```bash
ps aux | grep freqtrade
# Should return NOTHING (processes terminated)
```

**UI Verification:**
- Status banner turns **RED** → "⏹ SHUTDOWN - System offline"
- Terminal logs **completely stop**
- Response shows: `"terminated_count": 3`

---

### 4. Force Exit All

**Backend Logs:**
```
⚠️ FORCE EXIT ALL POSITIONS REQUESTED
✅ Closed 5 FreqTrade positions
✅ Closed Hummingbot positions
```

**Process Check:**
```bash
ps aux | grep freqtrade
# Processes still running (STAT = 'S' or 'Sl')
```

**UI Verification:**
- Status banner stays **GREEN** → "● RUNNING"
- Terminal logs **continue updating** (bots still running)
- Response shows: `"positions_closed": 5, "status": "running"`

**FreqTrade API Check:**
```bash
# Check open trades (should be 0)
curl http://localhost:8080/api/v1/status
```

---

### 5. Reload Configuration

**Backend Logs:**
```
🔄 CONFIG RELOAD REQUESTED
Discovered 2 FreqTrade, 1 Hummingbot processes
✅ Sent SIGHUP to FreqTrade PID 96692
✅ Sent SIGHUP to FreqTrade PID 96693
✅ Sent SIGHUP to Hummingbot PID 95947
```

**Process Check:**
```bash
ps aux | grep freqtrade
# Processes still running (no interruption)
```

**UI Verification:**
- Status banner stays **GREEN**
- Terminal logs **continue** (no downtime)
- Response shows: `"reloaded_count": 3`

**FreqTrade Logs:**
```bash
# Check FreqTrade logs for config reload message
tail -f /home/drek/AkhaSoft/Nexora/freqtrade/user_data/logs/freqtrade.log
# Look for: "Reloading configuration..."
```

---

### 6. System Restart

**Backend Logs:**
```
🔄 SYSTEM RESTART REQUESTED
Discovered 2 FreqTrade, 1 Hummingbot processes
✅ All positions closed before restart
✅ Terminated 3 processes
```

**Process Check:**
```bash
ps aux | grep freqtrade
# Should return NOTHING (all terminated)
```

**UI Verification:**
- Status banner turns **RED** → "⏹ SHUTDOWN"
- Terminal logs **stop**
- Response shows: `"terminated_count": 3, "note": "Manual restart required"`

---

## 📊 Quick Verification Commands

### Watch Everything in Real-Time

**Terminal 1 - Backend Logs:**
```bash
cd /home/drek/AkhaSoft/Nexora/nexora-bot
./venv/bin/python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8888
```

**Terminal 2 - Process Monitor:**
```bash
watch -n 1 'ps aux | grep -E "(freqtrade|hummingbot)" | grep -v grep | awk "{print \$2, \$8, \$11}"'
# Shows: PID, STAT, COMMAND
```

**Terminal 3 - FreqTrade Logs:**
```bash
tail -f /home/drek/AkhaSoft/Nexora/freqtrade/user_data/logs/freqtrade.log
```

**Terminal 4 - Hummingbot Logs:**
```bash
docker logs -f hummingbot-api
```

---

## 🎯 Expected Process States

| Action | Before STAT | After STAT | Processes Exist? |
|--------|-------------|------------|------------------|
| **Pause** | `S` (running) | `T` (stopped) | ✅ Yes |
| **Resume** | `T` (stopped) | `S` (running) | ✅ Yes |
| **Emergency Shutdown** | `S` (running) | N/A | ❌ No (terminated) |
| **Force Exit All** | `S` (running) | `S` (running) | ✅ Yes |
| **Reload Config** | `S` (running) | `S` (running) | ✅ Yes |
| **System Restart** | `S` (running) | N/A | ❌ No (terminated) |

---

## 🔍 Detailed Process State Codes

| STAT | Meaning |
|------|---------|
| `S` | Sleeping (interruptible) - Normal running state |
| `R` | Running or runnable |
| `T` | Stopped (SIGSTOP) - **PAUSED** |
| `Z` | Zombie (terminated but not reaped) |
| `Sl` | Sleeping + multi-threaded |
| `Ssl` | Sleeping + session leader + multi-threaded |

**Additional flags:**
- `+` = Foreground process group
- `<` = High priority
- `N` = Low priority
- `s` = Session leader

---

## 📝 Verification Checklist

After each action, verify:

- [ ] Backend logs show success messages
- [ ] Process state matches expected (use `ps aux`)
- [ ] UI status indicator shows correct state
- [ ] UI terminal logs behave as expected (stop/continue)
- [ ] API response shows correct counts

---

## 🚨 Troubleshooting

### Logs Don't Show Action
- Backend might not be restarted with new code
- Check: `curl http://localhost:8888/api/system/status`

### Process State Doesn't Change
- Permission issues (need sudo/root)
- Process already terminated
- Wrong PID

### UI Status Doesn't Update
- Refresh the page
- Check browser console for errors
- Verify backend is responding

---

**Pro Tip:** Keep the backend logs visible in a terminal while testing. All actions are logged with emojis for easy identification!
