"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SortProducts, { SortOptions } from "./sort-products"
import SearchInResults from "./search-in-results"
import { HttpTypes } from "@medusajs/types"
import CategoryList from "./category-list"

type RefinementListProps = {
  sortBy: SortOptions
  listName?: string
  "data-testid"?: string
  categories?: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
}

const RefinementList = ({
  sortBy,
  listName,
  "data-testid": dataTestId,
  categories,
  currentCategory,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <div className="flex flex-col small:w-[220px] w-full gap-2 shrink-0">
      <div className="flex flex-col border border-border rounded-[var(--radius)] bg-card overflow-hidden">
        <SearchInResults listName={listName} />
        <div className="border-t border-border">
          <SortProducts
            sortBy={sortBy}
            setQueryParams={setQueryParams}
            data-testid={dataTestId}
          />
        </div>
      </div>
      {categories && (
        <div className="border border-border rounded-[var(--radius)] bg-card overflow-hidden">
          <CategoryList
            categories={categories}
            currentCategory={currentCategory}
          />
        </div>
      )}
    </div>
  )
}

export default RefinementList
