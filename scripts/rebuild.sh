#!/bin/bash
# rebuild.sh — Rebuild image(s) and restart the service(s).
#
# Usage:
#   bash scripts/rebuild.sh                        # rebuild & restart everything
#   bash scripts/rebuild.sh medusa                 # backend only
#   bash scripts/rebuild.sh storefront             # storefront only
#   bash scripts/rebuild.sh medusa storefront      # both
#   bash scripts/rebuild.sh medusa --no-cache      # force clean build
#
# Pass --no-cache anywhere in the args to force a clean Docker build.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
COMPOSE="docker compose -f ${ROOT_DIR}/docker-compose.prod.yml --env-file ${ROOT_DIR}/.env.prod"

NO_CACHE=""
SERVICES=()

for arg in "$@"; do
  if [ "${arg}" = "--no-cache" ]; then
    NO_CACHE="--no-cache"
  else
    SERVICES+=("${arg}")
  fi
done

if [ ${#SERVICES[@]} -eq 0 ]; then
  echo "==> Rebuilding ALL services${NO_CACHE:+ (no cache)}..."
  ${COMPOSE} build ${NO_CACHE}
  echo ""
  echo "==> Restarting all services..."
  ${COMPOSE} up -d
else
  echo "==> Rebuilding: ${SERVICES[*]}${NO_CACHE:+ (no cache)}..."
  ${COMPOSE} build ${NO_CACHE} "${SERVICES[@]}"
  echo ""
  echo "==> Restarting: ${SERVICES[*]}..."
  ${COMPOSE} up -d "${SERVICES[@]}"
fi

echo ""
echo "==> Current status:"
${COMPOSE} ps

# Reload nginx after a medusa rebuild so it picks up the new container IP
if [[ ${#SERVICES[@]} -eq 0 ]] || printf '%s\n' "${SERVICES[@]}" | grep -q '^medusa$'; then
  echo ""
  echo "==> Reloading nginx to re-resolve medusa DNS..."
  ${COMPOSE} exec nginx nginx -s reload 2>/dev/null || echo "  (nginx not running — skipped)"
fi

echo ""
echo "✓  Done."
