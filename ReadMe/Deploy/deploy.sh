#!/bin/bash

# ============================================================================
# Nexora Deployment Script - DigitalOcean Droplet
# ============================================================================
# Usage: ./deploy.sh [archive|transfer|setup|start|all]

set -e

# Configuration
DROPLET_IP="64.227.151.249"
DROPLET_USER="root"
SSH_KEY="$(dirname "$0")/mysshkey"
LOCAL_NEXORA_PATH="/home/drek/AkhaSoft/Nexora"
REMOTE_PATH="/root/Nexora"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Ensure SSH key has correct permissions
chmod 600 "$SSH_KEY" 2>/dev/null || true

ssh_cmd() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$DROPLET_USER@$DROPLET_IP" "$@"
}

scp_cmd() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$@"
}

# ============================================================================
# Phase 1: Archive Old Project
# ============================================================================
archive_old() {
    echo -e "${YELLOW}📦 Phase 1: Archiving old h-bot-stack...${NC}"
    
    ssh_cmd << 'EOF'
        if [ -d "/root/h-bot-stack" ]; then
            echo "Stopping old containers..."
            cd /root/h-bot-stack && docker compose down 2>/dev/null || true
            
            ARCHIVE_NAME="h-bot-stack-archived-$(date +%Y%m%d-%H%M%S)"
            echo "Archiving to /root/$ARCHIVE_NAME..."
            mv /root/h-bot-stack /root/$ARCHIVE_NAME
            echo "✅ Old project archived"
        else
            echo "⚠️  No h-bot-stack found, skipping archive"
        fi
EOF
    
    echo -e "${GREEN}✅ Archive complete${NC}"
}

# ============================================================================
# Phase 2: Transfer Nexora Files
# ============================================================================
transfer_files() {
    echo -e "${YELLOW}📤 Phase 2: Transferring Nexora files...${NC}"
    
    # Create remote directory
    ssh_cmd "mkdir -p $REMOTE_PATH"
    
    # Sync files (replica including .git, logs, backtest etc.)
    rsync -avz --progress \
        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
        --exclude 'node_modules' \
        --exclude 'venv' \
        --exclude '.next' \
        --exclude 'nexora-ui' \
        "$LOCAL_NEXORA_PATH/" \
        "$DROPLET_USER@$DROPLET_IP:$REMOTE_PATH/"
    
    echo -e "${GREEN}✅ Transfer complete${NC}"
}

# ============================================================================
# Phase 3: Setup Environment on Droplet
# ============================================================================
setup_remote() {
    echo -e "${YELLOW}🔧 Phase 3: Setting up environment on droplet...${NC}"
    
    ssh_cmd << 'EOF'
        set -e
        cd /root/Nexora
        
        echo "📦 Setting up nexora-bot..."
        cd nexora-bot
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        deactivate
        
        echo "📦 Setting up freqtrade..."
        cd ../freqtrade
        if [ -f "requirements.txt" ]; then
            python3 -m venv venv
            source venv/bin/activate
            pip install --upgrade pip
            pip install -r requirements.txt
            pip install -e .
            deactivate
        fi
        
        echo "📦 Starting Docker infrastructure..."
        cd ../hbot/hummingbot-api
        docker compose up -d postgres emqx
        
        echo "✅ Environment setup complete"
EOF
    
    echo -e "${GREEN}✅ Remote setup complete${NC}"
}

# ============================================================================
# Phase 4: Install and Start Services
# ============================================================================
start_services() {
    echo -e "${YELLOW}🚀 Phase 4: Installing systemd services...${NC}"
    
    # Copy service files
    scp_cmd "$(dirname "$0")/nexora-api.service" "$DROPLET_USER@$DROPLET_IP:/etc/systemd/system/"
    scp_cmd "$(dirname "$0")/nexora-freqtrade.service" "$DROPLET_USER@$DROPLET_IP:/etc/systemd/system/"
    
    ssh_cmd << 'EOF'
        set -e
        
        # Reload systemd
        systemctl daemon-reload
        
        # Enable and start services
        systemctl enable nexora-api
        systemctl enable nexora-freqtrade
        
        systemctl restart nexora-api
        systemctl restart nexora-freqtrade
        
        # Start Cloudflare tunnel
        pkill cloudflared 2>/dev/null || true
        nohup cloudflared tunnel --url http://localhost:8888 > /tmp/cloudflared.log 2>&1 &
        sleep 3
        
        echo ""
        echo "=== Service Status ==="
        systemctl status nexora-api --no-pager | head -5
        systemctl status nexora-freqtrade --no-pager | head -5
        
        echo ""
        echo "=== Cloudflare Tunnel URL ==="
        grep -o 'https://[^"]*\.trycloudflare\.com' /tmp/cloudflared.log | tail -1
EOF
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# ============================================================================
# Main
# ============================================================================
case "${1:-all}" in
    archive)
        archive_old
        ;;
    transfer)
        transfer_files
        ;;
    setup)
        setup_remote
        ;;
    start)
        start_services
        ;;
    all)
        archive_old
        transfer_files
        setup_remote
        start_services
        echo -e "${GREEN}🎉 Full deployment complete!${NC}"
        ;;
    *)
        echo "Usage: $0 [archive|transfer|setup|start|all]"
        exit 1
        ;;
esac
