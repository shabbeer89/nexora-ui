#!/bin/bash
################################################################################
# Nexora Live Trading Shutdown Script
################################################################################
# This script gracefully stops all Nexora live trading components
#
# Author: Nexora System
# Version: 1.0.0
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
NEXORA_ROOT="/home/drek/AkhaSoft/Nexora"
PID_DIR="$NEXORA_ROOT/pids"
LOG_DIR="$NEXORA_ROOT/logs/live_trading"

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "================================================================================"
    echo "$1"
    echo "================================================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

stop_service() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
            
            if ! ps -p "$pid" > /dev/null 2>&1; then
                print_success "$name stopped"
                rm -f "$pid_file"
            else
                print_error "Failed to stop $name"
            fi
        else
            print_warning "$name was not running"
            rm -f "$pid_file"
        fi
    else
        print_warning "$name PID file not found"
    fi
}

print_header "🛑 NEXORA LIVE TRADING SHUTDOWN"

echo -e "${RED}${BOLD}Stopping all live trading services...${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to stop all live trading services? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    print_error "Shutdown cancelled by user"
    exit 1
fi

echo ""

# Stop services in reverse order
stop_service "Monitoring System" "$PID_DIR/monitoring.pid"
stop_service "Nexora UI" "$PID_DIR/nexora_ui.pid"
stop_service "FreqTrade" "$PID_DIR/freqtrade.pid"
stop_service "Nexora API" "$PID_DIR/nexora_api.pid"

# Also try to kill by process name (backup)
echo ""
print_warning "Cleaning up any remaining processes..."
pkill -f "automated_monitoring.py" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "freqtrade trade" 2>/dev/null || true
pkill -f "uvicorn src.api.main:app" 2>/dev/null || true

echo ""
print_header "✅ SHUTDOWN COMPLETE"

echo ""
echo -e "${GREEN}All services have been stopped.${NC}"
echo ""
echo -e "${YELLOW}Session logs saved in:${NC} $LOG_DIR"
echo ""
echo -e "${CYAN}To restart live trading:${NC} $NEXORA_ROOT/start_live_trading.sh"
echo -e "${CYAN}To start paper trading:${NC} $NEXORA_ROOT/start_paper_trading.sh"
echo ""

# Save shutdown info
cat >> "$NEXORA_ROOT/LIVE_TRADING_SESSION.txt" << EOF

Stopped: $(date)
================================================================================
EOF

exit 0
