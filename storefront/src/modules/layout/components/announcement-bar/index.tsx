"use client"

import { useState } from "react"
import { X } from "lucide-react"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative flex items-center justify-center gap-3 bg-primary px-10 py-2 text-center text-xs text-primary-foreground">
      <span>
        Free shipping on B2B orders over $500 ·{" "}
        <strong className="font-semibold">B2BWELCOME</strong> saves 10% on your first order
      </span>
      <LocalizedClientLink
        href="/store"
        className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
      >
        Shop Now →
      </LocalizedClientLink>
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
