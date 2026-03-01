"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const MegaMenu = ({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<
    HttpTypes.StoreProductCategory["id"] | null
  >(null)

  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const menuTimer = useRef<NodeJS.Timeout | null>(null)
  const catTimer = useRef<NodeJS.Timeout | null>(null)

  const mainCategories = categories.filter((c) => !c.parent_category_id)

  const getSubCategories = (id: string) =>
    categories.filter((c) => c.parent_category_id === id)

  const openMenu = () => {
    if (menuTimer.current) clearTimeout(menuTimer.current)
    setIsOpen(true)
    if (!selectedCategory && mainCategories.length > 0) {
      setSelectedCategory(mainCategories[0].id)
    }
  }

  const closeMenu = () => {
    menuTimer.current = setTimeout(() => setIsOpen(false), 250)
  }

  const hoverCategory = (id: string) => {
    if (catTimer.current) clearTimeout(catTimer.current)
    catTimer.current = setTimeout(() => setSelectedCategory(id), 120)
  }

  const clearCatTimer = () => {
    if (catTimer.current) clearTimeout(catTimer.current)
  }

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const activeCategoryData = mainCategories.find(
    (c) => c.id === selectedCategory
  )
  const subCategories = selectedCategory ? getSubCategories(selectedCategory) : []

  return (
    <>
      <div
        ref={menuRef}
        onMouseEnter={openMenu}
        onMouseLeave={closeMenu}
        className="relative z-50"
      >
        <LocalizedClientLink
          href="/store"
          className={clx(
            "flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors",
            isOpen
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          Products
          <ChevronRight
            className={clx(
              "h-3 w-3 transition-transform",
              isOpen ? "rotate-90" : "rotate-0"
            )}
          />
        </LocalizedClientLink>

        {isOpen && (
          <div
            className="fixed left-0 right-0 top-16 z-50 border-b border-border bg-background shadow-xl"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            <div className="content-container mx-auto flex gap-0 py-8">
              {/* Left column — main categories */}
              <div className="w-52 shrink-0 border-r border-border pr-4">
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Browse
                </p>
                <ul className="flex flex-col gap-0.5">
                  {mainCategories.map((cat) => {
                    const hasSubs = getSubCategories(cat.id).length > 0
                    return (
                      <li key={cat.id}>
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          className={clx(
                            "group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                            selectedCategory === cat.id
                              ? "bg-accent text-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                          onMouseEnter={() => hoverCategory(cat.id)}
                          onMouseLeave={clearCatTimer}
                        >
                          <span>{cat.name}</span>
                          {hasSubs && (
                            <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                          )}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-4 border-t border-border pt-3 px-3">
                  <LocalizedClientLink
                    href="/store"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all products →
                  </LocalizedClientLink>
                </div>
              </div>

              {/* Right column — subcategories */}
              <div className="flex-1 pl-8">
                {activeCategoryData && (
                  <>
                    <div className="mb-4 flex items-center gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {activeCategoryData.name}
                      </p>
                      <LocalizedClientLink
                        href={`/categories/${activeCategoryData.handle}`}
                        className="text-[10px] text-primary hover:underline"
                      >
                        See all
                      </LocalizedClientLink>
                    </div>
                    {subCategories.length > 0 ? (
                      <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                        {subCategories.map((sub) => {
                          const grandChildren = getSubCategories(sub.id)
                          return (
                            <div key={sub.id} className="flex flex-col gap-1.5">
                              <LocalizedClientLink
                                href={`/categories/${sub.handle}`}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                              >
                                {sub.name}
                              </LocalizedClientLink>
                              {grandChildren.length > 0 && (
                                <ul className="flex flex-col gap-1">
                                  {grandChildren.map((gc) => (
                                    <li key={gc.id}>
                                      <LocalizedClientLink
                                        href={`/categories/${gc.handle}`}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        {gc.name}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No subcategories — browse all {activeCategoryData.name} products
                      </p>
                    )}
                  </>
                )}
                {!activeCategoryData && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Hover a category to explore
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-background/20 backdrop-blur-[2px]"
          onMouseEnter={closeMenu}
        />
      )}
    </>
  )
}

export default MegaMenu
