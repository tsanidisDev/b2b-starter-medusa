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
  view = "grid",
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  view?: string
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

  const isNew =
    product.created_at &&
    Date.now() - new Date(product.created_at).getTime() <
      30 * 24 * 60 * 60 * 1000

  const isList = view === "list"

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      {isList ? (
        /* ── List row layout ── */
        <div
          data-testid="product-wrapper"
          className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-card px-3 py-3 transition-shadow duration-200 group-hover:shadow-md"
        >
          {/* Small thumbnail */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="square"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Out</span>
              </div>
            )}
          </div>

          {/* Info — fills remaining space */}
          <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Text className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {product.collection?.title ?? "Silk"}
              </Text>
              <Text
                className="truncate text-sm font-medium text-foreground"
                data-testid="product-title"
              >
                {product.title}
              </Text>
              {/* Badges inline */}
              <div className="flex items-center gap-1 mt-0.5">
                {discountLabel && (
                  <span className="rounded-full bg-destructive px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-destructive-foreground">
                    {discountLabel}
                  </span>
                )}
                {isNew && !isSale && (
                  <span className="rounded-full bg-primary px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                    New
                  </span>
                )}
                {isLowStock && !isOutOfStock && (
                  <span className="rounded-full bg-accent px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-accent-foreground">
                    Low stock
                  </span>
                )}
                {isOutOfStock && (
                  <span className="text-[10px] text-muted-foreground">Sold out</span>
                )}
              </div>
            </div>

            {/* Price + add to cart */}
            <div className="flex items-center gap-3 shrink-0">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
              <PreviewAddToCart product={product} region={region} />
            </div>
          </div>
        </div>
      ) : (
        /* ── Grid card layout ── */
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
      )}
    </LocalizedClientLink>
  )
}

