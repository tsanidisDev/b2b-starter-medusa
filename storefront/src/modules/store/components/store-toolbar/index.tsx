"use client"

import { cn } from "@/lib/utils"
import SortProducts, {
  SortOptions,
} from "@/modules/store/components/refinement-list/sort-products"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

// SVG icon components for each grid layout
const Grid2Icon = () => (
  <svg viewBox="0 0 10 10" className="h-3.5 w-3.5" fill="currentColor">
    <rect x="0" y="0" width="4" height="4" rx="0.5" />
    <rect x="6" y="0" width="4" height="4" rx="0.5" />
    <rect x="0" y="6" width="4" height="4" rx="0.5" />
    <rect x="6" y="6" width="4" height="4" rx="0.5" />
  </svg>
)

const Grid3Icon = () => (
  <svg viewBox="0 0 14 10" className="h-3.5 w-3.5" fill="currentColor">
    <rect x="0" y="0" width="3.5" height="4" rx="0.5" />
    <rect x="5.25" y="0" width="3.5" height="4" rx="0.5" />
    <rect x="10.5" y="0" width="3.5" height="4" rx="0.5" />
    <rect x="0" y="6" width="3.5" height="4" rx="0.5" />
    <rect x="5.25" y="6" width="3.5" height="4" rx="0.5" />
    <rect x="10.5" y="6" width="3.5" height="4" rx="0.5" />
  </svg>
)

const Grid4Icon = () => (
  <svg viewBox="0 0 18 10" className="h-3.5 w-3.5" fill="currentColor">
    <rect x="0" y="0" width="3" height="4" rx="0.4" />
    <rect x="5" y="0" width="3" height="4" rx="0.4" />
    <rect x="10" y="0" width="3" height="4" rx="0.4" />
    <rect x="15" y="0" width="3" height="4" rx="0.4" />
    <rect x="0" y="6" width="3" height="4" rx="0.4" />
    <rect x="5" y="6" width="3" height="4" rx="0.4" />
    <rect x="10" y="6" width="3" height="4" rx="0.4" />
    <rect x="15" y="6" width="3" height="4" rx="0.4" />
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 14 10" className="h-3.5 w-3.5" fill="currentColor">
    <rect x="0" y="0" width="14" height="2.5" rx="0.5" />
    <rect x="0" y="3.75" width="14" height="2.5" rx="0.5" />
    <rect x="0" y="7.5" width="14" height="2.5" rx="0.5" />
  </svg>
)

const GRID_VIEWS = [
  { value: "2", Icon: Grid2Icon, label: "2-column grid" },
  { value: "3", Icon: Grid3Icon, label: "3-column grid" },
  { value: "4", Icon: Grid4Icon, label: "4-column grid" },
  { value: "list", Icon: ListIcon, label: "List view" },
] as const

type StoreToolbarProps = {
  sortBy: SortOptions
  "data-testid"?: string
}

export default function StoreToolbar({
  sortBy,
  "data-testid": dataTestId,
}: StoreToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view = searchParams.get("view") ?? "3"

  const setQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card px-3 py-2"
      data-testid={dataTestId}
    >
      {/* Grid / List icon toggle */}
      <div className="flex items-center gap-0.5">
        {GRID_VIEWS.map(({ value, Icon, label }) => (
          <button
            key={value}
            onClick={() => setQueryParams("view", value)}
            title={label}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              view === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon />
          </button>
        ))}
      </div>

      {/* Sort */}
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} />
    </div>
  )
}
