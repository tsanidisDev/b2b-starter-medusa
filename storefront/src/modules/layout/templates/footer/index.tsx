import { listCategories } from "@/lib/data/categories"
import { listCollections } from "@/lib/data/collections"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({ offset: "0", limit: "6" })
  const product_categories = await listCategories({ offset: 0, limit: 6 })

  const topCategories = product_categories?.filter((c) => !c.parent_category) ?? []

  return (
    <footer className="border-t border-border bg-background">
      <div className="content-container mx-auto py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 small:grid-cols-4 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 small:col-span-1 flex flex-col gap-4">
            <LocalizedClientLink href="/" className="text-base font-semibold tracking-wide text-foreground hover:opacity-80 transition-opacity">
              Hellas Silk
            </LocalizedClientLink>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-48">
              Fine Greek silk — woven in Athens since 1987. Every thread tells a story of Aegean light and craft.
            </p>
          </div>

          {/* Categories */}
          {topCategories.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Collections
              </span>
              <ul className="flex flex-col gap-2">
                {topCategories.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink
                      href={`/categories/${c.handle}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="category-link"
                    >
                      {c.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collections */}
          {collections && collections.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Curated
              </span>
              <ul className="flex flex-col gap-2">
                {collections.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink
                      href={`/collections/${c.handle}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {c.title}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Info
            </span>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Shop All", href: "/store" },
                { label: "My Account", href: "/account" },
                { label: "GitHub", href: "https://github.com/medusajs/b2b-starter-medusa", external: true },
                { label: "Powered by Medusa", href: "https://medusajs.com", external: true },
              ].map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <LocalizedClientLink
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </LocalizedClientLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col small:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hellas Silk. All rights reserved.
          </span>
          <span className="text-xs text-muted-foreground">
            Made with care in Athens, Greece 🇬🇷
          </span>
        </div>
      </div>
    </footer>
  )
}
