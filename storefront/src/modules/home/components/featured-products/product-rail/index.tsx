import { getProductsById } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@/modules/common/components/interactive-link"
import ProductPreview from "@/modules/products/components/product-preview"

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

  return (
    <section className="bg-background">
      <div className="content-container py-16 small:py-24">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Collection</p>
            <Text className="text-2xl font-semibold text-foreground tracking-tight">
              {collection.title}
            </Text>
          </div>
          <InteractiveLink href={`/collections/${collection.handle}`}>
            View all
          </InteractiveLink>
        </div>
        <ul className="grid grid-cols-1 small:grid-cols-4 gap-4">
          {productsWithPrices &&
            productsWithPrices.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} isFeatured />
              </li>
            ))}
        </ul>
      </div>
    </section>
  )
}
