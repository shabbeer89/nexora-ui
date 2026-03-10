#!/usr/bin/env python3
"""
Automated Monitoring and Alerts System for Nexora
==================================================

This script continuously monitors the Nexora trading system and sends
alerts when important events occur or thresholds are breached.

Features:
- Real-time performance monitoring
- Alert on profit/loss thresholds
- System health checks
- Daily performance summaries
- Emergency notifications

Author: Nexora System
Version: 1.0.0
"""

import os
import sys
import time
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuration
API_URL = "http://localhost:8888"
FREQTRADE_URL = "http://localhost:8080"
CHECK_INTERVAL = 60  # seconds (check every minute)
LOG_DIR = "/home/drek/AkhaSoft/Nexora/logs/monitoring"

# Alert Thresholds
DAILY_PROFIT_TARGET = 0.03  # 3% minimum
DAILY_PROFIT_MAX = 0.10     # 10% maximum (investigate if exceeded)
MAX_DRAWDOWN = 0.02         # 2% max drawdown
MIN_WIN_RATE = 0.55         # 55% minimum win rate
MAX_CONSECUTIVE_LOSSES = 3  # Alert after 3 consecutive losses

# Alert Channels (configure as needed)
ENABLE_CONSOLE_ALERTS = True
ENABLE_FILE_ALERTS = True
ENABLE_EMAIL_ALERTS = False  # Set to True and configure SMTP settings
ENABLE_TELEGRAM_ALERTS = False  # Set to True and configure Telegram bot

# Email Configuration (if enabled)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-email@gmail.com"
SMTP_PASSWORD = "your-app-password"
ALERT_EMAIL = "your-alert-email@gmail.com"

# Telegram Configuration (if enabled)
TELEGRAM_BOT_TOKEN = "your-bot-token"
TELEGRAM_CHAT_ID = "your-chat-id"

