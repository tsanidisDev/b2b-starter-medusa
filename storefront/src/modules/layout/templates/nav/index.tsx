import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCategories } from "@/lib/data/categories"
import { listCollections } from "@/lib/data/collections"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import FilePlus from "@/modules/common/icons/file-plus"
import { ChannelSelector } from "@/modules/layout/components/channel-selector"
import { MobileNav } from "@/modules/layout/components/mobile-nav"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Suspense } from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()
  const categories = await listCategories().catch(() => [])
  const { collections } = await listCollections({ limit: "6" }).catch(
    () => ({ collections: [] })
  )

  const mainCategories = categories.filter((c) => !c.parent_category_id)

  return (
    <div className="sticky top-0 inset-x-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border z-50">
      <header className="content-container flex h-16 items-center justify-between">
        {/* Left — Logo */}
        <div className="flex items-center gap-6">
          <LocalizedClientLink href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              🧵 Silk & Thread
            </span>
          </LocalizedClientLink>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Shop / Categories */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm">
                  Shop
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] grid-cols-[1fr_1fr]">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <LocalizedClientLink
                          href="/store"
                          className={cn(
                            "flex h-full w-full select-none flex-col justify-end rounded-md",
                            "bg-gradient-to-b from-primary/20 to-primary/5 p-6 no-underline outline-none",
                            "hover:bg-primary/10 transition-colors"
                          )}
                        >
                          <div className="text-2xl mb-2">🧵</div>
                          <div className="mb-2 text-base font-medium text-foreground">
                            All Products
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Handcrafted Greek silk scarves, clothing & home textiles.
                          </p>
                        </LocalizedClientLink>
                      </NavigationMenuLink>
                    </div>
                    {mainCategories.slice(0, 4).map((cat) => (
                      <NavigationMenuLink key={cat.id} asChild>
                        <LocalizedClientLink
                          href={`/categories/${cat.handle}`}
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline",
                            "hover:bg-accent hover:text-accent-foreground transition-colors"
                          )}
                        >
                          <div className="text-sm font-medium leading-none text-foreground">
                            {cat.name}
                          </div>
                          {cat.description && (
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                              {cat.description}
                            </p>
                          )}
                        </LocalizedClientLink>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Collections */}
              {collections && collections.length > 0 && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm">
                    Collections
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-1 p-4">
                      {collections.map((col) => (
                        <li key={col.id}>
                          <NavigationMenuLink asChild>
                            <LocalizedClientLink
                              href={`/collections/${col.handle}`}
                              className={cn(
                                "block select-none rounded-md p-3 text-sm leading-none no-underline",
                                "hover:bg-accent hover:text-accent-foreground transition-colors"
                              )}
                            >
                              <div className="font-medium text-foreground">{col.title}</div>
                            </LocalizedClientLink>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {/* Direct links */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <LocalizedClientLink
                    href="/store"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  >
                    Store
                  </LocalizedClientLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1">
          <ChannelSelector className="hidden md:flex" />

          <div className="hidden md:block h-4 w-px bg-border mx-1" />

          {customer && cart?.items && cart.items.length > 0 ? (
            <RequestQuoteConfirmation>
              <button className="flex gap-1.5 items-center rounded-md hover:bg-accent px-2 py-1.5 text-sm transition-colors">
                <FilePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Quote</span>
              </button>
            </RequestQuoteConfirmation>
          ) : (
            <RequestQuotePrompt>
              <button className="flex gap-1.5 items-center rounded-md hover:bg-accent px-2 py-1.5 text-sm transition-colors">
                <FilePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Quote</span>
              </button>
            </RequestQuotePrompt>
          )}

          <Suspense fallback={<SkeletonAccountButton />}>
            <AccountButton customer={customer} />
          </Suspense>

          <Suspense fallback={<SkeletonCartButton />}>
            <CartButton />
          </Suspense>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <MobileNav
            categories={mainCategories}
            collections={collections ?? []}
            customer={customer}
          />
        </div>
      </header>
    </div>
  )
}
