import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewAddToCart from "./preview-add-to-cart"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  if (!product) return null

  const { cheapestPrice } = getProductPrice({ product })

  const inventoryQuantity = product.variants?.reduce(
    (acc, v) => acc + (v?.inventory_quantity || 0),
    0
  )

  const isLowStock = inventoryQuantity !== undefined && inventoryQuantity <= 10 && inventoryQuantity > 0
  const isOutOfStock = inventoryQuantity === 0

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
      <div
        data-testid="product-wrapper"
        className="flex flex-col gap-3 bg-card border border-border rounded-[var(--radius)] overflow-hidden transition-shadow duration-200 group-hover:shadow-md"
      >
        {/* Image */}
        <div className="relative aspect-square bg-secondary overflow-hidden">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="square"
            isFeatured={isFeatured}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Sold out
              </span>
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="absolute top-2 left-2 text-[10px] uppercase tracking-widest font-medium text-accent-foreground bg-accent px-2 py-0.5 rounded-full">
              Low stock
            </span>
          )}
        </div>

        {/* Info */}
        <div className="px-3 pb-3 flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider truncate">
              {product.collection?.title ?? "Silk"}
            </Text>
            <Text
              className="text-sm font-medium text-foreground truncate"
              data-testid="product-title"
            >
              {product.title}
            </Text>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
            <PreviewAddToCart product={product} region={region} />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
