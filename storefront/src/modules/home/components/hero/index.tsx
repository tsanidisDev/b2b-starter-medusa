"use client"

import { Heading } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-secondary">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-image.jpg"
          alt="Greek silk fabric — Hellas Silk Athens"
          fill
          className="object-cover object-center opacity-40"
          priority
        />
        {/* Gradient overlay — uses our CSS vars */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
      </div>

      {/* Content */}
      <div className="relative content-container mx-auto flex flex-col items-start justify-end min-h-[80vh] pb-16 small:pb-24 gap-6">
        {/* Eyebrow */}
        <span className="text-xs uppercase tracking-[0.25em] text-accent font-medium">
          Athens · Greece · Since 1987
        </span>

        <Heading
          level="h1"
          className="text-5xl small:text-7xl font-semibold text-foreground leading-none tracking-tight max-w-xl"
        >
          Silk for every story
        </Heading>

        <p className="text-base small:text-lg text-muted-foreground max-w-sm leading-relaxed">
          Scarves, robes and home linens woven from the finest Aegean mulberry silk. Timeless craft, contemporary design.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <LocalizedClientLink href="/store">
            <Button variant="primary" className="px-6">
              Shop the collection
            </Button>
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/scarves-shawls">
            <Button variant="transparent" className="px-6 text-muted-foreground hover:text-foreground">
              Scarves &amp; Shawls →
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default Hero

