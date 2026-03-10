#!/bin/bash
# Nexora Paper Trading Shutdown Script
# ======================================
# Stops all paper trading services gracefully

set -e

echo "🛑 Stopping Nexora Paper Trading System"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base directory
NEXORA_DIR="/home/drek/AkhaSoft/Nexora"
LOG_DIR="$NEXORA_DIR/logs/paper_trading"

# Function to stop service by PID
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $service_name (PID: $pid)..."
            kill $pid
            sleep 2
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo "Force stopping $service_name..."
                kill -9 $pid
            fi
            
            echo -e "${GREEN}✓${NC} $service_name stopped"
        else
            echo "$service_name is not running"
        fi
        rm -f "$pid_file"
    else
        echo "No PID file found for $service_name"
    fi
}

# Stop services in reverse order
stop_service "Nexora UI" "$LOG_DIR/nexora_ui.pid"
stop_service "Nexora API" "$LOG_DIR/nexora_api.pid"
stop_service "FreqTrade" "$LOG_DIR/freqtrade.pid"

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
echo "Logs preserved in: $LOG_DIR"
echo ""
