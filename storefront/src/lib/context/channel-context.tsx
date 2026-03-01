"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react"

export type Channel = "b2c" | "b2b"

const COOKIE_NAME = "_medusa_channel"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

interface ChannelContextValue {
  channel: Channel
  isB2B: boolean
  setChannel: (channel: Channel) => void
  isPending: boolean
}

const ChannelContext = createContext<ChannelContextValue>({
  channel: "b2c",
  isB2B: false,
  setChannel: () => {},
  isPending: false,
})

function readChannelCookie(): Channel {
  if (typeof document === "undefined") return "b2c"
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  )
  const value = match ? decodeURIComponent(match[1]) : "b2c"
  return value === "b2b" ? "b2b" : "b2c"
}

function writeChannelCookie(channel: Channel) {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(channel)}`,
    `max-age=${COOKIE_MAX_AGE}`,
    "path=/",
    "samesite=lax",
    ...(secure ? ["secure"] : []),
  ]
  document.cookie = parts.join("; ")
}

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const [channel, setChannelState] = useState<Channel>("b2c")
  const [isPending, startTransition] = useTransition()

  // Hydrate from cookie on mount
  useEffect(() => {
    setChannelState(readChannelCookie())
  }, [])

  const setChannel = useCallback(
    (next: Channel) => {
      writeChannelCookie(next)
      setChannelState(next)
      // Full page reload so middleware re-runs with the new cookie and
      // server components re-fetch with the correct publishable key
      startTransition(() => {
        window.location.reload()
      })
    },
    []
  )

  return (
    <ChannelContext.Provider
      value={{ channel, isB2B: channel === "b2b", setChannel, isPending }}
    >
      {children}
    </ChannelContext.Provider>
  )
}

export function useChannel() {
  return useContext(ChannelContext)
}
