"use client"

import { cn } from "@/lib/utils"
import SortProducts, {
  SortOptions,
} from "@/modules/store/components/refinement-list/sort-products"
import { LayoutGrid, LayoutList, Rows3 } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const GRID_VIEWS = [
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
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
      {/* Grid / List toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground select-none pr-0.5">Columns</span>
        {GRID_VIEWS.map((g) => (
          <button
            key={g.value}
            onClick={() => setQueryParams("view", g.value)}
            title={`${g.value}-column grid`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors",
              view === g.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {g.label}
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-border" />

        <button
          onClick={() => setQueryParams("view", "list")}
          title="List view"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded transition-colors",
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutList className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Sort */}
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} />
    </div>
  )
}
