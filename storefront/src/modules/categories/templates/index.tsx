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
}: {
  categories: HttpTypes.StoreProductCategory[]
  currentCategory: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  view?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const gridView = view ?? "3"

  if (!currentCategory || !countryCode) notFound()

  return (
    <div className="bg-background">
      <div
        className="flex flex-col py-8 content-container gap-6"
        data-testid="category-container"
      >
        <CategoryBreadcrumb
          categories={categories}
          category={currentCategory}
        />
        <div className="flex flex-col small:flex-row small:items-start gap-6">
          <RefinementList
            sortBy={sort}
            categories={categories}
            currentCategory={currentCategory}
            listName={currentCategory.name}
            data-testid="sort-by-container"
          />
          <div className="w-full flex flex-col gap-3">
            <StoreToolbar sortBy={sort} />
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
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