# Colors for console output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class NexoraMonitor:
    """Main monitoring class for Nexora system"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.alerts_sent = []
        self.last_balance = None
        self.consecutive_losses = 0
        self.daily_stats = {
            'trades': 0,
            'wins': 0,
            'losses': 0,
            'total_pnl': 0.0,
            'starting_balance': None
        }
        
        # Create log directory
        os.makedirs(LOG_DIR, exist_ok=True)
        
        # Initialize alert log
        self.alert_log_file = os.path.join(
            LOG_DIR,
            f"alerts_{datetime.now().strftime('%Y%m%d')}.log"
        )
    
    def log_alert(self, level: str, message: str):
        """Log alert to file and console"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_message = f"[{timestamp}] [{level}] {message}"
        
        # Console output
        if ENABLE_CONSOLE_ALERTS:
            if level == "CRITICAL":
                print(f"{Colors.RED}{Colors.BOLD}{log_message}{Colors.RESET}")
            elif level == "WARNING":
                print(f"{Colors.YELLOW}{log_message}{Colors.RESET}")
            elif level == "INFO":
                print(f"{Colors.GREEN}{log_message}{Colors.RESET}")
            else:
                print(log_message)
        
        # File output
        if ENABLE_FILE_ALERTS:
            with open(self.alert_log_file, 'a') as f:
                f.write(log_message + '\n')
        
        # Email alert (for CRITICAL and WARNING)
        if ENABLE_EMAIL_ALERTS and level in ["CRITICAL", "WARNING"]:
            self.send_email_alert(level, message)
        
        # Telegram alert (for CRITICAL and WARNING)
        if ENABLE_TELEGRAM_ALERTS and level in ["CRITICAL", "WARNING"]:
            self.send_telegram_alert(level, message)
        
        # Track alerts
        self.alerts_sent.append({
            'timestamp': timestamp,
            'level': level,
            'message': message
        })
    
    def send_email_alert(self, level: str, message: str):
        """Send email alert"""
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USERNAME
            msg['To'] = ALERT_EMAIL
            msg['Subject'] = f"Nexora Alert [{level}]: Trading System Notification"
            
            body = f"""
Nexora Trading System Alert
===========================

Level: {level}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Message:
{message}

---
This is an automated alert from your Nexora trading system.
"""
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            print(f"Failed to send email alert: {e}")
    
    def send_telegram_alert(self, level: str, message: str):
        """Send Telegram alert"""
        try:
            emoji = "🔴" if level == "CRITICAL" else "⚠️"
            text = f"{emoji} *Nexora Alert [{level}]*\n\n{message}"
            
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            data = {
                'chat_id': TELEGRAM_CHAT_ID,
                'text': text,
                'parse_mode': 'Markdown'
            }
            requests.post(url, data=data, timeout=10)
            
        except Exception as e:
            print(f"Failed to send Telegram alert: {e}")
    
    def check_api_health(self) -> bool:
        """Check if Nexora API is healthy"""
        try:
            response = requests.get(f"{API_URL}/health", timeout=5)
            if response.status_code == 200:
                return True
            else:
                self.log_alert("CRITICAL", f"API health check failed: Status {response.status_code}")
                return False
        except Exception as e:
            self.log_alert("CRITICAL", f"API is unreachable: {e}")
            return False
    
    def check_freqtrade_health(self) -> bool:
        """Check if FreqTrade is running"""
        try:
            response = requests.get(f"{FREQTRADE_URL}/api/v1/ping", timeout=5)
            if response.status_code == 200:
                return True
            else:
                self.log_alert("CRITICAL", f"FreqTrade health check failed: Status {response.status_code}")
                return False
        except Exception as e:
            self.log_alert("CRITICAL", f"FreqTrade is unreachable: {e}")
            return False
    
    def get_current_stats(self) -> Optional[Dict]:
        """Get current trading statistics"""
        try:
            # Get balance
            balance_response = requests.get(f"{FREQTRADE_URL}/api/v1/balance", timeout=5)
            if balance_response.status_code != 200:
                return None
            
            balance_data = balance_response.json()
            current_balance = balance_data.get('total', 0)
            
            # Get open trades
            trades_response = requests.get(f"{FREQTRADE_URL}/api/v1/status", timeout=5)
            open_trades = []
            if trades_response.status_code == 200:
                open_trades = trades_response.json()
            
            # Get profit stats
            profit_response = requests.get(f"{FREQTRADE_URL}/api/v1/profit", timeout=5)
            profit_data = {}
            if profit_response.status_code == 200:
                profit_data = profit_response.json()
            
            return {
                'balance': current_balance,
                'open_trades': len(open_trades),
                'profit_data': profit_data
            }
            
        except Exception as e:
            self.log_alert("WARNING", f"Failed to get current stats: {e}")
            return None
    
    def check_performance_thresholds(self, stats: Dict):
        """Check if performance metrics are within acceptable ranges"""
        if not stats:
            return
        
        profit_data = stats.get('profit_data', {})
        
        # Check daily profit
        profit_today_pct = profit_data.get('profit_today_pct', 0)
        if profit_today_pct < DAILY_PROFIT_TARGET:
            self.log_alert(
                "WARNING",
                f"Daily profit ({profit_today_pct:.2f}%) below target ({DAILY_PROFIT_TARGET*100:.0f}%)"
            )
        elif profit_today_pct > DAILY_PROFIT_MAX:
            self.log_alert(
                "WARNING",
                f"Daily profit ({profit_today_pct:.2f}%) exceeds maximum ({DAILY_PROFIT_MAX*100:.0f}%). "
                "Investigate for anomalies."
            )
        
        # Check drawdown
        drawdown_pct = abs(profit_data.get('max_drawdown_pct', 0))
        if drawdown_pct > MAX_DRAWDOWN:
            self.log_alert(
                "CRITICAL",
                f"Drawdown ({drawdown_pct:.2f}%) exceeds maximum ({MAX_DRAWDOWN*100:.0f}%). "
                "Consider pausing trading!"
            )
        
        # Check win rate
        winning_trades = profit_data.get('winning_trades', 0)
        losing_trades = profit_data.get('losing_trades', 0)
        total_trades = winning_trades + losing_trades
        
        if total_trades >= 10:  # Only check after 10+ trades
            win_rate = winning_trades / total_trades if total_trades > 0 else 0
            if win_rate < MIN_WIN_RATE:
                self.log_alert(
                    "WARNING",
                    f"Win rate ({win_rate:.1%}) below minimum ({MIN_WIN_RATE:.1%})"
                )
    
    def check_consecutive_losses(self, stats: Dict):
        """Check for consecutive losses"""
        # This would require tracking trade history
        # For now, we'll implement a simplified version
        if stats and stats.get('profit_data', {}).get('profit_today', 0) < 0:
            self.consecutive_losses += 1
            if self.consecutive_losses >= MAX_CONSECUTIVE_LOSSES:
                self.log_alert(
                    "CRITICAL",
                    f"Detected {self.consecutive_losses} consecutive losses. "
                    "Review strategy immediately!"
                )
        else:
            self.consecutive_losses = 0
    
    def generate_daily_summary(self):
        """Generate and send daily performance summary"""
        stats = self.get_current_stats()
        if not stats:
            return
        
        profit_data = stats.get('profit_data', {})
        
        summary = f"""
================================================================================
📊 NEXORA DAILY PERFORMANCE SUMMARY
================================================================================
Date: {datetime.now().strftime('%Y-%m-%d')}

💰 PROFIT & LOSS
--------------------------------------------------------------------------------
Today's Profit:     ${profit_data.get('profit_today', 0):.2f} ({profit_data.get('profit_today_pct', 0):.2f}%)
Total Profit:       ${profit_data.get('profit_all_coin', 0):.2f}
Current Balance:    ${stats.get('balance', 0):.2f}

📈 TRADING STATISTICS
--------------------------------------------------------------------------------
Total Trades:       {profit_data.get('trade_count', 0)}
Winning Trades:     {profit_data.get('winning_trades', 0)}
Losing Trades:      {profit_data.get('losing_trades', 0)}
Win Rate:           {(profit_data.get('winning_trades', 0) / max(profit_data.get('trade_count', 1), 1)):.1%}

📊 RISK METRICS
--------------------------------------------------------------------------------
Max Drawdown:       {profit_data.get('max_drawdown_pct', 0):.2f}%
Open Trades:        {stats.get('open_trades', 0)}

🎯 TARGET STATUS
--------------------------------------------------------------------------------
Daily Target:       3-5%
Status:             {'✅ ON TARGET' if DAILY_PROFIT_TARGET <= profit_data.get('profit_today_pct', 0)/100 <= DAILY_PROFIT_MAX else '❌ OFF TARGET'}

================================================================================
"""
        
        self.log_alert("INFO", summary)
    
    def run(self):
        """Main monitoring loop"""
        self.log_alert("INFO", "🚀 Nexora Monitoring System Started")
        self.log_alert("INFO", f"Check Interval: {CHECK_INTERVAL} seconds")
        self.log_alert("INFO", f"Alert Channels: Console={ENABLE_CONSOLE_ALERTS}, File={ENABLE_FILE_ALERTS}, Email={ENABLE_EMAIL_ALERTS}, Telegram={ENABLE_TELEGRAM_ALERTS}")
        
        last_daily_summary = datetime.now().date()
        
        try:
            while True:
                # Health checks
                api_healthy = self.check_api_health()
                freqtrade_healthy = self.check_freqtrade_health()
                
                if not api_healthy or not freqtrade_healthy:
                    self.log_alert("CRITICAL", "System health check failed! Immediate attention required!")
                
                # Get and check stats
                if api_healthy and freqtrade_healthy:
                    stats = self.get_current_stats()
                    if stats:
                        self.check_performance_thresholds(stats)
                        self.check_consecutive_losses(stats)
                
                # Daily summary (at midnight or on first run of new day)
                current_date = datetime.now().date()
                if current_date > last_daily_summary:
                    self.generate_daily_summary()
                    last_daily_summary = current_date
                
                # Wait for next check
                time.sleep(CHECK_INTERVAL)
                
        except KeyboardInterrupt:
            self.log_alert("INFO", "🛑 Monitoring system stopped by user")
            self.generate_daily_summary()  # Final summary
        except Exception as e:
            self.log_alert("CRITICAL", f"Monitoring system crashed: {e}")
            raise


