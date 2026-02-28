import { getProductsById } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import ProductPreview from "@/modules/products/components/product-preview"
import { ArrowRight } from "lucide-react"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const { products } = collection

  if (!products) {
    return null
  }

  const productsWithPrices = await getProductsById({
    ids: products.map((p) => p.id!),
    regionId: region.id,
  })

  if (!productsWithPrices?.length) {
    return null
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="content-container">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Collection
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {collection.title}
            </h2>
          </div>
          <LocalizedClientLink
            href={`/collections/${collection.handle}`}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0 ml-4"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </LocalizedClientLink>
        </div>

        {/* Product grid */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {productsWithPrices.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

