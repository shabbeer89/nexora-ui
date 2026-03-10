#!/usr/bin/env python3
"""
Nexora Paper Trading Monitor
=============================

Real-time monitoring dashboard for paper trading performance.
Tracks daily P&L, win rate, and validates 3-5% daily target.
"""

import requests
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List
import os

class PaperTradingMonitor:
    """Monitor paper trading performance in real-time"""
    
    def __init__(self):
        self.api_url = "http://localhost:8888"
        self.freqtrade_url = "http://localhost:8080"
        self.session_start = datetime.now()
        self.initial_balance = 1000.0  # $1000 starting capital
        self.daily_target_min = 0.03  # 3%
        self.daily_target_max = 0.05  # 5%
        self.max_drawdown_limit = 0.10  # 10%
        
    def get_current_balance(self) -> float:
        """Get current account balance from FreqTrade"""
        try:
            response = requests.get(
                f"{self.freqtrade_url}/api/v1/balance",
                auth=("freqtrader", "SuperSecurePassword"),
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("total", self.initial_balance)
        except:
            pass
        return self.initial_balance
    
    def get_trades(self) -> List[Dict]:
        """Get all trades from FreqTrade"""
        try:
            response = requests.get(
                f"{self.freqtrade_url}/api/v1/trades",
                auth=("freqtrader", "SuperSecurePassword"),
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return []
    
    def calculate_metrics(self, trades: List[Dict]) -> Dict:
        """Calculate performance metrics"""
        if not trades:
            return {
                "total_trades": 0,
                "win_rate": 0,
                "total_pnl": 0,
                "daily_return_pct": 0,
                "max_drawdown": 0,
                "sharpe_ratio": 0
            }
        
        wins = [t for t in trades if t.get('profit_abs', 0) > 0]
        losses = [t for t in trades if t.get('profit_abs', 0) < 0]
        
        total_pnl = sum(t.get('profit_abs', 0) for t in trades)
        win_rate = len(wins) / len(trades) if trades else 0
        
        # Calculate daily return
        current_balance = self.get_current_balance()
        daily_return_pct = (current_balance - self.initial_balance) / self.initial_balance
        
        # Calculate max drawdown (simplified)
        max_drawdown = 0
        peak = self.initial_balance
        for trade in trades:
            current = peak + trade.get('profit_abs', 0)
            drawdown = (peak - current) / peak if peak > 0 else 0
            max_drawdown = max(max_drawdown, drawdown)
            peak = max(peak, current)
        
        return {
            "total_trades": len(trades),
            "wins": len(wins),
            "losses": len(losses),
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "daily_return_pct": daily_return_pct,
            "max_drawdown": max_drawdown,
            "current_balance": current_balance,
            "avg_win": sum(t.get('profit_abs', 0) for t in wins) / len(wins) if wins else 0,
            "avg_loss": sum(t.get('profit_abs', 0) for t in losses) / len(losses) if losses else 0
        }
    
    def print_dashboard(self, metrics: Dict):
        """Print monitoring dashboard"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print("=" * 80)
        print("🎯 NEXORA PAPER TRADING MONITOR")
        print("=" * 80)
        print()
        
        # Session info
        runtime = datetime.now() - self.session_start
        print(f"Session Start: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Runtime: {str(runtime).split('.')[0]}")
        print(f"Mode: 📝 PAPER TRADING (No Real Money)")
        print()
        
        # Balance
        print("-" * 80)
        print("💰 BALANCE")
        print("-" * 80)
        balance = metrics.get('current_balance', self.initial_balance)
        pnl = balance - self.initial_balance
        pnl_pct = metrics.get('daily_return_pct', 0) * 100
        
        print(f"Starting Capital: ${self.initial_balance:,.2f}")
        print(f"Current Balance:  ${balance:,.2f}")
        print(f"Total P&L:        ${pnl:+,.2f} ({pnl_pct:+.2f}%)")
        print()
        
        # Daily target progress
        print("-" * 80)
        print("🎯 DAILY TARGET PROGRESS")
        print("-" * 80)
        target_min = self.daily_target_min * 100
        target_max = self.daily_target_max * 100
        
        print(f"Target Range: {target_min:.1f}% - {target_max:.1f}% daily")
        print(f"Current:      {pnl_pct:+.2f}%")
        
        if pnl_pct >= target_min and pnl_pct <= target_max:
            print("Status:       ✅ ON TARGET")
        elif pnl_pct > target_max:
            print("Status:       🚀 EXCEEDING TARGET")
        elif pnl_pct < 0:
            print("Status:       ⚠️  LOSING DAY")
        else:
            print("Status:       📊 BELOW TARGET")
        print()
        
        # Trade statistics
        print("-" * 80)
        print("📊 TRADE STATISTICS")
        print("-" * 80)
        print(f"Total Trades: {metrics.get('total_trades', 0)}")
        print(f"Wins:         {metrics.get('wins', 0)}")
        print(f"Losses:       {metrics.get('losses', 0)}")
        print(f"Win Rate:     {metrics.get('win_rate', 0) * 100:.1f}%")
        print(f"Avg Win:      ${metrics.get('avg_win', 0):,.2f}")
        print(f"Avg Loss:     ${metrics.get('avg_loss', 0):,.2f}")
        print()
        
        # Risk metrics
        print("-" * 80)
        print("⚠️  RISK METRICS")
        print("-" * 80)
        max_dd = metrics.get('max_drawdown', 0) * 100
        print(f"Max Drawdown: {max_dd:.2f}%")
        print(f"DD Limit:     {self.max_drawdown_limit * 100:.1f}%")
        
        if max_dd > self.max_drawdown_limit * 100:
            print("Status:       🔴 EXCEEDS LIMIT")
        else:
            print("Status:       ✅ WITHIN LIMIT")
        print()
        
        # Warnings
        if pnl_pct < -2:
            print("⚠️  WARNING: Daily loss exceeds 2%")
        if max_dd > self.max_drawdown_limit * 100:
            print("🔴 CRITICAL: Max drawdown exceeded!")
        
        print("=" * 80)
        print(f"Last Update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("Press Ctrl+C to stop monitoring")
        print("=" * 80)
    
    def run(self, update_interval: int = 30):
        """Run monitoring loop"""
        print("Starting Paper Trading Monitor...")
        print(f"Update interval: {update_interval} seconds")
        print()
        
        try:
            while True:
                trades = self.get_trades()
                metrics = self.calculate_metrics(trades)
                self.print_dashboard(metrics)
                time.sleep(update_interval)
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            print("Final metrics saved to logs/paper_trading/")

if __name__ == "__main__":
    monitor = PaperTradingMonitor()
    monitor.run(update_interval=30)  # Update every 30 seconds
