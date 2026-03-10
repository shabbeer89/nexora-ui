#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Nexora Phase 4 DEX Bot Deployment
# Deploys 4 remaining Hummingbot bots to the droplet via Docker
# Usage: bash scripts/deploy_phase4_bots.sh
# ═══════════════════════════════════════════════════════════════

set -e
SSH_KEY="/home/drek/AkhaSoft/Nexora/nexora-ui/ReadMe/Deploy/mysshkey"
DROPLET="root@64.227.151.249"
SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=15 $DROPLET"

echo "════════════════════════════════════════════"
echo "  NEXORA PHASE 4 — DEX BOT DEPLOYMENT"
echo "  $(date +'%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"
echo ""

# Phase 4 bots to deploy
declare -A BOTS
BOTS["nexora_yield_scalp"]="simple_pmm_no_config.py"
BOTS["nexora_grid_hedge"]="simple_pmm_no_config.py"
BOTS["nexora_stable_yield"]="simple_pmm_no_config.py"
BOTS["nexora_multichain_arb"]="simple_pmm_no_config.py"

INSTANCE_BASE="/root/Nexora/hbot/hummingbot-api/bots/instances"
SCRIPTS_DIR="/root/Nexora/hbot/hummingbot-api/bots/scripts"
CONTROLLERS_DIR="/root/Nexora/hbot/hummingbot-api/bots/controllers"
IMAGE="hummingbot/hummingbot:latest"

DEPLOYED=0
FAILED=0

for BOT_NAME in "${!BOTS[@]}"; do
  SCRIPT="${BOTS[$BOT_NAME]}"
  echo "📦 Deploying $BOT_NAME..."

  # Check if already running
  RUNNING=$($SSH "docker ps --filter name=^${BOT_NAME}$ --format '{{.Names}}'" 2>/dev/null || true)
  if [ -n "$RUNNING" ]; then
    echo "   ✅ Already running — skipping"
    DEPLOYED=$((DEPLOYED + 1))
    continue
  fi

  # Create instance directory structure on droplet
  $SSH "mkdir -p $INSTANCE_BASE/$BOT_NAME/{conf/connectors,conf/scripts,conf/controllers,data,logs}" 2>/dev/null

  # Deploy the Docker container using same pattern as existing bots
  RESULT=$($SSH "docker run -d \
    --name $BOT_NAME \
    --network host \
    --restart unless-stopped \
    -e CONFIG_PASSWORD=admin123 \
    -e CONFIG_FILE_NAME=$SCRIPT \
    -e HEADLESS=true \
    -v $INSTANCE_BASE/$BOT_NAME/conf:/home/hummingbot/conf:rw \
    -v $INSTANCE_BASE/$BOT_NAME/conf/connectors:/home/hummingbot/conf/connectors:rw \
    -v $INSTANCE_BASE/$BOT_NAME/conf/scripts:/home/hummingbot/conf/scripts:rw \
    -v $INSTANCE_BASE/$BOT_NAME/conf/controllers:/home/hummingbot/conf/controllers:rw \
    -v $INSTANCE_BASE/$BOT_NAME/data:/home/hummingbot/data:rw \
    -v $INSTANCE_BASE/$BOT_NAME/logs:/home/hummingbot/logs:rw \
    -v $SCRIPTS_DIR:/home/hummingbot/scripts:rw \
    -v $CONTROLLERS_DIR:/home/hummingbot/controllers:rw \
    $IMAGE" 2>&1 || echo "FAILED")

  if [[ "$RESULT" == "FAILED" ]] || [[ -z "$RESULT" ]]; then
    echo "   ❌ Failed to deploy $BOT_NAME"
    FAILED=$((FAILED + 1))
  else
    echo "   ✅ Deployed — container ID: ${RESULT:0:12}"
    DEPLOYED=$((DEPLOYED + 1))
  fi
done

echo ""
echo "════════════════════════════════════════════"
echo "  DEPLOYMENT SUMMARY"
echo "  ✅ Deployed: $DEPLOYED"
echo "  ❌ Failed:   $FAILED"
echo "════════════════════════════════════════════"
echo ""

# Verify all 4 bots appear in Docker
echo "🔍 Verifying Docker status..."
$SSH "docker ps --format '{{.Names}}\t{{.Status}}' | grep 'nexora_yield_scalp\|nexora_grid_hedge\|nexora_stable_yield\|nexora_multichain_arb'"

echo ""
echo "⏳ Waiting 10s for bots to initialize..."
sleep 10

# Verify via Hummingbot API
echo "🔍 Verifying via Hummingbot API..."
$SSH "curl -s -u admin:admin123 http://localhost:8000/bot-orchestration/status | python3 -c \
  'import json,sys; d=json.load(sys.stdin); bots=list(d.get(\"data\",{}).keys()); phase4=[b for b in bots if b in [\"nexora_yield_scalp\",\"nexora_grid_hedge\",\"nexora_stable_yield\",\"nexora_multichain_arb\"]]; print(f\"Phase 4 bots visible in API: {phase4}\")'"

echo ""
echo "✅ Phase 4 deployment complete!"
echo "   Run 'bash scripts/run_all_reports.sh' to regenerate health reports."
