import { listCategories } from "@/lib/data/categories"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

// Theme-variable-based gradient stops (no hardcoded colours)
const GRADIENT_CYCLE = [
  "from-primary/20 to-primary/5",
  "from-accent/40 to-accent/10",
  "from-secondary/80 to-secondary/30",
  "from-foreground/10 to-foreground/5",
  "from-primary/15 to-accent/10",
]

export default async function CategoryShowcase() {
  const categories = await listCategories({ limit: 10 }).catch(() => [])
  const topCategories = categories?.filter((c) => !c.parent_category).slice(0, 5) ?? []

  if (!topCategories.length) return null

  return (
    <section className="bg-background py-16 small:py-24">
      <div className="content-container mx-auto">
        {/* Section header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Browse by category
            </p>
            <h2 className="text-2xl small:text-3xl font-semibold text-foreground tracking-tight">
              Find your silk
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden small:block"
          >
            Shop all →
          </LocalizedClientLink>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 small:grid-cols-5 gap-3">
          {topCategories.map((cat, i) => {
            const gradient = GRADIENT_CYCLE[i % GRADIENT_CYCLE.length]
            const isLarge = i === 0
            return (
              <LocalizedClientLink
                key={cat.id}
                href={`/categories/${cat.handle}`}
                className={[
                  "group relative rounded-xl overflow-hidden border border-border",
                  "flex flex-col items-start justify-end",
                  "transition-all duration-300 hover:border-accent hover:shadow-md",
                  isLarge
                    ? "col-span-2 small:col-span-2 aspect-[4/3]"
                    : "col-span-1 aspect-square",
                ].join(" ")}
              >
                {/* Gradient fill */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                />
                {/* Bottom overlay for text */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent" />
                {/* Label */}
                <div className="relative p-4">
                  <span className="text-sm small:text-base font-semibold text-foreground leading-tight block">
                    {cat.name}
                  </span>
                  {(cat.category_children?.length ?? 0) > 0 && (
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {cat.category_children!.length} subcategories
                    </span>
                  )}
                </div>
              </LocalizedClientLink>
            )
          })}
        </div>

        {/* Mobile "Shop all" link */}
        <div className="mt-6 flex justify-center small:hidden">
          <LocalizedClientLink
            href="/store"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Shop all products →
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
