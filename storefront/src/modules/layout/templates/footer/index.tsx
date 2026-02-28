import { listCategories } from "@/lib/data/categories"
import { listCollections } from "@/lib/data/collections"
import { Separator } from "@/components/ui/separator"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({ offset: "0", limit: "6" })
  const product_categories = await listCategories({ offset: 0, limit: 6 })

  const mainCategories = product_categories?.filter((c) => !c.parent_category_id) ?? []

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="content-container py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2 flex flex-col gap-4">
            <LocalizedClientLink href="/" className="text-xl font-semibold tracking-tight">
              🧵 Silk &amp; Thread
            </LocalizedClientLink>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Handcrafted silk textiles from Soufli, Greece. Pure craftsmanship
              passed down through generations.
            </p>
            <div className="flex gap-3 mt-2">
              <a
                href="mailto:hello@silkandthread.gr"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                hello@silkandthread.gr
              </a>
            </div>
          </div>

          {/* Categories */}
          {mainCategories.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Categories
              </p>
              <ul className="flex flex-col gap-2">
                {mainCategories.slice(0, 6).map((c) => (
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
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Collections
              </p>
              <ul className="flex flex-col gap-2">
                {collections.slice(0, 6).map((c) => (
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

          {/* Account / Help */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Account
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                <LocalizedClientLink
                  href="/account"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Account
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/account/orders"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Orders
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/store"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  All Products
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Silk &amp; Thread. All rights reserved.</p>
          <p>Handcrafted in Soufli, Greece 🇬🇷</p>
        </div>
      </div>
    </footer>
  )
}
