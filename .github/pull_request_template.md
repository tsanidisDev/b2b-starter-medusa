## Summary

<!-- Describe what this PR does and why. Reference the relevant issue if applicable. -->

Closes #

---

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / code quality
- [ ] Infrastructure / Docker Compose change
- [ ] Documentation

---

## How to Test with Docker Compose

> All changes must be verifiable via Docker Compose. Fill in the exact commands a reviewer should run.

**Local dev stack:**

```bash
docker compose up --build
```

**Demo / prod-like stack (if infra was changed):**

```bash
cp .env.prod.example .env.prod
# fill in .env.prod

docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm medusa-migrate

docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

**Steps to exercise the change:**

1. <!-- e.g. Open http://localhost:8000 and navigate to ... -->
2.
3.

**Expected result:**

<!-- What should the reviewer see / not see? -->

---

## Checklist

- [ ] Stack starts cleanly with `docker compose up --build`.
- [ ] Demo scenario works end-to-end in a browser.
- [ ] No secrets, `.env.prod`, or build artifacts committed.
- [ ] No bind mounts added to `docker-compose.prod.yml`.
- [ ] New env vars documented in `.env.prod.example`.
- [ ] TypeScript compiles without errors inside the container.
- [ ] Redis is used for cache/events/workflows in prod compose (if applicable).
