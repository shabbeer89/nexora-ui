#!/bin/bash

# ============================================================================
# Nexora Bot System - Unified Robust Stop Script (Ultra)
# ============================================================================

# Configuration
BASE_DIR=$(cd "$(dirname "$0")" && pwd)

# Ports to kill
PORTS=(8888 3000 8000 8080 8081 15888)
NAMES=("Nexora API" "Nexora UI" "Hummingbot API" "FreqBot" "FreqAI" "Gateway")

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detection: Find available Docker Compose command
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker help compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    fi
fi

echo -e "${RED}==================================================${NC}"
echo -e "${RED}   🛑 Nexora Bot System - Unified Stop         ${NC}"
echo -e "${RED}==================================================${NC}"
echo ""

# 1. Kill processes on known ports aggressively
echo -e "${BLUE}🔍 Phase 1: Port-based Termination (Aggressive)...${NC}"
for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${NAMES[$i]}
    
    if lsof -i:$PORT > /dev/null 2>&1 || ss -nlt | grep -q ":$PORT "; then
        echo -e "${YELLOW}Stopping $NAME (Port $PORT)...${NC}"
        # Use fuser if available for multi-process cleanup
        if command -v fuser > /dev/null 2>&1; then
            fuser -k -n tcp $PORT > /dev/null 2>&1 || true
        fi
        
        # Kill any remaining PIDs on this port
        PIDS=$(lsof -t -i:$PORT 2>/dev/null)
        for PID in $PIDS; do
            kill -9 $PID 2>/dev/null || true
        done
    else
        echo -e "ℹ️  $NAME (Port $PORT) is not running."
    fi
done
echo ""

# 2. Kill by process name patterns (covers Node/Next/Python)
echo -e "${BLUE}🔍 Phase 2: Pattern-based Termination...${NC}"
PATTERNS=(
    "python main.py"
    "uvicorn src.api.main:app"
    "freqtrade trade"
    "next-dev"
    "next-server"
    "pnpm start"
    "npm run dev"
    "node.*next"
    "node.*webpack"
)

for PATTERN in "${PATTERNS[@]}"; do
    if pgrep -f "$PATTERN" > /dev/null; then
        echo -e "${YELLOW}Killing processes matching '$PATTERN'...${NC}"
        pkill -9 -f "$PATTERN" 2>/dev/null || echo -e "${RED}  ⚠️  Failed to kill '$PATTERN' (permission denied?)${NC}"
    fi
done
echo ""

# 3. Container Management
echo -e "${BLUE}🔍 Phase 3: Container Management...${NC}"
if [ ! -z "$DOCKER_COMPOSE_CMD" ]; then
    echo -e "${YELLOW}Shutting down infrastructure containers...${NC}"
    cd "$BASE_DIR/hbot/hummingbot-api" && $DOCKER_COMPOSE_CMD down > /dev/null 2>&1 || true
    cd "$BASE_DIR/nexora-bot" && $DOCKER_COMPOSE_CMD down > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ Infrastructure containers stopped.${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping infrastructure shutdown (compose command not found)${NC}"
fi

if docker ps >/dev/null 2>&1 && docker ps | grep -q "hummingbot"; then
    echo -e "${YELLOW}Stopping standalone Hummingbot container...${NC}"
    docker stop hummingbot > /dev/null 2>&1
    echo -e "${GREEN}✅ Hummingbot stopped.${NC}"
fi
echo ""

# 4. Final verification and report
echo -e "${BLUE}🔍 Phase 4: Final Verification...${NC}"
LINGERING=0
for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${NAMES[$i]}
    
    # Check if anything is still listening
    if lsof -i:$PORT > /dev/null 2>&1 || ss -nlt | grep -q ":$PORT "; then
        PID=$(lsof -t -i:$PORT 2>/dev/null | head -n 1)
        if [ ! -z "$PID" ]; then
            USER=$(ps -o user= -p $PID)
            echo -e "${RED}❌ LINGERING PROCESS: $NAME on port $PORT (Owned by: $USER)${NC}"
        else
            echo -e "${RED}❌ LINGERING PROCESS: $NAME on port $PORT (PID HIDDEN - Likely ROOT)${NC}"
            USER="root"
        fi
        
        if [ "$USER" == "root" ] || [ -z "$PID" ]; then
             echo -e "${YELLOW}   👉 Action: Run 'sudo ./stop-nexora.sh' to terminate root processes.${NC}"
        fi
        LINGERING=1
    fi
done

if [ $LINGERING -eq 0 ]; then
    echo -e "${GREEN}✅ All services stopped successfully.${NC}"
else
    echo -e "${RED}⚠️  System not fully stopped. See errors above.${NC}"
fi

echo -e "${RED}==================================================${NC}"
