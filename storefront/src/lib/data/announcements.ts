"use server"

import { sdk } from "@/lib/config"

export type Announcement = {
  id: string
  message: string
  code?: string
  cta_text?: string
  cta_href?: string
  expires_at?: string | null
}

/**
 * Fetches live announcements from the custom /store/announcements backend route.
 * Falls back to an empty array so the bar simply disappears rather than erroring.
 */
export async function listAnnouncements(): Promise<Announcement[]> {
  return sdk.client
    .fetch<{ announcements: Announcement[] }>("/store/announcements", {
      method: "GET",
      cache: "no-store",
    })
    .then(({ announcements }) => announcements)
    .catch(() => [])
}
