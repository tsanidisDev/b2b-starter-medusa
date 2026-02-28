# Production Modules

All production providers are **guard-gated** in `backend/medusa-config.ts` — they activate only when their env vars are set. The backend starts fine in dev without any credentials.

---

## Stripe (Payments)

**Activates when:** `STRIPE_API_KEY` is set.

```dotenv
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_KEY=pk_live_...   # storefront .env.local
```

After setting the key, enable Stripe in a region:  
Admin → Settings → Regions → Edit region → Payment Providers → select **Stripe**.

Webhook URL to register in the Stripe dashboard:
```
https://yourdomain.com/store/webhooks/payment/stripe
```

---

## S3 (File Storage)

**Activates when:** `S3_BUCKET` is set. Falls back to local file storage when unset.

```dotenv
S3_FILE_URL=https://your-bucket.s3.eu-west-1.amazonaws.com
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_REGION=eu-west-1
S3_BUCKET=your-bucket-name
# S3_ENDPOINT=   # only for non-AWS: MinIO, DO Spaces, Cloudflare R2
```

Works with any S3-compatible storage: **AWS S3**, **MinIO**, **DigitalOcean Spaces**, **Cloudflare R2**, **Supabase Storage**.

---

## Nodemailer (Transactional Email)

**Activates when:** `SMTP_HOST` is set. Package: `@perseidesjs/notification-nodemailer@3.1.1`.

```dotenv
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.example.com
SMTP_PASS=...
SMTP_FROM=orders@example.com
SMTP_SECURE=false   # true for port 465
```

Works with any SMTP provider: **Gmail**, **Mailgun**, **AWS SES**, **Postmark**, self-hosted.

**Subscribers registered:**

| Event | File | Template key |
|---|---|---|
| `order.placed` | `src/subscribers/order-placed.ts` | `order-placed` |
| `order.fulfillment_delivered` | `src/subscribers/order-shipped.ts` | `order-shipped` |
| `order.canceled` | `src/subscribers/order-canceled.ts` | `order-canceled` |

> Template keys (`order-placed`, etc.) are passed to the notification provider's `template` option. Configure the actual email HTML/text in your SMTP provider or extend the subscriber to render templates locally.

---

## Redis Cache + Locking

**Activates when:** `REDIS_URL` is set (same flag as the event bus and workflow engine).

```dotenv
REDIS_URL=redis://redis:6379

# Optional: dedicated URLs (defaults to REDIS_URL if unset)
CACHE_REDIS_URL=redis://redis:6379
LOCKING_REDIS_URL=redis://redis:6379
```

| Module | Resolve path | Purpose |
|---|---|---|
| Cache | `@medusajs/medusa/cache-redis` | Caches regions, pricing, cart data |
| Locking | `@medusajs/medusa/locking-redis` | Distributed locks for concurrent workflows |

In development without Redis, the workflow engine falls back to `workflow-engine-inmemory` and no cache/locking modules are loaded.
