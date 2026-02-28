"use client"

import { cn } from "@/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const options = [
  { label: "In stock", param: "in_stock" },
  { label: "Out of stock", param: "out_of_stock" },
]

export default function AvailabilityFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const toggle = useCallback(
    (param: string, checked: boolean) => {
      const params = new URLSearchParams(searchParams.toString())
      if (checked) {
        params.set(param, "true")
      } else {
        params.delete(param)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {options.map(({ label, param }) => {
        const checked = searchParams.get(param) === "true"
        return (
          <label
            key={param}
            className="flex cursor-pointer items-center gap-2.5 group"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                checked
                  ? "border-primary bg-primary"
                  : "border-border bg-background group-hover:border-primary/60"
              )}
            >
              {checked && (
                <svg
                  className="h-2.5 w-2.5 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={(e) => toggle(param, e.target.checked)}
            />
            <span
              className={cn(
                "text-xs transition-colors",
                checked
                  ? "text-foreground font-medium"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              {label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
