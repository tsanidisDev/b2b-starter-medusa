<h1 align="center">
  <a href="http://www.amitmerchant.com/electron-markdownify"><img src="https://github.com/user-attachments/assets/38ba3a7b-e07b-4117-8187-7b171eae3769" alt="B2B Commerce Starter" width="80" height="80"></a>
  <br>
  <br>
  Medusa B2B Commerce Starter
  <br>
</h1>

<p align="center">Customizable B2B ecommerce built with <a href="https://medusajs.com/" target="_blank">Medusa 2.0</a> & Next.js Storefront</p>

<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>

  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/833b26a5-4b52-447f-ac30-6ae02cbe8f05" controls="controls" muted="muted" playsinline="playsinline">
</video>
</p>

<br>

## Table

- [Prerequisites](#prerequisites)
- [Overview](#overview)
  - [Features](#features)
  - [Demo](#demo)
- [Quickstart](#quickstart)
- [Production Deployment (Docker)](#production-deployment-docker)
- [Update](#update)
- [Resources](#resources)
- [Contributors](#contributors)

&nbsp;

## Prerequisites

⚠️ We have tested this repo with the below versions:

- ✅ Node 20
- ✅ Postgres 15
- ✅ Medusa 2.4
- ✅ Next.js 15

&nbsp;

## Overview
For a full feature overview, please visit [the project wiki](https://github.com/medusajs/b2b-starter-medusa/wiki).

#### Core features

- **Company Management**. Customers can manage their company and invite employees.
- **Spending Limits**. Company admins can assign spending limits to its employees.
- **Bulk add-to-cart**. Customers can add multiple variants of a product to their cart at once.
- **Quote Management**. Customers & Merchants can communicate, accept or reject quotes.
- **Order Edit**. Merchants can edit orders or quotes - add/remove item, update quantity & price management and more.
- **Company Approvals**. Companies can mandate approvals from company admins before employees can finalize a cart.
- **Merchant Approvals**. Merchants can set up approval processes for orders, ensuring compliance with business rules before fulfillment.
- **Promotions**. Customers can apply manual and automatic promotions to their cart.
- **Free Shipping Nudge**. Displays a component showing progress toward free shipping.
- **Full ecommerce support**
  - Product Pages
  - Product Collections & Categories
  - Cart & Checkout
  - User Accounts
  - Order Details
- **Full Next.js 15 support**
  - App Router
  - Caching
  - Server components/actions
  - Streaming
  - Static Pre-Rendering

&nbsp;

#### Demo

#### Quote Management

<img align="right" src="https://github.com/user-attachments/assets/110c99e8-18ba-49e5-8955-84a058b597c7" alt="image" style=: />
&nbsp;

#### Company Management

<img align="right" src="https://github.com/user-attachments/assets/361702ce-d491-4509-a930-4361ab3b4126" alt="image" style=: />
&nbsp;

#### Approval Management

<img align="right" src="https://github.com/user-attachments/assets/b93b7b94-41a9-4c5f-bd6b-abf87492ed46" alt="image" style=: />
&nbsp;

#### Product Page

<img align="right" src="https://github.com/user-attachments/assets/2cd8a3ff-5999-49af-890a-4bac7b6f2f15" alt="image" style=: />
&nbsp;

#### Cart Summary

<img align="right" src="https://github.com/user-attachments/assets/095f5565-992e-4c74-acdc-a44bd905e59b" alt="image" style=: />
&nbsp;

&nbsp;

## Quickstart

#### Setup Medusa project

```bash
# Clone the repository
git clone https://github.com/medusajs/b2b-starter-medusa.git

## Setup Backend

# Go to the folder
cd ./backend

# Clone .env.template
cp .env.template .env

# Install dependencies
yarn install

# Install dependencies, setup database & seed data
yarn install && yarn medusa db:create && yarn medusa db:migrate && yarn run seed && yarn medusa user -e admin@test.com -p supersecret -i admin

# Start Medusa project - backend & admin
yarn dev

## Setup Storefront

# Go to folder
cd ../storefront

# Clone .env.template
cp .env.template .env

# Install dependencies
yarn install
```

#### Setup publishable key

- ✅ Visit [Admin: Publishable Key](http://localhost:9000/app/settings/publishable-api-keys)
  - <b>Credentials</b>:
    - <b>email</b>: `admin@test.com`
    - <b>password</b>: `supersecret`
- ✅ Copy token key of "Webshop"
- ✅ Open file - `storefront/.env`
- ✅ Add token to this var - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

```
# Start Medusa storefront
yarn dev
```

Visit the following links to see the Medusa storefront & admin

- [Medusa Admin](http://localhost:9000/app)
- [Medusa Storefront](http://localhost:8000)

&nbsp;

# Production Deployment (Docker)

The repository ships a `docker-compose.prod.yml` that brings up a full production-like stack:

| Service | Description |
|---|---|
| `postgres` | PostgreSQL 15 database (internal, no host port) |
| `redis` | Redis 7 cache & workflow engine (internal, no host port) |
| `medusa-migrate` | One-off migration runner (profile `migration`) |
| `medusa-server` | Medusa API server (port `9000`, localhost-bound) |
| `medusa-worker` | Medusa background worker |
| `storefront` | Next.js storefront (port `8000`, localhost-bound) |

> **Reverse proxy / HTTPS**: In production, place a reverse proxy (nginx, Caddy, Traefik …) in front of ports `9000` and `8000`. The ports are bound to `127.0.0.1` by default so they are not reachable from the internet without the proxy.

## 1 – Prerequisites

- Docker Engine ≥ 24 and Docker Compose plugin (V2)
- A VPS or server with at least 2 GB RAM

## 2 – Prepare environment file

```bash
cp .env.prod.example .env.prod
```

Open `.env.prod` and fill in every required value:

| Variable | How to obtain |
|---|---|
| `POSTGRES_PASSWORD` | Pick a strong password |
| `DATABASE_URL` | Use the same password as above |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `COOKIE_SECRET` | `openssl rand -hex 32` |
| `REVALIDATE_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | See step 5 below |
| `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` | Set to your public URLs once you have a domain |

> ⚠️ **Never use the default `supersecret` values in production.** The compose file will refuse to start if `JWT_SECRET`, `COOKIE_SECRET`, or `POSTGRES_PASSWORD` are empty.

## 3 – Run database migrations

Migrations must be run before (or after an upgrade of) the backend:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm medusa-migrate
```

## 4 – Build images and start the backend

```bash
# Build all images and start postgres, redis, medusa-server, medusa-worker
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up --build -d postgres redis medusa-server medusa-worker
```

Wait for `medusa-server` to become healthy (watch logs with `docker compose -f docker-compose.prod.yml logs -f medusa-server`).

## 5 – Create an admin user & get the publishable key

```bash
# Create an admin user (run once; replace the password with a strong value)
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec medusa-server yarn medusa user -e admin@example.com -p STRONG_PASSWORD_HERE -i admin
```

Then:

1. Open the Medusa Admin at `http://<your-server>:9000/app` (or via your reverse proxy).
2. Go to **Settings → Publishable API keys**.
3. Copy the key for the **Webshop** channel.
4. Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in `.env.prod`.

## 6 – Build and start the storefront

Because `NEXT_PUBLIC_*` variables are baked into the Next.js bundle at build time, the storefront image must be built **after** you have the publishable key:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up --build -d storefront
```

## 7 – Seed demo data (optional)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec medusa-server yarn seed
```

## Access URLs

| Service | Default URL (localhost) |
|---|---|
| Medusa Admin | `http://localhost:9000/app` |
| Medusa API | `http://localhost:9000` |
| Storefront | `http://localhost:8000` |

## Rebuilding after code changes

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up --build -d
```

&nbsp;

# Update

Some general guidelines for when you're updating this Starter to a newer version.

## Update packages

Run `yarn install` in both projects to update you're packages to the latest versions.

## Run migrations

To reflect any changes made to data models, make sure to run `npx medusa db:migrate` in the backend project.

> Note: are you updating from a version of this Starter that didn't have the Approval module yet? Run `npx medusa exec src/scripts/create-approval-settings.ts` in the backend project to add approval settings to all existing companies.

# Resources

#### Learn more about Medusa

- [Website](https://www.medusajs.com/)
- [GitHub](https://github.com/medusajs)
- [2.0 Documentation](https://docs.medusajs.com/v2)

#### Learn more about Next.js

- [Website](https://nextjs.org/)
- [GitHub](https://github.com/vercel/next.js)
- [Documentation](https://nextjs.org/docs)

&nbsp;

## Contributors

<a href = "https://github.com/medusajs/b2b-starter-medusa/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo=medusajs/b2b-starter-medusa"/>
</a>
