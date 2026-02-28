import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import ProductPreview from "@/modules/products/components/product-preview"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default async function NewArrivals({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const {
    response: { products },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 8,
      order: "-created_at",
      fields: "*variants.calculated_price,*variants.inventory_quantity",
    },
    countryCode,
  })

  if (!products?.length) return null

  return (
    <section className="bg-background py-16 small:py-24">
      <div className="content-container mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Just dropped
            </p>
            <h2 className="text-2xl small:text-3xl font-semibold text-foreground tracking-tight">
              New arrivals
            </h2>
          </div>
          <LocalizedClientLink
            href="/store?sortBy=created_at"
            className="text-sm text-primary hover:underline underline-offset-4 hidden small:block"
          >
            View all →
          </LocalizedClientLink>
        </div>

        {/* Grid */}
        <ul className="grid grid-cols-2 small:grid-cols-4 gap-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center small:hidden">
          <LocalizedClientLink
            href="/store?sortBy=created_at"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            View all new arrivals →
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
