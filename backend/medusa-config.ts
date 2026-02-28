import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV!, process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "server" | "worker") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
  },
  modules: {
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },

    // ── Stripe Payment Provider ───────────────────────────────────────────
    ...(process.env.STRIPE_API_KEY
      ? {
          [Modules.PAYMENT]: {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: process.env.STRIPE_API_KEY,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
        }
      : {}),

    // ── S3 File Provider ──────────────────────────────────────────────────
    ...(process.env.S3_BUCKET
      ? {
          [Modules.FILE]: {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    region: process.env.S3_REGION,
                    bucket: process.env.S3_BUCKET,
                    endpoint: process.env.S3_ENDPOINT,
                  },
                },
              ],
            },
          },
        }
      : {}),

    // ── Nodemailer SMTP Notification Provider ─────────────────────────────
    ...(process.env.SMTP_HOST
      ? {
          [Modules.NOTIFICATION]: {
            resolve: "@medusajs/medusa/notification",
            options: {
              providers: [
                {
                  resolve: "@perseidesjs/notification-nodemailer",
                  id: "nodemailer",
                  options: {
                    channels: ["email"],
                    from: process.env.SMTP_FROM,
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT || "587"),
                    secure: process.env.SMTP_SECURE === "true",
                    auth: {
                      user: process.env.SMTP_USER,
                      pass: process.env.SMTP_PASS,
                    },
                  },
                },
              ],
            },
          },
        }
      : {}),

    // ── Production: Redis event bus, workflow engine, cache & locking ──────
    ...(process.env.REDIS_URL
      ? {
          [Modules.EVENT_BUS]: {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: { redisUrl: process.env.REDIS_URL },
          },
          [Modules.WORKFLOW_ENGINE]: {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: {
              redis: { url: process.env.REDIS_URL },
            },
          },
          [Modules.CACHE]: {
            resolve: "@medusajs/medusa/cache-redis",
            options: {
              redisUrl: process.env.CACHE_REDIS_URL || process.env.REDIS_URL,
            },
          },
          [Modules.LOCKING]: {
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/locking-redis",
                  id: "locking-redis",
                  is_default: true,
                  options: {
                    redisUrl:
                      process.env.LOCKING_REDIS_URL || process.env.REDIS_URL,
                  },
                },
              ],
            },
          },
        }
      : {
          [Modules.WORKFLOW_ENGINE]: {
            resolve: "@medusajs/medusa/workflow-engine-inmemory",
          },
        }),
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    storefrontUrl: process.env.MEDUSA_STOREFRONT_URL || "http://localhost:8000",
    vite: () => ({
      server: {
        host: "0.0.0.0",
        allowedHosts: ["localhost", ".localhost", "127.0.0.1"],
        hmr: {
          // HMR websocket port inside container (dev only)
          port: 5173,
          clientPort: 5173,
        },
      },
    }),
  },
});
