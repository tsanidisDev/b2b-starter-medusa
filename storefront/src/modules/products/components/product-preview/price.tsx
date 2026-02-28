import { VariantPrice } from "@/lib/util/get-product-price"
import { Text, clx } from "@medusajs/ui"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) return null

  return (
    <div className="flex items-baseline gap-1.5">
      {price.price_type === "sale" && (
        <Text
          className="line-through text-muted-foreground text-xs"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-sm font-semibold text-foreground", {
          "text-accent": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </div>
  )
}

