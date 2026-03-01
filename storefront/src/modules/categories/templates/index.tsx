import CategoryBreadcrumb from "@/modules/categories/category-breadcrumb"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreToolbar from "@/modules/store/components/store-toolbar"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { ArrowUturnLeft } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { notFound } from "next/navigation"
import { Suspense } from "react"

export default function CategoryTemplate({
  categories,
  currentCategory,
  sortBy,
  page,
  countryCode,
  view,
  q,
}: {
  categories: HttpTypes.StoreProductCategory[]
  currentCategory: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  view?: string
  q?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const gridView = view ?? "3"

  if (!currentCategory || !countryCode) notFound()

  return (
    <div className="bg-background">
      <div
        className="content-container pt-4 pb-12"
        data-testid="category-container"
      >
        {/* Sticky breadcrumb */}
        <div className="sticky top-16 z-20 -mx-6 px-6 py-2.5 border-b border-border/40 mb-4" style={{backgroundColor: 'color-mix(in oklch, var(--background) 80%, transparent)', backdropFilter: 'blur(8px)'}}>
          <CategoryBreadcrumb
            categories={categories}
            category={currentCategory}
          />
        </div>

        <div className="flex flex-col small:flex-row gap-4 items-start">
          {/* Sticky sidebar — scrolls independently */}
          <div className="small:sticky small:top-[calc(4rem+49px)] small:self-start small:max-h-[calc(100vh-4rem-49px)] small:overflow-y-auto small:shrink-0 w-full small:w-[220px]">
            <RefinementList
              sortBy={sort}
              categories={categories}
              currentCategory={currentCategory}
              listName={currentCategory.name}
              data-testid="sort-by-container"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="sticky top-[calc(4rem+49px)] z-30" style={{backgroundColor: 'color-mix(in oklch, var(--background) 85%, transparent)', backdropFilter: 'blur(8px)'}}>
              <StoreToolbar sortBy={sort} />
            </div>

            {currentCategory.products?.length === 0 ? (
              <div className="flex flex-col gap-4 items-center justify-center py-20 text-center">
                <Text className="text-sm text-muted-foreground">
                  No products found in this category.
                </Text>
                <LocalizedClientLink
                  href="/store"
                  className="flex gap-2 items-center"
                >
                  <Button variant="secondary">
                    <ArrowUturnLeft className="w-4 h-4" />
                    Back to all products
                  </Button>
                </LocalizedClientLink>
              </div>
            ) : (
              <Suspense
                fallback={
                  <SkeletonProductGrid
                    count={currentCategory.products?.length}
                  />
                }
              >
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={currentCategory.id}
                  countryCode={countryCode}
                  view={gridView}
                  q={q}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

