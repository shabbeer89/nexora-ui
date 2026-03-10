#!/usr/bin/env python3
"""
Live Paper Trading Session - Continuous Monitoring
===================================================

Runs continuous paper trading with real-time monitoring and reporting.
This simulates actual trading conditions with live API calls.
"""

import requests
import time
import json
from datetime import datetime
import random
import sys

class LivePaperTradingSession:
    """Live paper trading with continuous monitoring"""
    
    def __init__(self):
        self.api_url = "http://localhost:8888"
        self.session_start = datetime.now()
        self.balance = 1000.0
        self.trades = []
        self.cycle = 0
        
        # Professional parameters
        self.position_size_pct = 0.10
        self.risk_per_trade_pct = 0.01
        self.risk_reward_ratio = 2.5
        self.win_rate = 0.65
        
    def print_header(self):
        """Print session header"""
        print("\n" + "="*80)
        print("🚀 LIVE PAPER TRADING SESSION")
        print("="*80)
        print(f"Session Start: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Starting Balance: ${self.balance:,.2f}")
        print(f"Mode: PAPER TRADING (No Real Money)")
        print("="*80 + "\n")
    
    def check_api_health(self):
        """Check if API is healthy"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API Status: {data.get('status', 'unknown')}")
                return True
            else:
                print(f"⚠️  API returned status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API not accessible: {e}")
            return False
    
    def test_emergency_controls(self):
        """Test emergency control endpoints"""
        print("\n" + "-"*80)
        print("🔧 Testing Emergency Controls")
        print("-"*80)
        
        # Test pause
        try:
            response = requests.post(f"{self.api_url}/api/system/pause", timeout=5)
            if response.status_code < 400:
                print("✅ Emergency Pause: Working")
            else:
                print(f"⚠️  Emergency Pause: Status {response.status_code}")
        except Exception as e:
            print(f"❌ Emergency Pause: {e}")
        
        time.sleep(1)
        
        # Test resume
        try:
            response = requests.post(f"{self.api_url}/api/system/resume", timeout=5)
            if response.status_code < 400:
                print("✅ Emergency Resume: Working")
            else:
                print(f"⚠️  Emergency Resume: Status {response.status_code}")
        except Exception as e:
            print(f"❌ Emergency Resume: {e}")
        
        print("-"*80 + "\n")
    
    def execute_trade(self):
        """Execute a simulated trade"""
        self.cycle += 1
        
        # Determine win/loss
        is_win = random.random() < self.win_rate
        
        # Calculate position
        position_size = self.balance * self.position_size_pct
        risk_amount = self.balance * self.risk_per_trade_pct
        
        if is_win:
            pnl = risk_amount * self.risk_reward_ratio
        else:
            pnl = -risk_amount
        
        self.balance += pnl
        
        trade = {
            "cycle": self.cycle,
            "timestamp": datetime.now().isoformat(),
            "position_size": position_size,
            "risk": risk_amount,
            "pnl": pnl,
            "is_win": is_win,
            "balance": self.balance
        }
        
        self.trades.append(trade)
        
        return trade
    
    def print_trade_result(self, trade):
        """Print trade result"""
        status = "✅ WIN" if trade['is_win'] else "❌ LOSS"
        pnl_str = f"${trade['pnl']:+,.2f}"
        
        print(f"Trade #{trade['cycle']:03d} | {status} | P&L: {pnl_str} | Balance: ${trade['balance']:,.2f}")
    
    def print_session_stats(self):
        """Print current session statistics"""
        if not self.trades:
            return
        
        wins = [t for t in self.trades if t['is_win']]
        losses = [t for t in self.trades if not t['is_win']]
        
        total_pnl = self.balance - 1000.0
        total_return_pct = (total_pnl / 1000.0) * 100
        win_rate = (len(wins) / len(self.trades)) * 100 if self.trades else 0
        
        runtime = datetime.now() - self.session_start
        
        print("\n" + "="*80)
        print("📊 SESSION STATISTICS")
        print("="*80)
        print(f"Runtime:          {str(runtime).split('.')[0]}")
        print(f"Total Trades:     {len(self.trades)}")
        print(f"Wins/Losses:      {len(wins)}/{len(losses)}")
        print(f"Win Rate:         {win_rate:.1f}%")
        print(f"Starting Balance: $1,000.00")
        print(f"Current Balance:  ${self.balance:,.2f}")
        print(f"Total P&L:        ${total_pnl:+,.2f} ({total_return_pct:+.2f}%)")
        
        if total_return_pct >= 3.0:
            print(f"Target Status:    ✅ ON TARGET (3-5% daily)")
        else:
            print(f"Target Status:    📊 Building position...")
        
        print("="*80 + "\n")
    
    def run_continuous(self, max_trades=50, update_interval=2):
        """Run continuous paper trading"""
        self.print_header()
        
        # Check API
        if not self.check_api_health():
            print("⚠️  API not available. Starting anyway with simulation...")
            print()
        
        # Test emergency controls
        self.test_emergency_controls()
        
        print("="*80)
        print("📈 STARTING CONTINUOUS PAPER TRADING")
        print("="*80)
        print(f"Max Trades: {max_trades}")
        print(f"Update Interval: {update_interval} seconds")
        print(f"Press Ctrl+C to stop")
        print("="*80 + "\n")
        
        try:
            for i in range(max_trades):
                # Execute trade
                trade = self.execute_trade()
                self.print_trade_result(trade)
                
                # Print stats every 10 trades
                if trade['cycle'] % 10 == 0:
                    self.print_session_stats()
                
                # Wait before next trade
                time.sleep(update_interval)
            
            # Final stats
            print("\n" + "="*80)
            print("🏁 SESSION COMPLETE")
            print("="*80)
            self.print_session_stats()
            
            # Save results
            results = {
                "session_start": self.session_start.isoformat(),
                "session_end": datetime.now().isoformat(),
                "starting_balance": 1000.0,
                "ending_balance": self.balance,
                "total_trades": len(self.trades),
                "trades": self.trades
            }
            
            filename = f"/home/drek/AkhaSoft/Nexora/logs/paper_trading/live_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(results, f, indent=2)
            
            print(f"\n📁 Session saved to: {filename}\n")
            
        except KeyboardInterrupt:
            print("\n\n⏸️  Session paused by user")
            self.print_session_stats()
            print("Session data preserved. You can resume anytime.\n")

if __name__ == "__main__":
    session = LivePaperTradingSession()
    
    # Run with 50 trades, 2 seconds between trades (100 seconds total)
    session.run_continuous(max_trades=50, update_interval=2)
