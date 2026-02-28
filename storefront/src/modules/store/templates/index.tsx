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
        className="flex flex-col py-8 content-container gap-6"
        data-testid="category-container"
      >
        <StoreBreadcrumb />
        <div className="flex flex-col small:flex-row small:items-start gap-6">
          <RefinementList sortBy={sort} categories={categories} />
          <div className="w-full flex flex-col gap-3">
            <StoreToolbar sortBy={sort} />
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

