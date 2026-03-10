#!/bin/bash
################################################################################
# Quick Paper Trading Status Check
################################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}"
echo "================================================================================"
echo "📊 NEXORA PAPER TRADING - QUICK STATUS"
echo "================================================================================"
echo -e "${NC}"

# Check if services are running
echo -e "${YELLOW}🔍 Checking Services...${NC}"
echo ""

# Nexora API
if curl -s http://localhost:8888/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nexora API:${NC}        http://localhost:8888 (Running)"
else
    echo -e "${YELLOW}⚠️  Nexora API:${NC}        http://localhost:8888 (Not responding)"
fi

# FreqTrade
if curl -s http://localhost:8080/api/v1/ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FreqTrade:${NC}         http://localhost:8080 (Running)"
else
    echo -e "${YELLOW}⚠️  FreqTrade:${NC}         http://localhost:8080 (Not responding)"
fi

# Nexora UI
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nexora UI:${NC}         http://localhost:3000 (Running)"
else
    echo -e "${YELLOW}⚠️  Nexora UI:${NC}         http://localhost:3000 (Not responding)"
fi

echo ""
echo -e "${CYAN}${BOLD}📈 Access Points:${NC}"
echo -e "  ${CYAN}Nexora Dashboard:${NC}  http://localhost:3000"
echo -e "  ${CYAN}FreqTrade UI:${NC}      http://localhost:8080"
echo -e "  ${CYAN}API Health:${NC}        http://localhost:8888/health"

echo ""
echo -e "${CYAN}${BOLD}📊 Quick Stats:${NC}"

# Try to get FreqTrade stats
if curl -s http://localhost:8080/api/v1/profit > /dev/null 2>&1; then
    PROFIT_DATA=$(curl -s http://localhost:8080/api/v1/profit)
    
    # Extract key metrics (requires jq, but we'll handle it gracefully)
    if command -v jq &> /dev/null; then
        TOTAL_PROFIT=$(echo "$PROFIT_DATA" | jq -r '.profit_all_coin // "N/A"')
        TRADE_COUNT=$(echo "$PROFIT_DATA" | jq -r '.trade_count // "N/A"')
        WIN_RATE=$(echo "$PROFIT_DATA" | jq -r '.winning_trades // 0')
        TOTAL_TRADES=$(echo "$PROFIT_DATA" | jq -r '.trade_count // 1')
        
        if [ "$TOTAL_TRADES" != "N/A" ] && [ "$TOTAL_TRADES" -gt 0 ]; then
            WIN_RATE_PCT=$(awk "BEGIN {printf \"%.1f\", ($WIN_RATE/$TOTAL_TRADES)*100}")
        else
            WIN_RATE_PCT="N/A"
        fi
        
        echo -e "  ${GREEN}Total Profit:${NC}      $${TOTAL_PROFIT}"
        echo -e "  ${GREEN}Total Trades:${NC}      ${TRADE_COUNT}"
        echo -e "  ${GREEN}Win Rate:${NC}          ${WIN_RATE_PCT}%"
    else
        echo -e "  ${YELLOW}Install 'jq' for detailed stats: sudo apt install jq${NC}"
    fi
fi

echo ""
echo -e "${CYAN}${BOLD}🔧 Monitoring Commands:${NC}"
echo -e "  ${CYAN}Terminal Dashboard:${NC}    python3 /home/drek/AkhaSoft/Nexora/monitor_paper_trading.py"
echo -e "  ${CYAN}Automated Monitor:${NC}     python3 /home/drek/AkhaSoft/Nexora/automated_monitoring.py"
echo -e "  ${CYAN}View Logs:${NC}             tail -f /home/drek/AkhaSoft/Nexora/logs/paper_trading/*.log"

echo ""
echo "================================================================================"
