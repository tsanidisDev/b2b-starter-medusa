# Local Development

Run the full stack (PostgreSQL + Redis + Medusa backend + Next.js storefront) locally without Docker for the app services.

---

## Prerequisites

- Node.js ≥ 20
- Yarn 1.x (`npm i -g yarn`)
- Docker Desktop (for PostgreSQL + Redis containers)

---

## Quick Start

```bash
bash scripts/dev.sh
```

That's it. The script handles everything on first run:
- Starts PostgreSQL + Redis via Docker Compose
- Runs database migrations
- Seeds demo data + creates the admin user
- Starts backend on **http://localhost:9000**
- Starts storefront on **http://localhost:8000**

**Admin dashboard:** http://localhost:9000/app  
**Default credentials:** `admin@example.com` / `supersecret`

---

## First-Time Setup

### 1. Copy environment files

```bash
# Root / backend
cp backend/.env.template .env
# Edit .env — the defaults work for local Docker infra

# Storefront
cp storefront/.env.template storefront/.env.local
```

Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in `storefront/.env.local` — grab it from the Admin after first boot:  
Settings → Publishable API Keys → copy the key.

### 2. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 3. Install dependencies + migrate

```bash
cd backend && yarn install && yarn medusa db:migrate
```

### 4. Seed database

```bash
yarn seed
```

### 5. Create admin user

```bash
yarn medusa user --email admin@example.com --password supersecret
```

### 6. Run services

```bash
# Terminal 1
cd backend && yarn medusa develop

# Terminal 2
cd storefront && yarn dev -p 8000
```

---

## Restart / Reset

```bash
# Restart all services (re-migrates, skips seed if already seeded)
bash scripts/dev.sh

# Full reset — wipes DB, re-seeds from scratch
bash scripts/dev.sh --reset
```

---

## Environment Variables

| File | Purpose |
|---|---|
| `.env` (repo root) | Docker Compose + backend config |
| `backend/.env` | Same as root `.env` — loaded by `medusa-config.ts` |
| `storefront/.env.local` | Next.js public + private vars |

Key variables:

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-store
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```
