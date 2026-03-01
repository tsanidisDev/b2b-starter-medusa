#!/bin/bash
# init-ssl.sh — Obtain a Let's Encrypt TLS certificate for the configured DOMAIN.
#
# Usage (run once after the stack is up):
#   bash scripts/init-ssl.sh
#
# Cert auto-renewal runs every 12 h via the certbot container (no manual action needed).
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
ENV_FILE="${ROOT_DIR}/.env.prod"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Error: ${ENV_FILE} not found."
  echo "  Copy .env.prod.example → .env.prod and fill in DOMAIN and LETSENCRYPT_EMAIL."
  exit 1
fi

# Parse DOMAIN and LETSENCRYPT_EMAIL from .env.prod
DOMAIN=$(grep '^DOMAIN=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
EMAIL=$(grep '^LETSENCRYPT_EMAIL=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d '"'"'"' ')

if [ -z "${DOMAIN}" ]; then
  echo "Error: DOMAIN is not set in ${ENV_FILE}"
  exit 1
fi

if [ -z "${EMAIL}" ]; then
  echo "Error: LETSENCRYPT_EMAIL is not set in ${ENV_FILE}"
  exit 1
fi

echo "========================================================"
echo " Requesting Let's Encrypt certificate"
echo "   Domain : ${DOMAIN}"
echo "   Email  : ${EMAIL}"
echo "========================================================"
echo ""
echo "Ensure the stack is running and ${DOMAIN} resolves to this server's IP."
echo ""

cd "${ROOT_DIR}"

# Run certbot via plain docker run (avoids depends_on blocking with docker compose run).
# nginx must be running and serving /.well-known/acme-challenge/ on port 80.
PROJECT=$(basename "${ROOT_DIR}" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-')
docker run --rm \
  -v "${PROJECT}_letsencrypt_data:/etc/letsencrypt" \
  -v "${PROJECT}_certbot_webroot:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d "${DOMAIN}"

echo ""
echo "==> Certificate obtained! Reloading nginx..."
docker compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -s reload

echo ""
echo "✓  Done! Your site is secured at https://${DOMAIN}"
echo "   Cert auto-renewal runs every 12 h via the certbot container."
