# Demo Deployment on a VPS

This guide walks you through deploying the Medusa B2B Starter on a fresh VPS (Ubuntu 22.04 recommended) using `docker compose` and `docker-compose.prod.yml`.

---

## Prerequisites

- A VPS with at least **2 GB RAM** and **20 GB disk**.
- Docker Engine ≥ 24 and the Compose plugin installed:

  ```bash
  # Install Docker (if not already present)
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  newgrp docker
  docker compose version   # should print v2.x
  ```

- A DNS A-record pointing your domain (e.g. `demo.example.com`) to the VPS IP, **or** use the raw IP for a quick demo.
- The repository cloned on the VPS:

  ```bash
  git clone https://github.com/tsanidisDev/b2b-starter-medusa.git
  cd b2b-starter-medusa
  ```

---

## Step 1 — Configure Environment Variables

```bash
cp .env.prod.example .env.prod
```

Open `.env.prod` in your editor and fill in **every** required value:

```bash
# Generate strong secrets
openssl rand -hex 32   # use output for JWT_SECRET
openssl rand -hex 32   # use output for COOKIE_SECRET
openssl rand -hex 32   # use output for REVALIDATE_SECRET
```

| Variable | What to set |
|---|---|
| `POSTGRES_PASSWORD` | A strong password (no `@` or special shell chars) |
| `DATABASE_URL` | `postgres://postgres:<POSTGRES_PASSWORD>@postgres:5432/medusa-store` |
| `REDIS_URL` | `redis://redis:6379` |
| `JWT_SECRET` | Output of `openssl rand -hex 32` |
| `COOKIE_SECRET` | Output of `openssl rand -hex 32` |
| `STORE_CORS` | `http://<YOUR_IP_OR_DOMAIN>:8000` |
| `ADMIN_CORS` | `http://<YOUR_IP_OR_DOMAIN>:9000` |
| `AUTH_CORS` | `http://<YOUR_IP_OR_DOMAIN>:9000` |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `http://<YOUR_IP_OR_DOMAIN>:9000` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Fill in **after** first boot (see Step 4) |
| `NEXT_PUBLIC_BASE_URL` | `http://<YOUR_IP_OR_DOMAIN>:8000` |
| `REVALIDATE_SECRET` | Output of `openssl rand -hex 32` |

> **Never commit `.env.prod`.** It is listed in `.gitignore`.

---

## Step 2 — Run Database Migrations

The `medusa-migrate` service is a one-off container that runs `yarn medusa db:migrate` and exits. Run it before the first boot and after every upgrade that includes schema changes.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm medusa-migrate
```

You should see migration output ending with `Migrations completed.`

---

## Step 3 — Build and Start All Services

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

This builds the backend and storefront images, then starts:

| Service | Role | Internal port |
|---|---|---|
| `postgres` | Database | 5432 (internal only) |
| `redis` | Cache + workflow engine | 6379 (internal only) |
| `medusa-server` | REST API + Admin dashboard | 9000 → `127.0.0.1:9000` |
| `medusa-worker` | Background jobs / workflows | — |
| `storefront` | Next.js storefront | 8000 → `127.0.0.1:8000` |

Check that all services are healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

All services should show `healthy` or `running`.

Tail logs if something looks wrong:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f medusa-server
```

---

## Step 4 — Create Admin User and Publishable API Key

### 4a. Create the first admin user

Open the Medusa Admin at `http://<YOUR_IP_OR_DOMAIN>:9000/app` and complete the onboarding wizard, **or** run the seed script:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec medusa-server yarn medusa user --email admin@example.com --password changeme
```

### 4b. Generate a Publishable API Key

1. Log in to the Admin: `http://<YOUR_IP_OR_DOMAIN>:9000/app`.
2. Navigate to **Settings → Publishable API Keys**.
3. Click **Create API Key**, name it `storefront`, and copy the key.

### 4c. Rebuild the Storefront with the Key

Add the key to `.env.prod`:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

Then rebuild and restart the storefront container only:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up --build -d storefront
```

---

## Step 5 — Verify the Demo

| URL | Expected |
|---|---|
| `http://<IP>:9000/health` | `{"status":"ok"}` |
| `http://<IP>:9000/app` | Medusa Admin login page |
| `http://<IP>:8000` | Storefront home page |

---

## Updating After a Code Change

```bash
# Pull latest code
git pull

# Run migrations FIRST if the update includes schema changes
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm medusa-migrate

# Rebuild images and restart after migrations are applied
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

---

## Stopping the Stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

To also remove named volumes (⚠ destroys all data):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `medusa-server` keeps restarting | Missing required env var | Check `docker compose … logs medusa-server` |
| Storefront shows "Failed to fetch" | Wrong `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Update `.env.prod` and rebuild storefront |
| Migration fails with "connection refused" | Postgres not healthy yet | Re-run the migrate command after postgres is healthy |
| Admin returns 401 on all requests | `JWT_SECRET` or `COOKIE_SECRET` changed | Clear browser cookies and re-login |
