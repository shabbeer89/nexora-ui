#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Nexora Health Check — Run All 8 Reports + Issue Tracker
# Usage: bash scripts/run_all_reports.sh
# ═══════════════════════════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="$DIR/scripts"
SSH_KEY="/home/drek/AkhaSoft/Nexora/nexora-ui/ReadMe/Deploy/mysshkey"
DROPLET="root@64.227.151.249"
SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 $DROPLET"

echo "════════════════════════════════════════════"
echo "  NEXORA HEALTH CHECK — FULL REPORT SUITE"
echo "  $(date +'%Y-%m-%d %H:%M:%S %Z')"
echo "════════════════════════════════════════════"
echo ""

# SCP all python scripts to droplet
echo "📤 Uploading report generators to droplet..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  "$SCRIPTS"/gen_*.py $DROPLET:/tmp/ 2>/dev/null
echo ""

# Run each report
REPORTS=(
  "01_executive_report:gen_01_executive.py"
  "02_deployment_sync_report:gen_02_deployment.py"
  "03_scenario_quality_report:gen_03_scenario.py"
  "04_technical_health_check:gen_04_technical.py"
  "05_trading_pulse_check:gen_05_pulse.py"
  "06_daily_trading_report:gen_06_daily.py"
  "07_bot_health_audit:gen_07_bots.py"
  "08_strategy_assessment:gen_08_strategy.py"
  "09_issue_tracker:gen_09_issues.py"
)

for entry in "${REPORTS[@]}"; do
  IFS=':' read -r report script <<< "$entry"
  echo "📊 Generating $report..."
  $SSH_CMD "python3 /tmp/$script" > "$DIR/${report}.md" 2>/dev/null
  lines=$(wc -l < "$DIR/${report}.md")
  echo "   ✅ Done ($lines lines)"
done

echo ""
echo "════════════════════════════════════════════"
echo "  ALL REPORTS GENERATED SUCCESSFULLY"
echo "  Output: $DIR/"
echo "════════════════════════════════════════════"
ls -la "$DIR"/0*.md
