import { listRegions } from "@/lib/data/regions"
import { listCategories } from "@/lib/data/categories"
import FeaturedProducts from "@/modules/home/components/featured-products"
import Hero from "@/modules/home/components/hero"
import SkeletonFeaturedProducts from "@/modules/skeletons/templates/skeleton-featured-products"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Silk & Thread — Handcrafted Greek Silk",
  description:
    "Discover the finest silk scarves, clothing, and home textiles handcrafted in Greece. Authentic Soufli silk, beautifully designed.",
}

const CATEGORY_ICONS: Record<string, string> = {
  "scarves-shawls": "🧣",
  clothing: "👗",
  "home-living": "🏠",
  accessories: "💎",
  "gifts-sets": "🎁",
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then(
      (regions) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )
    return countryCodes.map((countryCode) => ({ countryCode }))
  } catch {
    return []
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const categories = await listCategories({ offset: 0, limit: 10 }).catch(() => [])
  const mainCategories = categories.filter((c) => !c.parent_category_id)

  return (
    <div>
      {/* Hero */}
      <Hero />

      {/* Category grid */}
      {mainCategories.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="content-container">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Browse by Category
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                What are you looking for?
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {mainCategories.map((cat) => (
                <LocalizedClientLink
                  key={cat.id}
                  href={`/categories/${cat.handle}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                >
                  <span className="text-3xl">
                    {CATEGORY_ICONS[cat.handle ?? ""] ?? "✨"}
                  </span>
                  <span className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured product rails */}
      <Suspense fallback={<SkeletonFeaturedProducts />}>
        <FeaturedProducts countryCode={countryCode} />
      </Suspense>

      {/* Brand story strip */}
      <section className="py-20 bg-primary/5 border-y border-border">
        <div className="content-container text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Our Story
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Woven with Greek Heritage
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Nestled in the silk-producing town of Soufli, northern Greece, we have been
            crafting premium silk textiles for over three decades. Every piece carries
            the warmth of the Aegean sun and the precision of old-world craft.
          </p>
          <LocalizedClientLink href="/store">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Explore the collection →
            </span>
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}

