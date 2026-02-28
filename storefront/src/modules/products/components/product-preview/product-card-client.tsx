"use client"

import { useState } from "react"
import Image from "next/image"
import { Eye, Heart, Layers, ShoppingBag } from "lucide-react"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { cn } from "@/lib/utils"
import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { VariantPrice } from "@/lib/util/get-product-price"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import PlaceholderImage from "@/modules/common/icons/placeholder-image"
import Thumbnail from "../thumbnail"
import PreviewAddToCart from "./preview-add-to-cart"
import PreviewPrice from "./price"
import ProductQuickViewDialog from "./product-quick-view"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  cheapestPrice: VariantPrice | null
  view?: string
  isFeatured?: boolean
  discountLabel: string | null
  isNew: boolean
  isLowStock: boolean
  isOutOfStock: boolean
}

export default function ProductCardClient({
  product,
  region,
  cheapestPrice,
  view = "grid",
  discountLabel,
  isNew,
  isLowStock,
  isOutOfStock,
}: Props) {
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const productImage = product.thumbnail || product.images?.[0]?.url
  const isList = view === "list"

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product?.variants?.[0]?.id) return
    setIsAdding(true)
    addToCartEventBus.emitCartAdd({
      lineItems: [{ productVariant: { ...product.variants[0], product }, quantity: 1 }],
      regionId: region.id,
    })
    setTimeout(() => setIsAdding(false), 800)
  }

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewOpen(true)
  }

  return (
    <>
      <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
        {isList ? (
          /* ── Compact list row ── */
          <div
            data-testid="product-wrapper"
            className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-card px-3 py-3 transition-shadow duration-200 group-hover:shadow-md"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
              <Thumbnail thumbnail={product.thumbnail} images={product.images} size="square" />
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Out</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
              <div className="flex flex-col gap-0.5 min-w-0">
                <Text className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {product.collection?.title ?? ""}
                </Text>
                <Text className="truncate text-sm font-medium text-foreground" data-testid="product-title">
                  {product.title}
                </Text>
                <div className="flex items-center gap-1 mt-0.5">
                  {discountLabel && (
                    <span className="rounded-full bg-destructive px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-destructive-foreground">
                      {discountLabel}
                    </span>
                  )}
                  {isNew && !discountLabel && (
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
              <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
                {discountLabel && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground shadow-sm">
                    {discountLabel}
                  </span>
                )}
                {isNew && !discountLabel && (
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

              {/* Action buttons — top-right, appear on hover */}
              <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md text-foreground/60 hover:text-foreground transition-colors backdrop-blur-sm"
                  title="Add to wishlist"
                >
                  <Heart className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md text-foreground/60 hover:text-foreground transition-colors backdrop-blur-sm"
                  title="Compare"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={openQuickView}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md text-foreground/60 hover:text-foreground transition-colors backdrop-blur-sm"
                  title="Quick view"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md transition-colors backdrop-blur-sm",
                    isAdding
                      ? "text-primary"
                      : "text-foreground/60 hover:text-foreground",
                    isOutOfStock && "opacity-40 cursor-not-allowed"
                  )}
                  title="Add to cart"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                </button>
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
              <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
                <button
                  onClick={openQuickView}
                  className="flex w-full items-center justify-center rounded-full bg-background/92 backdrop-blur-md py-2.5 text-sm font-semibold text-foreground shadow border border-border/20 hover:bg-background transition-colors"
                >
                  Select Options
                </button>
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

      <ProductQuickViewDialog
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        product={product}
        region={region}
        cheapestPrice={cheapestPrice}
      />
    </>
  )
}
