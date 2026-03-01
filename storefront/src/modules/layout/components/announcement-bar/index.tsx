"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export type Announcement = {
  id: string
  message: string
  code?: string
  cta_text?: string
  cta_href?: string
  expires_at?: string | null
}

interface AnnouncementBarProps {
  announcements: Announcement[]
  /** Auto-advance interval in ms (default 5000) */
  interval?: number
}

export function AnnouncementBar({
  announcements,
  interval = 5000,
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false)
  const [index, setIndex] = useState(0)

  const count = announcements.length

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count]
  )
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])

  // Auto-advance when there are multiple items
  useEffect(() => {
    if (count <= 1) return
    const id = setInterval(next, interval)
    return () => clearInterval(id)
  }, [count, interval, next])

  if (dismissed || count === 0) return null

  const current = announcements[index]

  return (
    <div className="relative flex items-center justify-center gap-3 bg-primary px-10 py-2 text-center text-xs text-primary-foreground">
      {/* Prev arrow — only shown with multiple items */}
      {count > 1 && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Previous announcement"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      <span>
        {current.message}
        {current.code && (
          <>
            {" · "}
            <strong className="font-semibold">{current.code}</strong>
          </>
        )}
      </span>

      {current.cta_href && current.cta_text && (
        <LocalizedClientLink
          href={current.cta_href}
          className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
        >
          {current.cta_text} →
        </LocalizedClientLink>
      )}

      {/* Dot indicators — only with multiple items */}
      {count > 1 && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1 rounded-full transition-all ${
                i === index
                  ? "w-3 bg-primary-foreground"
                  : "w-1 bg-primary-foreground/40"
              }`}
              aria-label={`Go to announcement ${i + 1}`}
            />
          ))}
        </span>
      )}

      {/* Next arrow */}
      {count > 1 && (
        <button
          onClick={next}
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Next announcement"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
