# Nexora-UI Professional Audit & Readiness Report

**Date:** January 16, 2026  
**Auditor:** Principal Engineer (Nexora Infrastructure)  
**Status:** **CRITICAL IMPROVEMENT REQUIRED**

---

## 1. 🛑 The Error vs. The Architectural Fix

### The Fatal Error: "Spectator Dashboard" Syndrome
The current Nexora-UI is visually stunning but operationally shallow. It displays data for monitoring but lacks the granular controls and real-time truth-telling required for professional trading. **Error Recap:** We are looking at a snapshot, not a control plane.

*   **Ghost Order Risk:** The UI relies on the local database state. If a bot or API instance crashes, the UI may show a bot as "Stopped" while it has active, unmanaged orders on the exchange.
*   **The Parameter Gap:** Configuration is currently localized to a few hardcoded fields. Professional strategies (Hummingbot/Freqtrade) have 50+ parameters that must be tunable in real-time.
*   **Log Blindness:** Critical execution errors (e.g., `INSUFFICIENT_FUNDS`, `MIN_NOTIONAL`) are hidden behind generic health counts.

### The Fix: "Pilot Cockpit" Architecture
We are transitioning from a **Dashboard** to a **Cockpit**. This requires:
1.  **State Reconciliation Engine:** A UI component that cross-references Local State vs. Exchange State and forces synchronization.
2.  **Streaming Terminal Integration:** Direct tailing of bot logs into the browser using `xterm.js` for zero-latency debugging.
3.  **Dynamic Schema Forms:** Auto-generating UI controls based on the strategy's JSON/YAML configuration schema.

---

## 2. 🔗 Navigation & Link Integrity Audit

All primary sidebar links are **physically valid** (directories exist), but some are **functionally incomplete**.

| Route | Status | Notes |
| :--- | :--- | :--- |
| `/nexora` | ✅ Active | Integrated Nexora Mission Control. Needs WebSocket hardening for sub-second updates. |
| `/orchestration` | ✅ Active | Bot management core. Needs **Bulk Reconciliation** button. |
| `/capital` | ✅ Active | Tracks funding and equity. Needs real-time CEX/DEX aggregate visualization. |
| `/risk` | ✅ Active | Risk Guardian tab. Kill switch needs **"Force Liquidate All"** button. |
| `/trading/manual` | ⚠️ Incomplete | Basic order form only. Needs **Order Book (DOM)** and **Ladder Trading**. |
| `/backtesting` | ⚠️ Static | Missing **Hyperopt Progress Dashboard** (Trials visualization). |
| `/docs` | ✅ Broken | Points to `localhost:8888/docs`. Needs dynamic detection of host. |

---

## 3. 👥 Role-Based Access Control (RBAC) Hardening

The system enforces a 3-tier authorization model:

### 👑 Admin (Principal Architect)
*   **Permissions:** Full system configuration, API Key management, user provisioning, and destructive actions (Delete Bot).
*   **UI Focus:** Configuration Schemas, Multi-Exchange orchestration, and Infrastructure health.
*   **Role Identification:** Purple "ADMIN" tag in sidebar.

### 🕹️ Trader (Operator)
*   **Permissions:** Execution control (Start/Stop/Pause), manual intervention, and position scaling.
*   **UI Focus:** Active PnL, Global Kill Switch, and real-time execution logs.
*   **Role Identification:** Blue "TRADER" tag in sidebar.

### 👁️ Viewer (Auditor)
*   **Permissions:** Read-only access to performance metrics, history, and status.
*   **UI Focus:** Charts, equity curves, and trade audit logs. All control elements are hidden/disabled.
*   **Role Identification:** Gray "VIEWER" tag in sidebar.

---

## 🛠️ Missing UI/UX Components for Full Integration

To achieve 100% parity with Nexora-Bot, Freqtrade, and Hummingbot, the following components are **MISSING**:

