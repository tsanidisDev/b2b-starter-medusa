#!/bin/bash
# logs.sh — Tail logs for one or more production services.
#
# Usage:
#   bash scripts/logs.sh                  # tail all services
#   bash scripts/logs.sh medusa           # backend server only
#   bash scripts/logs.sh medusa-worker    # worker only
#   bash scripts/logs.sh nginx storefront # multiple services
#   bash scripts/logs.sh medusa -n 100    # last 100 lines
#
# Available services:
#   nginx  medusa  medusa-worker  storefront  postgres  redis  certbot
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
COMPOSE="docker compose -f ${ROOT_DIR}/docker-compose.prod.yml --env-file ${ROOT_DIR}/.env.prod"

LINES="50"
SERVICES=()

# Parse -n <lines> and service names from args
i=1
while [ $i -le $# ]; do
  arg="${!i}"
  if [ "${arg}" = "-n" ]; then
    i=$((i+1))
    LINES="${!i}"
  else
    SERVICES+=("${arg}")
  fi
  i=$((i+1))
done

if [ ${#SERVICES[@]} -eq 0 ]; then
  ${COMPOSE} logs -f --tail="${LINES}"
else
  ${COMPOSE} logs -f --tail="${LINES}" "${SERVICES[@]}"
fi
