import { clx } from "@medusajs/ui"
import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  if (!cheapestPrice) {
    return <div className="block w-40 h-10 bg-muted animate-pulse rounded" />
  }

  const isOnSale = cheapestPrice.price_type === "sale"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span
          className={clx("text-3xl font-semibold tracking-tight", {
            "text-accent": isOnSale,
            "text-foreground": !isOnSale,
          })}
          data-testid="product-price"
          data-value={cheapestPrice.calculated_price_number}
        >
          From {cheapestPrice.calculated_price}
        </span>

        {isOnSale && (
          <>
            <span
              className="line-through text-muted-foreground text-lg"
              data-testid="original-product-price"
              data-value={cheapestPrice.original_price_number}
            >
              {cheapestPrice.original_price}
            </span>
            {cheapestPrice.percentage_diff && (
              <span className="text-xs font-semibold bg-destructive/10 text-destructive px-2.5 py-1 rounded-full border border-destructive/20">
                -{cheapestPrice.percentage_diff}% OFF
              </span>
            )}
          </>
        )}
      </div>
      <span className="text-xs text-muted-foreground">Excl. VAT · B2B pricing available</span>
    </div>
  )
}