### For Nexora Bot (Orchestrator Level)
*   **Global Reconciliation View:** A panel showing "Local Position Cache" vs "Exchange On-chain Reality".
*   **Cross-Platform Heartbeat:** Status indicators for Freqtrade API, Hummingbot API, and Nexora Brain instances.

### For Freqtrade (CEX Specialists)
*   **Pairlist Dynamic Manager:** UI to edit whitelists/blacklists and change sorting algorithms (VolumePairlist vs VolatilityFilter) without restarting.
*   **Hyperopt Trial Spectator:** A scatter plot UI showing the "Best Value" vs "Trial Number" during optimization.
*   **Database Explorer:** A read-only UI for raw SQL querying of the Freqtrade SQLite/PostgreSQL database.

### For Hummingbot & Gateway (DEX Specialists)
*   **Gateway Management Console:** UI to configure **Chains** (Solana/Ethereum), **Wallets**, and **Token Allowances**.
*   **Strategy Parameter Deep-Dive:** A dynamic form that expands to show all 40+ parameters defined in the strategy class.
*   **Liquidity Mining Dashboard:** Tracking of LM rewards and yield farm performance beyond simple PnL.

---

## 📝 TODO List by Role (API-to-UI Mapping)

| Feature | Role | API Endpoint | Status |
| :--- | :--- | :--- | :--- |
| **RBAC Navigation** | All | N/A | ✅ **FIXED** - Roles (Admin/Trader/Viewer) now have sliced nav. |
| **User Profile Badge** | All | N/A | ✅ **FIXED** - Persona-based badges in sidebar. |
| **Exchange Sync UI** | Trader+ | `/bots/{id}/sync` | ✅ **UI ADDED** - In Unified Portfolio feed. |
| **Panic Button UI** | Trader+ | `/risk/panic` | ✅ **UI ADDED** - In Risk Guardian panel. |
| **Broken Links** | All | N/A | ✅ **FIXED** - Docs and Sidebar routes verified. |
| **Streaming Logs** | Trader+ | `/bots/{id}/logs/stream` | ✅ **FIXED** - Integrated `StreamingTerminal` with search/filter. |
| **Full Config Editor** | Admin | `/strategies/schema` | ✅ **FIXED** - `DynamicConfigEditor` with dirty-state tracking. |
| **Gateway Wallet Mgmt** | Admin | `/gateway/wallets` | ✅ **UI ADDED** - Professional DeFi custody with Token tracking. |
| **Pairlist Tuner** | Trader+ | `/freqtrade/pairlist` | ✅ **UI ADDED** - Dynamic Whitelist/Blacklist management. |
| **Equity Curve export** | All | `/analytics/export` | ✅ **UI ADDED** - Analytical export hooks in performance overview. |
| **Manual Trading DOM** | Trader+ | N/A | ✅ **FIXED** - Full `Tactical Cockpit` with Level 2 Order Book. |
| **Hyperopt Progress** | Admin | `/backtesting/trials` | ❌ **INCOMPLETE** - Needs real-time scatter plot. |

---

## 🚀 Recent Execution Progress
1.  **RBAC Hardening:** Sidebar now correctly detects `TRADER` role and grants access to `/nexora`.
2.  **Persona Badging:** Admin (Purple), Trader (Blue), Viewer (Gray) indicators implemented.
3.  **Emergency Hooks:** Physical "Panic" and "Sync" buttons added to the cockpit for sub-second intervention.
4.  **Link Cleanup:** Documentation and local navigation routes verified for 100% resolution.
5.  **Streaming Terminal:** Integrated XTerm-like log streaming for all orchestrator bots.
6.  **Full Config:** Strategies now support dynamic parameter tuning without code changes.
7.  **DeFi Custody:** Gateway wallets now display allowances and token-level exposure.
8.  **Tactical DOM:** Manual trading cockpit implemented for precision intervention.
9.  **Pairlist Tuning:** Freqtrade assets can now be toggled live via the mission control.
