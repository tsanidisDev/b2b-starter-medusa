"use server"

import "server-only"

import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (token) {
      return { authorization: `Bearer ${token}` }
    }

    return {}
  } catch (error) {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()

  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()

  cookies.delete("_medusa_jwt")
}

// ── Channel (B2C / B2B) ───────────────────────────────────────────────────

export type Channel = "b2c" | "b2b"

const CHANNEL_COOKIE = "_medusa_channel"

export const getActiveChannel = async (): Promise<Channel> => {
  try {
    const cookies = await nextCookies()
    const value = cookies.get(CHANNEL_COOKIE)?.value
    return value === "b2b" ? "b2b" : "b2c"
  } catch {
    return "b2c"
  }
}

export const getPublishableKey = async (): Promise<string> => {
  const channel = await getActiveChannel()
  if (channel === "b2b") {
    return (
      process.env.NEXT_PUBLIC_MEDUSA_B2B_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
      ""
    )
  }
  return (
    process.env.NEXT_PUBLIC_MEDUSA_B2C_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    ""
  )
}

export const getPublishableKeyHeader = async (): Promise<
  { "x-publishable-api-key": string } | {}
> => {
  const key = await getPublishableKey()
  return key ? { "x-publishable-api-key": key } : {}
}

export const setActiveChannel = async (channel: Channel) => {
  const cookies = await nextCookies()
  cookies.set(CHANNEL_COOKIE, channel, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()

  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()

  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()

  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}
