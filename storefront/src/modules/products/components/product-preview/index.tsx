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

  const isLowStock =
    inventoryQuantity !== undefined &&
    inventoryQuantity <= 10 &&
    inventoryQuantity > 0
  const isOutOfStock = inventoryQuantity === 0

  const isSale =
    cheapestPrice?.price_type === "sale" &&
    cheapestPrice?.percentage_diff &&
    Number(cheapestPrice.percentage_diff) > 0

  const discountLabel = isSale ? `-${cheapestPrice!.percentage_diff}%` : null

  // Check if product was created recently (within last 30 days)
  const isNew =
    product.created_at &&
    Date.now() - new Date(product.created_at).getTime() <
      30 * 24 * 60 * 60 * 1000

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <div
        data-testid="product-wrapper"
        className="flex flex-col gap-3 overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-shadow duration-200 group-hover:shadow-md"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="square"
            isFeatured={isFeatured}
          />

          {/* Badges — top-left */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discountLabel && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
                {discountLabel}
              </span>
            )}
            {isNew && !isSale && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                New
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                Low stock
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 px-3 pb-3">
          <div className="flex flex-col gap-0.5">
            <Text className="truncate text-xs uppercase tracking-wider text-muted-foreground">
              {product.collection?.title ?? "Silk"}
            </Text>
            <Text
              className="truncate text-sm font-medium text-foreground"
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

