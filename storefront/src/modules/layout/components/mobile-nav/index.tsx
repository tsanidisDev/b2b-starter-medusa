"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { B2BCustomer } from "@/types/global"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ChannelSelector } from "@/modules/layout/components/channel-selector"
import { Menu, X } from "lucide-react"

interface MobileNavProps {
  categories: HttpTypes.StoreProductCategory[]
  collections: HttpTypes.StoreCollection[]
  customer: B2BCustomer | null
}

export function MobileNav({ categories, collections, customer }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          aria-label="Open menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle asChild>
            <LocalizedClientLink href="/" onClick={() => setOpen(false)} className="text-lg font-semibold">
              🧵 Silk &amp; Thread
            </LocalizedClientLink>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4 py-4 overflow-y-auto h-[calc(100vh-70px)]">
          {/* Channel selector */}
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <span className="text-sm text-muted-foreground">Channel:</span>
            <ChannelSelector />
          </div>

          <Separator className="mb-2" />

          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Shop
          </p>
          <LocalizedClientLink
            href="/store"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
          >
            All Products
          </LocalizedClientLink>

          {categories.map((cat) => (
            <LocalizedClientLink
              key={cat.id}
              href={`/categories/${cat.handle}`}
              onClick={() => setOpen(false)}
              className="flex items-center rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
            >
              {cat.name}
            </LocalizedClientLink>
          ))}

          {collections && collections.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Collections
              </p>
              {collections.map((col) => (
                <LocalizedClientLink
                  key={col.id}
                  href={`/collections/${col.handle}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {col.title}
                </LocalizedClientLink>
              ))}
            </>
          )}

          <Separator className="my-2" />

          <LocalizedClientLink
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
          >
            {customer ? `Hi, ${customer.first_name}` : "Log in"}
          </LocalizedClientLink>
        </div>
      </SheetContent>
    </Sheet>
  )
}
