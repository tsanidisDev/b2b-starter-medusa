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
    // Production: Redis event bus (falls back to local in dev when REDIS_URL is unset)
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
