import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import LogoIcon from "@/modules/common/icons/logo"
import MedusaCTA from "@/modules/layout/components/medusa-cta"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 w-full bg-background relative small:min-h-screen">
      <div className="h-16 bg-background border-b border-border">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink className="hover:text-ui-fg-base" href="/">
            <h1 className="text-base font-semibold tracking-wide">Hellas Silk</h1>
          </LocalizedClientLink>
        </nav>
      </div>
      <div className="relative bg-muted/20" data-testid="checkout-container">
        {children}
      </div>
      <div className="py-4 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
    </div>
  )
}
