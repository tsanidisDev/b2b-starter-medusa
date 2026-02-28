import {
  CheckCircleSolid,
  ExclamationCircleSolid,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@/lib/utils"

const ProductFacts = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const inventoryQuantity =
    product.variants?.reduce(
      (acc, variant) => acc + (variant.inventory_quantity ?? 0),
      0
    ) || 0

  const isOutOfStock = inventoryQuantity === 0
  const isLowStock = !isOutOfStock && inventoryQuantity <= 10

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Stock status badge */}
      <div
        className={cn(
          "flex items-center gap-2 text-sm px-4 py-3 rounded-[var(--radius)] border font-medium",
          isOutOfStock
            ? "bg-destructive/8 border-destructive/25 text-destructive"
            : isLowStock
            ? "bg-accent/15 border-accent/30 text-accent-foreground"
            : "bg-green-500/8 border-green-500/25 text-green-700 dark:text-green-400"
        )}
      >
        {isOutOfStock ? (
          <ExclamationCircleSolid className="shrink-0" />
        ) : isLowStock ? (
          <ExclamationCircleSolid className="shrink-0" />
        ) : (
          <CheckCircleSolid className="shrink-0" />
        )}
        <span>
          {isOutOfStock
            ? "Out of stock — join the waitlist"
            : isLowStock
            ? `Only ${inventoryQuantity} left in stock — order soon`
            : `In stock · ${inventoryQuantity} available · ships in 1–3 days`}
        </span>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-base">🚚</span>
          <span>Free B2B shipping &gt;$500</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">↩</span>
          <span>30-day returns</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">🔒</span>
          <span>Secure checkout</span>
        </div>
        {product.mid_code && (
          <div className="flex items-center gap-2">
            <span className="text-base">🏷</span>
            <span>SKU: {product.mid_code}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductFacts
