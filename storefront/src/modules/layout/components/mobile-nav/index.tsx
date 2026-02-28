"use client"

import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ThemeToggle } from "@/components/theme-toggle"
import { HttpTypes } from "@medusajs/types"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/store" },
  { label: "About", href: "/about" },
]

export function MobileNav({
  categories,
}: {
  categories?: HttpTypes.StoreProductCategory[]
}) {
  const [open, setOpen] = useState(false)

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [])

  const topCategories = categories?.filter((c) => !c.parent_category_id).slice(0, 6) ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors small:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle asChild>
            <LocalizedClientLink
              href="/"
              onClick={() => setOpen(false)}
              className="text-base font-semibold tracking-wide text-foreground hover:opacity-80 transition-opacity"
            >
              Hellas Silk
            </LocalizedClientLink>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main links */}
          <ul className="px-5 flex flex-col gap-1 mb-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <LocalizedClientLink
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  {link.label}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>

          {/* Categories */}
          {topCategories.length > 0 && (
            <div className="px-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Categories
              </p>
              <ul className="flex flex-col gap-1">
                {topCategories.map((cat) => (
                  <li key={cat.id}>
                    <LocalizedClientLink
                      href={`/categories/${cat.handle}`}
                      onClick={() => setOpen(false)}
                      className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {cat.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Bottom bar */}
        <div className="border-t border-border px-5 py-4 flex items-center justify-between">
          <LocalizedClientLink
            href="/account"
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Account
          </LocalizedClientLink>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  )
}
