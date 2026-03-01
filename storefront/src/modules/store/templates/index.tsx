import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreToolbar from "@/modules/store/components/store-toolbar"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  categories,
  view,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categories?: HttpTypes.StoreProductCategory[]
  view?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const gridView = view ?? "3"

  return (
    <div className="bg-background">
      <div
        className="content-container pt-4 pb-12"
        data-testid="category-container"
      >
        {/* Sticky breadcrumb */}
        <div className="sticky top-16 z-20 -mx-6 px-6 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border/40 mb-4">
          <StoreBreadcrumb />
        </div>

        <div className="flex flex-col small:flex-row gap-4 items-start">
          {/* Sticky sidebar */}
          <div className="small:sticky small:top-[calc(4rem+49px)] small:self-start small:max-h-[calc(100vh-4rem-49px)] small:overflow-y-auto small:shrink-0 w-full small:w-[220px]">
            <RefinementList sortBy={sort} categories={categories} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Sticky toolbar */}
            <div className="sticky top-[calc(4rem+49px)] z-10 bg-background/95 backdrop-blur-sm py-1 -mx-1 px-1">
              <StoreToolbar sortBy={sort} />
            </div>
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={countryCode}
                view={gridView}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate

