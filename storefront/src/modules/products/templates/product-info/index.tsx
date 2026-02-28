import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-4 w-full">
      {/* Collection + category breadcrumb */}
      {(product.collection || (product.categories && product.categories.length > 0)) && (
        <div className="flex items-center gap-2 flex-wrap">
          {product.collection && (
            <LocalizedClientLink
              href={`/collections/${product.collection.handle}`}
              className="text-xs font-semibold text-primary hover:underline uppercase tracking-widest"
            >
              {product.collection.title}
            </LocalizedClientLink>
          )}
          {product.collection && product.categories && product.categories.length > 0 && (
            <span className="text-xs text-border">·</span>
          )}
          {product.categories && product.categories.length > 0 && (
            <LocalizedClientLink
              href={`/categories/${product.categories[0].handle}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {product.categories[0].name}
            </LocalizedClientLink>
          )}
        </div>
      )}

      {/* Title */}
      <h1
        className="text-3xl small:text-4xl font-semibold text-foreground leading-tight tracking-tight"
        data-testid="product-title"
      >
        {product.title}
      </h1>

      {/* Subtitle / short description */}
      {(product.subtitle || product.description) && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {product.subtitle || product.description}
        </p>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.tags.slice(0, 6).map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] uppercase tracking-wider px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full border border-border"
            >
              {tag.value}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductInfo
