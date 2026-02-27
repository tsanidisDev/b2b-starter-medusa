# AI Agent Playbook

This document is the authoritative guide for AI coding agents (GitHub Copilot Coding Agent, OpenAI Codex, etc.) working in this repository.

---

## What This Repo Is

**b2b-starter-medusa** is a Medusa v2 B2B commerce starter. It ships as a monorepo with:

- `backend/` — Medusa v2 server, worker, admin customisations, workflows, subscribers, and custom modules.
- `storefront/` — Next.js 14 storefront with B2B-specific pages and components.
- `docker-compose.yml` — local development stack.
- `docker-compose.prod.yml` — demo / production-like stack.

All work is validated through Docker Compose. There is **no host-level Node/Yarn requirement**.

---

## Allowed Scope of Changes

Agents may change **anything** in the repository, including:

| Area | Examples |
|---|---|
| Backend logic | Modules, workflows, subscribers, API routes, jobs |
| Storefront | Pages, components, API calls, styling |
| Infrastructure | `docker-compose.yml`, `docker-compose.prod.yml`, `Dockerfile.prod` files |
| Configuration | `medusa-config.ts`, `next.config.js`, environment variable templates |
| Documentation | `README.md`, `docs/`, `AGENTS.md`, `.github/copilot-instructions.md` |

---

## Priorities

1. **Correctness** — the stack must start and the demo flow must work end-to-end.
2. **Demo-ability** — every feature must be exercisable in a browser after `docker compose up`.
3. **Security** — no secrets committed, no plain-text credentials in images.
4. **Maintainability** — follow existing patterns (see `.github/copilot-instructions.md`).

---

## Hard Guardrails

These rules must **never** be violated:

- ❌ Do not commit secrets, passwords, API keys, or `.env.prod` files.
- ❌ Do not add bind mounts of the source tree to `docker-compose.prod.yml`.
- ❌ Do not use in-memory cache or the in-memory workflow engine when `NODE_ENV=production`. Always configure Redis.
- ❌ Do not add `npm`, `yarn`, or `node` host-level commands to documentation or CI steps — use `docker compose exec <service> yarn ...` to run commands inside containers instead.
- ❌ Do not expose PostgreSQL or Redis ports on `0.0.0.0` in `docker-compose.prod.yml`.

---

## Development Workflow

### Start the local dev stack

```bash
docker compose up --build
```

- Backend API: http://localhost:9000
- Admin dashboard: http://localhost:9000/app
- Storefront: http://localhost:8000

### Apply migrations

```bash
docker compose exec medusa yarn medusa db:migrate
```

### Rebuild a single service

```bash
docker compose up --build medusa
```

### Run linter inside a container

```bash
docker compose exec medusa yarn lint
docker compose exec storefront yarn lint
```

---

## Demo / Prod-like Workflow

See `docs/ai/deploy-demo.md` for the full step-by-step guide.

Quick reference:

```bash
cp .env.prod.example .env.prod
# fill in all values in .env.prod

docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm medusa-migrate

docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

---

## Feature Implementation Patterns

### Adding a Medusa module

1. `backend/src/modules/<name>/index.ts` — export `Module()` definition.
2. `backend/src/modules/<name>/service.ts` — extend `MedusaService`.
3. Register in `backend/medusa-config.ts` → `modules` array.

### Adding a workflow

1. `backend/src/workflows/<name>.ts` — use `createWorkflow` / `createStep`.
2. Invoke from an API route or subscriber.
3. Async steps require the worker service (Redis-backed).

### Adding a subscriber

1. `backend/src/subscribers/<name>.ts`.
2. Export `config = { event: "order.placed" }` and a default async handler.

### Adding an admin widget

1. `backend/src/admin/widgets/<name>.tsx`.
2. Export `defineWidgetConfig` and a React component as default.

### Adding a storefront page

1. Create the route under `storefront/src/app/`.
2. Use server components by default; add `"use client"` only when necessary.
3. Fetch data via the Medusa JS SDK or direct `fetch` to `NEXT_PUBLIC_MEDUSA_BACKEND_URL`.

---

## Pre-PR Checklist

Before opening or merging a pull request, verify:

- [ ] `docker compose up --build` completes without errors.
- [ ] The affected demo scenario works end-to-end in a browser.
- [ ] `docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d` succeeds (if infra was changed).
- [ ] No secrets, `.env.prod`, or generated build artefacts are staged.
- [ ] No bind mounts added to `docker-compose.prod.yml`.
- [ ] New environment variables are documented in `.env.prod.example`.
- [ ] TypeScript compiles without errors inside the container.
- [ ] PR description explains how to test the change via Docker Compose.
