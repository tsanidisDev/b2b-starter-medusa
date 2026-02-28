import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import FilePlus from "@/modules/common/icons/file-plus"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import { ChannelSelector } from "@/modules/layout/components/channel-selector"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import { Suspense } from "react"

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()

  return (
    <div className="sticky top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <header className="content-container mx-auto flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <LocalizedClientLink
          href="/"
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-lg font-semibold tracking-wide text-foreground">
            Hellas Silk
          </span>
          <span className="hidden small:inline text-xs text-muted-foreground tracking-widest uppercase">
            Athens
          </span>
        </LocalizedClientLink>

        {/* Centre nav — categories */}
        <nav className="hidden small:flex">
          <ul>
            <li>
              <Suspense fallback={<SkeletonMegaMenu />}>
                <MegaMenuWrapper />
              </Suspense>
            </li>
          </ul>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Channel toggle */}
          <ChannelSelector className="hidden small:flex" />

          <div className="hidden small:block h-4 w-px bg-border mx-1" />

          {/* Quote */}
          {customer && cart?.items && cart.items.length > 0 ? (
            <RequestQuoteConfirmation>
              <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <FilePlus />
                <span className="hidden small:inline">Quote</span>
              </button>
            </RequestQuoteConfirmation>
          ) : (
            <RequestQuotePrompt>
              <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <FilePlus />
                <span className="hidden small:inline">Quote</span>
              </button>
            </RequestQuotePrompt>
          )}

          <Suspense fallback={<SkeletonAccountButton />}>
            <AccountButton customer={customer} />
          </Suspense>

          <Suspense fallback={<SkeletonCartButton />}>
            <CartButton />
          </Suspense>
        </div>
      </header>
    </div>
  )
}
