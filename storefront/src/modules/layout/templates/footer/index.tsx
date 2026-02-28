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

          {/* Company */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Company
            </span>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Our Story", href: "/about" },
                { label: "Wholesale", href: "/wholesale" },
                { label: "GitHub", href: "https://github.com/medusajs/b2b-starter-medusa", external: true },
                { label: "Documentation", href: "https://docs.medusajs.com", external: true },
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


export default async function Footer() {
  const { collections } = await listCollections({
    offset: "0",
    limit: "6",
  })
  const product_categories = await listCategories({
    offset: 0,
    limit: 6,
  })

  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-40">
          <div>
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase"
            >
              Medusa Store
            </LocalizedClientLink>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {product_categories && product_categories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {product_categories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-ui-fg-base",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-ui-fg-base"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base">Medusa</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <a
                    href="https://github.com/medusajs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ui-fg-base"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.medusajs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ui-fg-base"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/medusajs/b2b-starter-medusa"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ui-fg-base"
                  >
                    Source code
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Medusa Store. All rights reserved.
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}
