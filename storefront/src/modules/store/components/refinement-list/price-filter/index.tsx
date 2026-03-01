"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const PRICE_MIN = 0
const PRICE_MAX = 2000

export default function PriceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [minVal, setMinVal] = useState(
    Number(searchParams.get("min_price") || PRICE_MIN)
  )
  const [maxVal, setMaxVal] = useState(
    Number(searchParams.get("max_price") || PRICE_MAX)
  )

  useEffect(() => {
    setMinVal(Number(searchParams.get("min_price") || PRICE_MIN))
    setMaxVal(Number(searchParams.get("max_price") || PRICE_MAX))
  }, [searchParams])

  const apply = useCallback(
    (min: number, max: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (min > PRICE_MIN) params.set("min_price", String(min))
      else params.delete("min_price")
      if (max < PRICE_MAX) params.set("max_price", String(max))
      else params.delete("max_price")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const minPercent = ((minVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const maxPercent = ((maxVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  // Shared classes for both range thumbs
  const thumbCls =
    "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent " +
    "[&::-webkit-slider-runnable-track]:h-0 [&::-webkit-slider-runnable-track]:bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none " +
    "[&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:w-[14px] " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary " +
    "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background " +
    "[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:w-[14px] " +
    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary " +
    "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background " +
    "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer"

  return (
    <div className="flex flex-col gap-4 px-3 pb-4 pt-3">
      {/* Dual range slider */}
      <div className="relative h-6">
        {/* Base track */}
        <div className="absolute top-1/2 left-1 right-1 h-[3px] -translate-y-1/2 rounded-full bg-border" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary"
          style={{
            left: `calc(${minPercent}% + 2px)`,
            right: `calc(${100 - maxPercent}% + 2px)`,
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={10}
          value={minVal}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), maxVal - 10)
            setMinVal(v)
          }}
          onMouseUp={() => apply(minVal, maxVal)}
          onTouchEnd={() => apply(minVal, maxVal)}
          className={thumbCls}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={10}
          value={maxVal}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), minVal + 10)
            setMaxVal(v)
          }}
          onMouseUp={() => apply(minVal, maxVal)}
          onTouchEnd={() => apply(minVal, maxVal)}
          className={thumbCls}
        />
      </div>

      {/* Min / Max number inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground select-none pointer-events-none">
            €
          </span>
          <input
            type="number"
            min={PRICE_MIN}
            max={maxVal}
            value={minVal === PRICE_MIN ? "" : minVal}
            placeholder="0"
            onChange={(e) =>
              setMinVal(e.target.value === "" ? PRICE_MIN : Number(e.target.value))
            }
            onBlur={() => apply(minVal, maxVal)}
            className="w-full rounded-md border border-border bg-background pl-6 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">—</span>
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground select-none pointer-events-none">
            €
          </span>
          <input
            type="number"
            min={minVal}
            max={PRICE_MAX}
            value={maxVal === PRICE_MAX ? "" : maxVal}
            placeholder={String(PRICE_MAX)}
            onChange={(e) =>
              setMaxVal(e.target.value === "" ? PRICE_MAX : Number(e.target.value))
            }
            onBlur={() => apply(minVal, maxVal)}
            className="w-full rounded-md border border-border bg-background pl-6 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  )
}
