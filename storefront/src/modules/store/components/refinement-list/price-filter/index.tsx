"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export default function PriceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [min, setMin] = useState(searchParams.get("min_price") ?? "")
  const [max, setMax] = useState(searchParams.get("max_price") ?? "")

  // Keep local state in sync when URL changes externally
  useEffect(() => {
    setMin(searchParams.get("min_price") ?? "")
    setMax(searchParams.get("max_price") ?? "")
  }, [searchParams])

  const apply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (min) params.set("min_price", min)
    else params.delete("min_price")
    if (max) params.set("max_price", max)
    else params.delete("max_price")
    router.push(`${pathname}?${params.toString()}`)
  }, [min, max, router, pathname, searchParams])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") apply()
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
            Min
          </label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={apply}
            onKeyDown={handleKey}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="mb-2 text-xs text-muted-foreground">–</span>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
            Max
          </label>
          <input
            type="number"
            min={0}
            placeholder="∞"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={apply}
            onKeyDown={handleKey}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      {(min || max) && (
        <button
          onClick={() => {
            setMin("")
            setMax("")
            const params = new URLSearchParams(searchParams.toString())
            params.delete("min_price")
            params.delete("max_price")
            router.push(`${pathname}?${params.toString()}`)
          }}
          className="text-left text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Clear price range
        </button>
      )}
    </div>
  )
}
