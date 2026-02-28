import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import Image from "next/image"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import PlaceholderImage from "@/modules/common/icons/placeholder-image"
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
  const productImage = product.thumbnail || product.images?.[0]?.url

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      {isList ? (
        /* ── Compact list row ── */
        <div
          data-testid="product-wrapper"
          className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-card px-3 py-3 transition-shadow duration-200 group-hover:shadow-md"
        >
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
            <div className="flex items-center gap-3 shrink-0">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
              <PreviewAddToCart product={product} region={region} />
            </div>
          </div>
        </div>
      ) : (
        /* ── Portrait grid card ── */
        <div
          data-testid="product-wrapper"
          className="flex flex-col overflow-hidden rounded-[var(--radius)] bg-card border border-border/30 transition-all duration-300 group-hover:border-border/70 group-hover:shadow-xl"
        >
          {/* Image — portrait 3:4 ratio */}
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            {productImage ? (
              <Image
                src={productImage}
                alt={product.title ?? "Product"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlaceholderImage className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}

            {/* Badges — top-left */}
            <div className="absolute left-2 top-2 flex flex-col gap-1">
              {discountLabel && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground shadow-sm">
                  {discountLabel}
                </span>
              )}
              {isNew && !isSale && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                  New
                </span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground shadow-sm">
                  Low stock
                </span>
              )}
            </div>

            {/* Sold-out overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                  Sold out
                </span>
              </div>
            )}

            {/* Hover CTA — slides up from bottom */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
              <div className="flex w-full items-center justify-center rounded-md bg-background/92 backdrop-blur-md py-2.5 text-sm font-medium text-foreground shadow border border-border/20">
                Select options
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1 px-3 py-3">
            <Text
              className="text-sm font-medium text-foreground leading-snug line-clamp-2"
              data-testid="product-title"
            >
              {product.title}
            </Text>
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      )}
    </LocalizedClientLink>
  )
}

