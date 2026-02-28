import { listProductsWithSort } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import ProductPreview from "@/modules/products/components/product-preview"
import { Pagination } from "@/modules/store/components/pagination"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { B2BCustomer } from "@/types"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  customer_group_id?: string
}

const GRID_COLS: Record<string, string> = {
  "2": "grid-cols-1 small:grid-cols-2",
  "3": "grid-cols-1 small:grid-cols-2 medium:grid-cols-3",
  "4": "grid-cols-1 small:grid-cols-3 medium:grid-cols-4",
  list: "grid-cols-1",
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  customer,
  view = "3",
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  customer?: B2BCustomer | null
  view?: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  } else if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const gridClass = GRID_COLS[view] ?? GRID_COLS["3"]

  return (
    <div className="flex flex-col gap-4">
      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {count === 0
          ? "No products found"
          : count === 1
            ? "1 product found"
            : `${count} products found`}
      </p>

      <ul
        className={`grid w-full gap-4 ${gridClass}`}
        data-testid="products-list"
      >
        {products.length > 0 ? (
          products.map((p) => (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          ))
        ) : (
          <li className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-muted-foreground">No products found.</p>
          </li>
        )}
      </ul>

      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </div>
  )
}

