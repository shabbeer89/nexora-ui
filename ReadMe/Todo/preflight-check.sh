#!/bin/bash

# ============================================================================
# Nexora Bot System - Pre-flight Check
# ============================================================================
# Run this before starting services to verify environment is ready

BASE_DIR=$(cd "$(dirname "$0")" && pwd)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   🔍 Nexora Pre-flight Check                  ${NC}"
echo -e "${BLUE}==================================================${NC}\n"

ERRORS=0
WARNINGS=0

# Check 1: Base directory exists
echo -n "Checking base directory... "
if [ -d "$BASE_DIR" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
    ((ERRORS++))
fi

# Check 2: Required commands
echo -n "Checking lsof... "
if command -v lsof &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌ Not installed${NC}"
    ((ERRORS++))
fi

echo -n "Checking node... "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ $(node --version)${NC}"
else
    echo -e "${RED}❌ Not installed${NC}"
    ((ERRORS++))
fi

echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ $(npm --version)${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed${NC}"
    ((WARNINGS++))
fi

echo -n "Checking pnpm... "
if command -v pnpm &> /dev/null; then
    echo -e "${GREEN}✅ $(pnpm --version)${NC}"
else
    echo -e "${RED}❌ Not installed (required for Gateway)${NC}"
    ((ERRORS++))
fi

echo -n "Checking python3... "
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ $(python3 --version)${NC}"
else
    echo -e "${RED}❌ Not installed${NC}"
    ((ERRORS++))
fi

echo -n "Checking docker... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ $(docker --version | cut -d' ' -f3 | tr -d ',')${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed (needed for Hummingbot API)${NC}"
    ((WARNINGS++))
fi

echo -n "Checking make... "
if command -v make &> /dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed (needed for Hummingbot API)${NC}"
    ((WARNINGS++))
fi

echo ""

# Check 3: Directory structure
echo -e "${BLUE}Checking directory structure...${NC}"

check_dir() {
    local dir=$1
    local name=$2
    echo -n "  $name... "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Not found${NC}"
        ((ERRORS++))
    fi
}

check_dir "$BASE_DIR/hbot/gateway" "Gateway"
check_dir "$BASE_DIR/hbot/hummingbot-api" "Hummingbot API"
check_dir "$BASE_DIR/freqtrade" "FreqTrade"
check_dir "$BASE_DIR/nexora-bot" "Nexora Bot"
check_dir "$BASE_DIR/nexora-ui" "Nexora UI"

echo ""

# Check 4: Virtual environments
echo -e "${BLUE}Checking virtual environments...${NC}"

echo -n "  FreqTrade venv... "
if [ -d "$BASE_DIR/freqtrade/venv" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not found${NC}"
    ((WARNINGS++))
fi

echo -n "  Nexora Bot venv... "
if [ -d "$BASE_DIR/nexora-bot/venv" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not found${NC}"
    ((WARNINGS++))
fi

echo ""

# Check 5: Configuration files
echo -e "${BLUE}Checking configuration files...${NC}"

echo -n "  FreqTrade config... "
if [ -f "$BASE_DIR/freqtrade/user_data/config.json" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not found${NC}"
    ((WARNINGS++))
fi

echo -n "  Hummingbot setup... "
if [ -f "$BASE_DIR/hbot/hummingbot-api/.setup-complete" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not setup (run 'make setup' in hbot/hummingbot-api)${NC}"
    ((WARNINGS++))
fi

echo ""

# Check 6: Gateway build
echo -e "${BLUE}Checking Gateway build...${NC}"

echo -n "  Gateway dist/index.js... "
if [ -f "$BASE_DIR/hbot/gateway/dist/index.js" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Not built (will be built on first start)${NC}"
    ((WARNINGS++))
fi

echo -n "  Gateway node_modules... "
if [ -d "$BASE_DIR/hbot/gateway/node_modules" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo -e "    ${YELLOW}Run: cd $BASE_DIR/hbot/gateway && pnpm install${NC}"
    ((WARNINGS++))
fi

echo ""

# Check 7: Ports availability
echo -e "${BLUE}Checking port availability...${NC}"

check_port() {
    local port=$1
    local name=$2
    echo -n "  Port $port ($name)... "
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  In use (will be killed on start)${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ Available${NC}"
    fi
}

check_port 15888 "Gateway"
check_port 8000 "Hummingbot API"
check_port 8080 "FreqTrade"
check_port 8888 "Nexora Bot"
check_port 3000 "Nexora UI"

echo ""

# Check 8: Environment variables
echo -e "${BLUE}Checking environment variables...${NC}"

echo -n "  GATEWAY_PASSPHRASE... "
if [ -n "$GATEWAY_PASSPHRASE" ]; then
    echo -e "${GREEN}✅ Set${NC}"
else
    echo -e "${YELLOW}⚠️  Not set (will use default: nexora123)${NC}"
    ((WARNINGS++))
fi

echo ""

# Summary
echo -e "${BLUE}==================================================${NC}"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}   ✅ All checks passed! Ready to start.       ${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo -e "\n${GREEN}Run: ./start-nexora.sh${NC}\n"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}   ⚠️  $WARNINGS warning(s) - Review above       ${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo -e "\n${YELLOW}You can proceed, but some features may not work.${NC}"
    echo -e "${GREEN}Run: ./start-nexora.sh${NC}\n"
    exit 0
else
    echo -e "${RED}   ❌ $ERRORS error(s), $WARNINGS warning(s)      ${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo -e "\n${RED}Please fix errors before starting.${NC}\n"
    exit 1
fi
