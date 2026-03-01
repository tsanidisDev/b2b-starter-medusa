#!/bin/bash
# dev.sh — Start (or restart) the full local development stack.
#
# Usage:
#   bash scripts/dev.sh           # start everything
#   bash scripts/dev.sh --reset   # wipe DB volumes and start fresh (re-migrate + re-seed)
#
# What it starts:
#   1. Docker: postgres + redis (via docker-compose.yml)
#   2. Backend: yarn dev on port 9000  (logs → /tmp/medusa-backend.log)
#   3. Storefront: yarn dev on port 8000  (logs → /tmp/medusa-storefront.log)
#
# Prerequisites (one-time):
#   • Docker Desktop running
#   • Node.js + yarn installed on host
#   • yarn install run in backend/ and storefront/
#   • .env present at repo root:          cp backend/.env.template .env
#   • storefront/.env.local present:      cp storefront/.env.template storefront/.env.local
#   • Fill in publishable keys in storefront/.env.local after first seed
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "${SCRIPT_DIR}")"
BACKEND="${ROOT}/backend"
STOREFRONT="${ROOT}/storefront"
BACKEND_LOG="/tmp/medusa-backend.log"
STOREFRONT_LOG="/tmp/medusa-storefront.log"
RESET=false

# ── parse flags ──────────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=true ;;
    --help|-h)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
  esac
done

# ── helpers ───────────────────────────────────────────────────────────────────
info()    { echo "  [dev] $*"; }
success() { echo "  ✔  $*"; }
warn()    { echo "  ⚠  $*"; }
die()     { echo "  ✘  $*" >&2; exit 1; }

# ── preflight checks ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1  || die "Docker not found. Install Docker Desktop."
command -v node   >/dev/null 2>&1  || die "Node.js not found."
command -v yarn   >/dev/null 2>&1  || die "yarn not found."

[[ -f "${ROOT}/.env" ]]                 || die "Missing .env — run: cp backend/.env.template .env"
[[ -f "${STOREFRONT}/.env.local" ]]     || die "Missing storefront/.env.local — run: cp storefront/.env.template storefront/.env.local"
[[ -d "${BACKEND}/node_modules" ]]      || die "backend/node_modules missing — run: cd backend && yarn install"
[[ -d "${STOREFRONT}/node_modules" ]]   || die "storefront/node_modules missing — run: cd storefront && yarn install"

# ── stop any running processes on our ports ───────────────────────────────────
stop_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti :"${port}" 2>/dev/null || true)
  if [[ -n "${pids}" ]]; then
    info "Stopping process(es) on port ${port}..."
    echo "${pids}" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧵  Greek Silk Shop — Local Dev Stack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── step 1: docker infra ──────────────────────────────────────────────────────
echo ""
info "Step 1/4 — Docker infra (postgres + redis)"

if [[ "${RESET}" == "true" ]]; then
  warn "--reset: stopping containers and wiping postgres volume..."
  docker compose -f "${ROOT}/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
fi

docker compose -f "${ROOT}/docker-compose.yml" up -d postgres redis

# wait for postgres to be ready
info "Waiting for postgres to be ready..."
for i in $(seq 1 30); do
  if docker exec medusa_postgres pg_isready -U postgres -q 2>/dev/null; then
    break
  fi
  sleep 1
done
docker exec medusa_postgres pg_isready -U postgres -q || die "Postgres did not become ready in time."
success "Postgres + Redis ready"

# ── step 2: db migrate ────────────────────────────────────────────────────────
echo ""
info "Step 2/4 — Database migrations"
(cd "${BACKEND}" && yarn medusa db:migrate 2>&1 | grep -E "info:|error:|warn:|Done" | tail -5)
success "Migrations done"

# ── step 3: seed (only on first boot or --reset) ──────────────────────────────
# Check if DB already has regions as a proxy for "already seeded"
SILK_SEED_COUNT=$(docker exec medusa_postgres psql -U postgres -d medusa-store -tAc "SELECT COUNT(*) FROM product_collection WHERE handle='bestsellers';" 2>/dev/null || echo "0")
SILK_SEED_COUNT=$(echo "${SILK_SEED_COUNT}" | tr -d '[:space:]')

if [[ "${RESET}" == "true" ]] || [[ "${SILK_SEED_COUNT}" == "0" ]]; then
  echo ""
  info "Step 3/4 — Seeding database (silk shop)"
  (cd "${BACKEND}" && yarn seed:silk 2>&1 | grep -E "info:|error:|warn:|Done" | tail -10) || {
    warn "Seed exited with an error — data may already exist, continuing..."
  }
  # Create default admin user on first seed
  (cd "${BACKEND}" && yarn medusa user --email admin@example.com --password supersecret 2>&1 | grep -E "info:|error:" | tail -3) || true
  success "Seed done — admin: admin@example.com / supersecret"
else
  info "Step 3/4 — Seed skipped (silk shop data already present — use --reset to re-seed)"
fi

# ── step 4: start processes ───────────────────────────────────────────────────
echo ""
info "Step 4/4 — Starting backend + storefront"

stop_port 9000
stop_port 8000

# backend
(cd "${BACKEND}" && yarn dev > "${BACKEND_LOG}" 2>&1) &
BACKEND_PID=$!
info "Backend starting (PID ${BACKEND_PID}) — logs: ${BACKEND_LOG}"

# wait for backend to be ready (max 40s)
for i in $(seq 1 40); do
  if curl -s http://localhost:9000/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -s http://localhost:9000/health >/dev/null 2>&1 || {
  warn "Backend did not respond in time — check ${BACKEND_LOG}"
}
success "Backend ready → http://localhost:9000  |  Admin → http://localhost:9000/app"

# storefront
(cd "${STOREFRONT}" && yarn dev > "${STOREFRONT_LOG}" 2>&1) &
STOREFRONT_PID=$!
info "Storefront starting (PID ${STOREFRONT_PID}) — logs: ${STOREFRONT_LOG}"

# wait for storefront
for i in $(seq 1 30); do
  if curl -s http://localhost:8000 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
success "Storefront ready → http://localhost:8000"

# ── summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  All services running"
echo ""
echo "  Storefront  →  http://localhost:8000"
echo "  Admin       →  http://localhost:9000/app  (admin@example.com / supersecret)"
echo "  Backend API →  http://localhost:9000"
echo ""
echo "  Logs:"
echo "    Backend    tail -f ${BACKEND_LOG}"
echo "    Storefront tail -f ${STOREFRONT_LOG}"
echo ""
echo "  Stop all:    bash scripts/dev.sh --stop  (or Ctrl+C)"
echo "  Fresh start: bash scripts/dev.sh --reset"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# keep script alive so Ctrl+C stops everything cleanly
trap 'echo ""; info "Shutting down..."; kill "${BACKEND_PID}" "${STOREFRONT_PID}" 2>/dev/null; docker compose -f "${ROOT}/docker-compose.yml" stop postgres redis; exit 0' INT TERM

wait "${BACKEND_PID}" "${STOREFRONT_PID}"
