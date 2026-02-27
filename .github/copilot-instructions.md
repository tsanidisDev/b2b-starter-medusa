# GitHub Copilot Coding Agent Instructions

This repository is the **Medusa v2 B2B Starter** — a monorepo containing a Medusa backend and a Next.js storefront. All development, demo, and production-like workflows run through **Docker Compose only**. There is no expectation to install Node/Yarn on the host.

---

## Guiding Principles

1. **Demo-first delivery.** Every feature or fix must be verifiable by spinning up the stack with `docker compose` and manually exercising the flow in a browser. If it can't be shown in a demo, it's not done.
2. **Docker Compose is the only workflow.** Use `docker-compose.yml` for local dev and `docker-compose.prod.yml` for demo/production-like deployments. Never reference `npm`, `yarn`, or `node` as host commands in documentation or scripts.
3. **No secrets committed.** Secrets live in `.env` (dev) or `.env.prod` (prod-like), both git-ignored. Use `.env.prod.example` as the template. Generate secrets with `openssl rand -hex 32`.
4. **No bind mounts in prod Compose.** `docker-compose.prod.yml` must never mount the host source tree into a container. Use named volumes only.
5. **Redis-backed in production-like mode.** Never use in-memory cache or the in-memory workflow engine when `NODE_ENV=production`. Always set `REDIS_URL` and ensure `medusa-worker` is running as a separate container with `MEDUSA_WORKER_MODE=worker`.

---

## Repository Layout

```
.
├── backend/          # Medusa v2 backend (TypeScript)
│   ├── src/
│   │   ├── admin/        # Custom admin widgets & routes
│   │   ├── api/          # Custom API routes
│   │   ├── jobs/         # Scheduled jobs
│   │   ├── links/        # Module link definitions
│   │   ├── modules/      # Custom Medusa modules
│   │   ├── subscribers/  # Event subscribers
│   │   ├── workflows/    # Medusa workflows
│   │   └── scripts/      # Seed / utility scripts
│   ├── medusa-config.ts  # Medusa configuration
│   └── Dockerfile.prod
├── storefront/       # Next.js 14 storefront
│   └── Dockerfile.prod
├── docker-compose.yml       # Local dev stack
├── docker-compose.prod.yml  # Demo / production-like stack
└── .env.prod.example        # Template for prod env vars
```

---

## Implementing Features

### Custom Medusa Module
1. Create `backend/src/modules/<module-name>/` with `index.ts`, `service.ts`, and `models/`.
2. Register in `backend/medusa-config.ts` under `modules`.

### Workflows
1. Add a new file under `backend/src/workflows/`.
2. Use `createWorkflow` / `createStep` from `@medusajs/framework/workflows-sdk`.
3. Workflows that involve async steps must be executed via the worker — ensure Redis is configured.

### Subscribers
1. Add a file under `backend/src/subscribers/`.
2. Export a default function and a `config` object with `event` (e.g., `order.placed`).

### Admin Widgets
1. Add a file under `backend/src/admin/widgets/`.
2. Use `defineWidgetConfig` and export a React component as default.
3. Admin widgets are compiled by Medusa's bundler — no separate build step needed.

### Storefront Changes
1. All pages live under `storefront/src/app/`.
2. Use server components where possible; resort to `"use client"` only for interactive UI.
3. Environment variables prefixed with `NEXT_PUBLIC_` are baked in at image build time — rebuild the storefront image after changing them.

---

## Docker Compose Commands

### Local Development

```bash
# Start the full dev stack (hot-reload via bind mount)
docker compose up --build

# Tail logs for a specific service
docker compose logs -f medusa

# Run a one-off command inside the backend container
docker compose exec medusa yarn medusa db:migrate
```

### Demo / Production-like

```bash
# Copy and fill in environment variables
cp .env.prod.example .env.prod

# Run database migrations (first deploy or after upgrades)
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm medusa-migrate

# Build and start all services
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

# Check service health
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `POSTGRES_PASSWORD` | Yes | Strong password; never commit |
| `DATABASE_URL` | Yes | Must match `POSTGRES_USER`/`POSTGRES_PASSWORD` |
| `REDIS_URL` | Yes | `redis://redis:6379` within the Docker network |
| `JWT_SECRET` | Yes | `openssl rand -hex 32` |
| `COOKIE_SECRET` | Yes | `openssl rand -hex 32` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Yes | Obtain from Admin after first boot |
| `REVALIDATE_SECRET` | Yes | `openssl rand -hex 32` |

---

## Code Style

- TypeScript everywhere in `backend/src/` and `storefront/src/`.
- ESLint + Prettier are configured — run `docker compose exec <service> yarn lint` to check.
- Use named exports for Medusa constructs (modules, workflows, subscribers).
- Keep `medusa-config.ts` clean; add module config through the `modules` array only.

---

## Pre-PR Checklist

- [ ] Stack starts cleanly: `docker compose up --build` completes without errors.
- [ ] Demo scenario exercised end-to-end in the browser.
- [ ] No secrets or `.env.prod` committed.
- [ ] No bind mounts added to `docker-compose.prod.yml`.
- [ ] Redis is used for cache/events/workflows in prod compose (`REDIS_URL` set, worker running).
- [ ] New env vars documented in `.env.prod.example`.
- [ ] TypeScript compiles without errors.