def main():
    """Main entry point"""
    print(f"{Colors.CYAN}{Colors.BOLD}")
    print("=" * 80)
    print("🔍 NEXORA AUTOMATED MONITORING & ALERTS SYSTEM")
    print("=" * 80)
    print(f"{Colors.RESET}")
    print()
    print(f"{Colors.YELLOW}Configuration:{Colors.RESET}")
    print(f"  API URL:           {API_URL}")
    print(f"  FreqTrade URL:     {FREQTRADE_URL}")
    print(f"  Check Interval:    {CHECK_INTERVAL}s")
    print(f"  Console Alerts:    {'✅ Enabled' if ENABLE_CONSOLE_ALERTS else '❌ Disabled'}")
    print(f"  File Alerts:       {'✅ Enabled' if ENABLE_FILE_ALERTS else '❌ Disabled'}")
    print(f"  Email Alerts:      {'✅ Enabled' if ENABLE_EMAIL_ALERTS else '❌ Disabled'}")
    print(f"  Telegram Alerts:   {'✅ Enabled' if ENABLE_TELEGRAM_ALERTS else '❌ Disabled'}")
    print()
    print(f"{Colors.YELLOW}Alert Thresholds:{Colors.RESET}")
    print(f"  Daily Profit Target:       {DAILY_PROFIT_TARGET*100:.0f}%")
    print(f"  Max Drawdown:              {MAX_DRAWDOWN*100:.0f}%")
    print(f"  Min Win Rate:              {MIN_WIN_RATE*100:.0f}%")
    print(f"  Max Consecutive Losses:    {MAX_CONSECUTIVE_LOSSES}")
    print()
    print(f"{Colors.GREEN}Starting monitoring... Press Ctrl+C to stop{Colors.RESET}")
    print("=" * 80)
    print()
    
    monitor = NexoraMonitor()
    monitor.run()


if __name__ == "__main__":
    main()
