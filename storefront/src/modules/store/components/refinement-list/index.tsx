"use client"

import { cn } from "@/lib/utils"
import { HttpTypes } from "@medusajs/types"
import { ChevronDown } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import AvailabilityFilter from "./availability-filter"
import CategoryList from "./category-list"
import PriceFilter from "./price-filter"
import SearchInResults from "./search-in-results"
import { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  listName?: string
  "data-testid"?: string
  categories?: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

const RefinementList = ({
  sortBy,
  listName,
  "data-testid": dataTestId,
  categories,
  currentCategory,
}: RefinementListProps) => {
  const searchParams = useSearchParams()
  const activeFilters = [
    searchParams.get("in_stock") === "true",
    searchParams.get("out_of_stock") === "true",
    !!searchParams.get("min_price"),
    !!searchParams.get("max_price"),
  ].filter(Boolean).length

  return (
    <div
      className="flex w-full shrink-0 flex-col gap-3 small:w-[240px]"
      data-testid={dataTestId}
    >
      {/* Search */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <SearchInResults listName={listName} />
      </div>

      {/* Filter panel */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Filters
          </span>
          {activeFilters > 0 && (
            <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </div>

        {categories && categories.length > 0 && (
          <FilterSection title="Category" defaultOpen={true}>
            <CategoryList
              categories={categories}
              currentCategory={currentCategory}
            />
          </FilterSection>
        )}

        <FilterSection title="Availability" defaultOpen={true}>
          <AvailabilityFilter />
        </FilterSection>

        <FilterSection title="Price" defaultOpen={false}>
          <PriceFilter />
        </FilterSection>
      </div>
    </div>
  )
}

export default RefinementList

