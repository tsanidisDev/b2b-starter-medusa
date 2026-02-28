import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import SquareMinus from "@/modules/common/icons/square-minus"
import SquarePlus from "@/modules/common/icons/square-plus"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { cn } from "@/lib/utils"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const CategoryList = ({
  categories,
  currentCategory,
}: {
  categories: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
}) => {
  const getCategoriesToExpand = useCallback(
    (category: HttpTypes.StoreProductCategory) => {
      const ids = [category.id]
      let current = category
      while (current.parent_category_id) {
        ids.push(current.parent_category_id)
        current = categories.find((c) => c.id === current.parent_category_id) as HttpTypes.StoreProductCategory
      }
      return ids
    },
    [categories]
  )

  const [expandedCategories, setExpandedCategories] = useState<string[]>(() =>
    currentCategory ? getCategoriesToExpand(currentCategory) : []
  )

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const toggleCategory = (id: string) =>
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const isCurrentCategory = (handle: string) =>
    pathname.split("/").slice(2).join("/") === `categories/${handle}`

  useEffect(() => {
    if (currentCategory) {
      const toExpand = getCategoriesToExpand(currentCategory)
      setExpandedCategories((prev) => {
        const next = toExpand.filter((id) => !prev.includes(id))
        return next.length ? [...prev, ...next] : prev
      })
    }
  }, [currentCategory, getCategoriesToExpand])

  const getDepth = useCallback(
    (category: HttpTypes.StoreProductCategory): number => {
      let depth = 0
      let current = category
      while (current.parent_category_id) {
        depth++
        current = categories.find((c) => c.id === current.parent_category_id) as HttpTypes.StoreProductCategory
      }
      return depth
    },
    [categories]
  )

  const renderCategory = (category: HttpTypes.StoreProductCategory) => {
    const hasChildren = category.category_children.length > 0
    const isExpanded = expandedCategories.includes(category.id)
    const depth = getDepth(category)
    const isCurrent = isCurrentCategory(category.handle)
    const qs = searchParams.size ? `?${searchParams.toString()}` : ""

    return (
      <li key={category.id}>
        <div
          className={cn("flex items-center gap-1.5 py-1", {
            "pl-0": depth === 0,
            "pl-4": depth === 1,
            "pl-8": depth >= 2,
          })}
        >
          {hasChildren && (
            <button
              onClick={() => toggleCategory(category.id)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {isExpanded ? (
                <SquareMinus className="h-3 w-3" />
              ) : (
                <SquarePlus className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && (
            <span
              className={cn("h-1 w-1 rounded-full shrink-0 transition-colors", {
                "bg-primary": isCurrent,
                "bg-border": !isCurrent,
              })}
            />
          )}
          <LocalizedClientLink
            href={`/categories/${category.handle}${qs}`}
            className={cn(
              "text-xs leading-snug transition-colors",
              isCurrent
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {category.name}
          </LocalizedClientLink>
        </div>

        {hasChildren && isExpanded && (
          <ul>
            {category.category_children.map((child) => {
              const childCategory = categories.find((c) => c.id === child.id)
              return childCategory ? renderCategory(childCategory) : null
            })}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <Text className="text-xs font-semibold uppercase tracking-widest text-foreground">
          Categories
        </Text>
        {pathname.includes("/categories") && (
          <LocalizedClientLink
            href="/store"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </LocalizedClientLink>
        )}
      </div>
      <ul className="flex flex-col py-2 px-3">
        {categories
          .filter((c) => c.parent_category_id === null)
          .map(renderCategory)}
      </ul>
    </div>
  )
}

export default CategoryList
