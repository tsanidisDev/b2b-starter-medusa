"use client"

import Image from "next/image"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

const Hero = () => {
  return (
    <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
      {/* Background image */}
      <Image
        src="/hero-image.jpg"
        alt="Greek silk textiles"
        fill
        priority
        quality={95}
        className="object-cover object-center"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="content-container">
          <div className="max-w-xl text-white space-y-6">
            <Badge
              variant="outline"
              className="border-white/40 text-white bg-white/10 backdrop-blur-sm gap-1.5"
            >
              <Sparkles className="h-3 w-3" />
              Handcrafted in Greece since 1987
            </Badge>

            <h1 className="text-5xl sm:text-6xl font-semibold leading-tight tracking-tight">
              The Finest
              <br />
              <span className="text-primary-foreground italic font-light">Greek Silk</span>
            </h1>

            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Scarves, clothing, and home textiles woven from pure Soufli silk —
              the golden thread of northern Greece.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <LocalizedClientLink href="/store">
                <Button size="lg" className="gap-2 rounded-full">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/categories/scarves-shawls">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  Scarves & Shawls
                </Button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

