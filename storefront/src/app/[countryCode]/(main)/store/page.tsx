import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreToolbar from "@/modules/store/components/store-toolbar"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    view?: string
    in_stock?: string
    out_of_stock?: string
    min_price?: string
    max_price?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, view, q } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1
  const gridView = view ?? "3"

  const categories = await listCategories()
  const customer = await retrieveCustomer()

  return (
    <div className="bg-background">
      <div
        className="content-container pt-4 pb-12"
        data-testid="category-container"
      >
        {/* Sticky breadcrumb */}
        <div className="sticky top-16 z-20 -mx-6 px-6 py-2.5 border-b border-border/40 mb-4" style={{backgroundColor: 'color-mix(in oklch, var(--background) 80%, transparent)', backdropFilter: 'blur(8px)'}}>
          <StoreBreadcrumb />
        </div>

        <div className="flex flex-col small:flex-row gap-4 items-start">
          {/* Sticky sidebar */}
          <div className="small:sticky small:top-[calc(4rem+49px)] small:self-start small:max-h-[calc(100vh-4rem-49px)] small:overflow-y-auto small:shrink-0 w-full small:w-[220px]">
            <RefinementList sortBy={sort} categories={categories} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="sticky top-[calc(4rem+49px)] z-30" style={{backgroundColor: 'color-mix(in oklch, var(--background) 85%, transparent)', backdropFilter: 'blur(8px)'}}>
              <StoreToolbar sortBy={sort} />
            </div>
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={params.countryCode}
                customer={customer}
                view={gridView}
                q={q}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
