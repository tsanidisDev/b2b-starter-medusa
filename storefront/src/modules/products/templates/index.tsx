import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductFacts from "../components/product-facts"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <nav className="content-container mx-auto flex items-center gap-2 text-xs text-muted-foreground py-3">
          <LocalizedClientLink href="/" className="hover:text-foreground transition-colors">
            Home
          </LocalizedClientLink>
          <span className="text-border">/</span>
          {product.categories?.[0] && (
            <>
              <LocalizedClientLink
                href={`/categories/${product.categories[0].handle}`}
                className="hover:text-foreground transition-colors"
              >
                {product.categories[0].name}
              </LocalizedClientLink>
              <span className="text-border">/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
        </nav>
      </div>

      {/* Main product grid */}
      <div
        className="content-container grid grid-cols-1 md:grid-cols-[1fr_420px] gap-10 py-8 small:py-12"
        data-testid="product-container"
      >
        {/* Left — image gallery */}
        <ImageGallery product={product} />

        {/* Right — product details */}
        <div className="flex flex-col gap-6">
          <ProductInfo product={product} />

          <div className="border-t border-border pt-6">
            <Suspense
              fallback={<ProductActions product={product} region={region} />}
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
          </div>

          <div className="border-t border-border pt-6">
            <ProductFacts product={product} />
          </div>
        </div>
      </div>

      {/* Tabs — description + specifications */}
      <div className="border-t border-border">
        <div className="content-container py-8">
          <ProductTabs product={product} />
        </div>
      </div>

      {/* Related products */}
      <div className="border-t border-border bg-secondary/30">
        <div
          className="content-container py-12"
          data-testid="related-products-container"
        >
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
