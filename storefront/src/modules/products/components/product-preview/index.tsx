import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import ProductCardClient from "./product-card-client"

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

  // Only compute stock status when inventory data was actually fetched.
  // The listing query uses `*variants.calculated_price` which does NOT include
  // inventory_quantity, so every v.inventory_quantity would be undefined,
  // giving a false sum of 0 → false out-of-stock for every product.
  const hasInventoryData = product.variants?.some(
    (v) => typeof v.inventory_quantity === "number"
  )
  const inventoryQuantity = hasInventoryData
    ? product.variants!.reduce(
        (acc, v) => acc + (v?.inventory_quantity || 0),
        0
      )
    : undefined

  const isLowStock =
    inventoryQuantity !== undefined &&
    inventoryQuantity <= 10 &&
    inventoryQuantity > 0
  const isOutOfStock = inventoryQuantity !== undefined && inventoryQuantity === 0

  const isSale =
    cheapestPrice?.price_type === "sale" &&
    cheapestPrice?.percentage_diff &&
    Number(cheapestPrice.percentage_diff) > 0

  const discountLabel = isSale ? `-${cheapestPrice!.percentage_diff}%` : null

  const isNew =
    product.created_at &&
    Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000

  return (
    <ProductCardClient
      product={product}
      region={region}
      cheapestPrice={cheapestPrice}
      view={view}
      isFeatured={isFeatured}
      discountLabel={discountLabel}
      isNew={!!isNew}
      isLowStock={isLowStock}
      isOutOfStock={isOutOfStock}
    />
  )
}

