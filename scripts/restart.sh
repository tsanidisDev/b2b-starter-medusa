#!/bin/bash
# restart.sh — Restart one or more production services (no rebuild).
#
# Usage:
#   bash scripts/restart.sh                        # restart everything
#   bash scripts/restart.sh medusa                 # restart only medusa server
#   bash scripts/restart.sh medusa medusa-worker   # restart multiple services
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
COMPOSE="docker compose -f ${ROOT_DIR}/docker-compose.prod.yml --env-file ${ROOT_DIR}/.env.prod"

SERVICES=("$@")

if [ ${#SERVICES[@]} -eq 0 ]; then
  echo "==> Restarting all services..."
  ${COMPOSE} restart
else
  echo "==> Restarting: ${SERVICES[*]}"
  ${COMPOSE} restart "${SERVICES[@]}"
fi

echo ""
echo "==> Current status:"
${COMPOSE} ps

# After restarting medusa, reload nginx so it re-resolves the new Docker IP
if [[ ${#SERVICES[@]} -eq 0 ]] || printf '%s\n' "${SERVICES[@]}" | grep -q '^medusa$'; then
  echo ""
  echo "==> Reloading nginx to re-resolve medusa DNS..."
  ${COMPOSE} exec nginx nginx -s reload 2>/dev/null || echo "  (nginx not running — skipped)"
fi

echo ""
echo "✓  Done."
