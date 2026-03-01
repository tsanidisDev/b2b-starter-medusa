#!/bin/sh
set -e

DOMAIN="${DOMAIN:-localhost}"

echo "[nginx-init] Configuring nginx for domain: ${DOMAIN}"

envsubst '${DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# ---------------------------------------------------------------------------
# Find the best available cert directory:
#   1. /etc/letsencrypt/live/${DOMAIN}      (standard, after renewal)
#   2. /etc/letsencrypt/live/${DOMAIN}-0001 (certbot creates this when a
#      placeholder dir already exists for the domain)
#   3. Self-signed placeholder (fallback — run scripts/init-ssl.sh)
# ---------------------------------------------------------------------------
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
CERT_DIR_ALT="/etc/letsencrypt/live/${DOMAIN}-0001"

if [ -f "${CERT_DIR_ALT}/fullchain.pem" ] && \
   grep -q "CERTIFICATE" "${CERT_DIR_ALT}/fullchain.pem" 2>/dev/null && \
   openssl x509 -noout -issuer -in "${CERT_DIR_ALT}/fullchain.pem" 2>/dev/null | grep -qv "CN=${DOMAIN}"; then
  echo "[nginx-init] Using cert directory: ${CERT_DIR_ALT}"
  CERT_DIR="${CERT_DIR_ALT}"
elif [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  echo "[nginx-init] No SSL cert found — generating self-signed placeholder for ${DOMAIN}"
  mkdir -p "${CERT_DIR}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "${CERT_DIR}/privkey.pem" \
      -out    "${CERT_DIR}/fullchain.pem" \
      -subj   "/CN=${DOMAIN}" 2>/dev/null
  cp "${CERT_DIR}/fullchain.pem" "${CERT_DIR}/chain.pem"
  echo "[nginx-init] Placeholder cert created."
  echo "[nginx-init] ⚠  Run:  bash scripts/init-ssl.sh  to obtain a real Let's Encrypt cert."
fi

# Point nginx config at the resolved cert dir (may differ from ${DOMAIN})
REAL_CERT_DIR="${CERT_DIR}"
sed -i "s|/etc/letsencrypt/live/${DOMAIN}/|${REAL_CERT_DIR}/|g" /etc/nginx/nginx.conf

exec nginx -g "daemon off;"
