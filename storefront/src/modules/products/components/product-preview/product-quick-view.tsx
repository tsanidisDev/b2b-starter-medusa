"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { VariantPrice } from "@/lib/util/get-product-price"
import PlaceholderImage from "@/modules/common/icons/placeholder-image"
import ProductInfo from "@/modules/products/templates/product-info"
import ProductVariantsTable from "@/modules/products/components/product-variants-table"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  cheapestPrice: VariantPrice | null
}

export default function ProductQuickViewDialog({
  open,
  onOpenChange,
  product,
  region,
}: Props) {
  const productImage = product.thumbnail || product.images?.[0]?.url

  const hasInventoryData = product.variants?.some(
    (v) => typeof v.inventory_quantity === "number"
  )
  const totalInventory = hasInventoryData
    ? product.variants!.reduce((acc, v) => acc + (v?.inventory_quantity || 0), 0)
    : undefined
  const isLowStock = totalInventory !== undefined && totalInventory <= 10 && totalInventory > 0
  const isOutOfStock = totalInventory !== undefined && totalInventory === 0

  const hasVariants = !!product.variants && product.variants.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden rounded-2xl [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-card [&>button]:shadow-md [&>button]:text-foreground">
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-hidden">
          {/* Left: image */}
          <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[520px] bg-secondary shrink-0">
            {productImage ? (
              <Image
                src={productImage}
                alt={product.title ?? "Product"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlaceholderImage className="h-24 w-24 text-muted-foreground" style={{ opacity: 0.2 }} />
              </div>
            )}
          </div>

          {/* Right: same layout as product page */}
          <div className="flex flex-col gap-4 overflow-y-auto p-6 md:p-8">
            <ProductInfo product={product} />

            {/* Stock status */}
            {hasInventoryData && (
              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Out of stock
                  </span>
                ) : isLowStock ? (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "oklch(0.65 0.18 55)" }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "oklch(0.65 0.18 55)" }}
                    />
                    Only {totalInventory} left
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "oklch(0.55 0.17 145)" }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "oklch(0.55 0.17 145)" }}
                    />
                    In stock
                  </span>
                )}
              </div>
            )}

            {hasVariants && (
              <div className="border-t border-border pt-4">
                <ProductVariantsTable product={product} region={region} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

