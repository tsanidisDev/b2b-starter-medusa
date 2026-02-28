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

/**
 * Returns an SDK instance initialised with the correct publishable key for the
 * current channel (B2C or B2B), determined from the `_medusa_channel` cookie.
 * Use this in Server Actions / Server Components that need channel-aware
 * product or pricing data.
 */
export async function getChannelSDK(): Promise<Medusa> {
  // Lazy import to avoid breaking client bundles that import this module
  const { getPublishableKey } = await import("@/lib/data/cookies")
  const key = await getPublishableKey()
  return new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: process.env.NODE_ENV === "development",
    publishableKey: key,
  })
}
