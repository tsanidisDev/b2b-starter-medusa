import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCategories } from "@/lib/data/categories"
import { listAnnouncements } from "@/lib/data/announcements"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import FilePlus from "@/modules/common/icons/file-plus"
import { AnnouncementBar } from "@/modules/layout/components/announcement-bar"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import { ChannelSelector } from "@/modules/layout/components/channel-selector"
import { MobileNav } from "@/modules/layout/components/mobile-nav"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Suspense } from "react"

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()
  const categories = await listCategories({ offset: 0, limit: 8 }).catch(() => [])
  const announcements = await listAnnouncements()

  return (
    <>
      {/* Announcement bar — scrolls away, not sticky */}
      <AnnouncementBar announcements={announcements} />

      <div className="sticky top-0 inset-x-0 z-50 glass-nav border-b border-border/60 shadow-sm">
        <header className="content-container mx-auto flex h-16 items-center justify-between gap-4">
        {/* Mobile hamburger — shown only on small screens */}
        <MobileNav categories={categories} />

        {/* Brand */}
        <LocalizedClientLink
          href="/"
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-base small:text-lg font-semibold tracking-wide text-foreground">
            Hellas Silk
          </span>
          <span className="hidden small:inline text-xs text-foreground/50 tracking-widest uppercase">
            Athens
          </span>
        </LocalizedClientLink>

        {/* Centre nav — desktop only */}
        <nav className="hidden small:flex flex-1 justify-center items-center gap-1">
          <Suspense fallback={<SkeletonMegaMenu />}>
            <MegaMenuWrapper />
          </Suspense>
          <LocalizedClientLink
            href="/store"
            className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            Store
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/about"
            className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            About
          </LocalizedClientLink>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          {/* Channel toggle — desktop only */}
          <ChannelSelector className="hidden small:flex" />

          <div className="hidden small:block h-4 w-px bg-border mx-1" />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Quote — desktop only */}
          <div className="hidden small:flex">
            {customer && cart?.items && cart.items.length > 0 ? (
              <RequestQuoteConfirmation>
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-accent transition-colors">
                  <FilePlus />
                  <span className="hidden small:inline">Quote</span>
                </button>
              </RequestQuoteConfirmation>
            ) : (
              <RequestQuotePrompt>
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-accent transition-colors">
                  <FilePlus />
                  <span className="hidden small:inline">Quote</span>
                </button>
              </RequestQuotePrompt>
            )}
          </div>

          <Suspense fallback={<SkeletonAccountButton />}>
            <AccountButton customer={customer} />
          </Suspense>

          <Suspense fallback={<SkeletonCartButton />}>
            <CartButton />
          </Suspense>
        </div>
      </header>
      </div>
    </>
  )
}
