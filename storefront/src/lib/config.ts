import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
// MEDUSA_BACKEND_URL (non-public, runtime) is used for server-side (SSR/middleware)
// NEXT_PUBLIC_MEDUSA_BACKEND_URL is baked in at build time for client-side (browser)
let MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
