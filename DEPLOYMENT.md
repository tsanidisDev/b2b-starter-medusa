# Deployment Guide — Medusa B2B Starter

Production stack: **Nginx → Medusa (server + worker) + Next.js Storefront + PostgreSQL + Redis + Certbot**

---

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- A domain with an A record pointing to the server IP
- Ports **80** and **443** open in the firewall

---

## First-Time Setup

### 1. Clone and configure environment

```bash
cp .env.prod.example .env.prod
```

Edit `.env.prod` — the minimum required values:

| Variable | How to get it |
|---|---|
| `DOMAIN` | Your domain, e.g. `demo-eshop.example.com` |
| `LETSENCRYPT_EMAIL` | Email for cert expiry notices |
| `POSTGRES_PASSWORD` | `openssl rand -hex 32` |
| `DATABASE_URL` | `postgres://postgres:<POSTGRES_PASSWORD>@postgres:5432/medusa-store` |
| `REDIS_URL` | `redis://redis:6379` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `COOKIE_SECRET` | `openssl rand -hex 32` |
| `REVALIDATE_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Filled in after seeding (step 4) |
| `NEXT_PUBLIC_DEFAULT_REGION` | `de` (or whichever region your seed creates) |

### 2. Run database migrations

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm medusa-migrate
```

### 3. Start the stack (initially without the storefront — you need the key first)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres redis medusa medusa-worker nginx certbot
```

Wait for medusa to become healthy (~60 s):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### 4. Issue SSL certificate

> Nginx must be running and `$DOMAIN` must resolve to this server before this step.

```bash
bash scripts/init-ssl.sh
```

This issues a Let's Encrypt cert. Auto-renewal runs every 12 h via the certbot container — no cron needed.

### 5. Seed the database & get the publishable key

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec medusa \
  node_modules/.bin/medusa exec src/scripts/seed.js
```

Then fetch the publishable key:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec postgres \
  psql -U postgres medusa-store \
  -c "SELECT token FROM publishable_api_key LIMIT 5;"
```

Copy the `pk_...` value into `.env.prod` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

### 6. Create an admin user

The seed script does **not** create an admin user. Create one manually:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec medusa \
  node_modules/.bin/medusa user -e admin@example.com -p YourPassword123!
```

Then log in at `https://$DOMAIN/app`.

### 7. Build and start the storefront

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build storefront
```

> `NEXT_PUBLIC_*` vars are baked into the Next.js bundle at image build time.  
> Rebuild the storefront image whenever these values change.

---

## Architecture

```
Internet → Nginx (80/443)
              ├── /app/*          → Medusa :9000  (Admin SPA)
              ├── /admin/*        → Medusa :9000  (Admin API)
              ├── /store/*        → Medusa :9000  (Store API)
              ├── /auth/*         → Medusa :9000  (Auth, rate-limited)
              ├── /api/*          → Medusa :9000  (Custom API)
              └── /*              → Storefront :3000  (Next.js SSR)

Medusa server  → PostgreSQL (internal)
               → Redis (internal)
Medusa worker  → PostgreSQL (internal)
               → Redis (internal, BullMQ jobs)
Storefront SSR → http://medusa:9000  (Docker-internal, never goes via nginx)
```

**Two-layer URL system:**
- **Browser / Admin SPA**: `https://$DOMAIN` — baked into JS bundles at `docker build` time via `MEDUSA_BACKEND_URL` build ARG
- **Server-side (SSR / middleware)**: `http://medusa:9000` — runtime env, stays inside Docker network

> ⚠️ If you change `DOMAIN`, you must rebuild **both** the backend and storefront images.

---

## Helper Scripts

| Script | Purpose |
|---|---|
| `bash scripts/init-ssl.sh` | Issue/renew Let's Encrypt cert |
| `bash scripts/restart.sh [service]` | Restart all services or a single one |
| `bash scripts/rebuild.sh [service]` | Rebuild image(s) and restart |
| `bash scripts/logs.sh [service]` | Tail logs (default: all services) |

---

## Common Operations

### Restart everything

```bash
bash scripts/restart.sh
```

### Rebuild after a code change

```bash
# Backend changed
bash scripts/rebuild.sh medusa

# Storefront changed (or NEXT_PUBLIC_* vars updated)
bash scripts/rebuild.sh storefront

# Both
bash scripts/rebuild.sh medusa storefront
```

### Reload nginx config (no downtime)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec nginx nginx -s reload
```

> Do this after any nginx container restart so it re-resolves Docker DNS for upstreams.

### Run a migration after a Medusa upgrade

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm medusa-migrate
```

### Open a database shell

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec postgres \
  psql -U postgres medusa-store
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/app` returns 404 or 502 | Medusa restarted and got a new IP. Run `nginx -s reload` (see above). |
| Admin SPA calls `http://localhost:9000` | Rebuild backend image — `MEDUSA_BACKEND_URL` build ARG was missing. |
| Storefront 500 / ECONNREFUSED | Check `MEDUSA_BACKEND_URL=http://medusa:9000` is set in storefront runtime env. |
| Cert errors on first boot | Self-signed placeholder is used until `init-ssl.sh` runs — safe to ignore. |
| BullMQ / workflow errors | Redis must use `noeviction` policy and `medusa-worker` must be running. |
| Wrong region on storefront | Set `NEXT_PUBLIC_DEFAULT_REGION` to a region created by the seed (e.g. `de`). |

---

## Full Redeploy Checklist

```bash
# 1. Pull latest code
git pull

# 2. Run migrations if schema changed
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm medusa-migrate

# 3. Rebuild changed services
bash scripts/rebuild.sh medusa storefront

# 4. Verify everything is healthy
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```
