import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About Hellas Silk",
  description:
    "Our story — fine Greek silk woven in Athens since 1987. Craftsmanship, sustainability and B2B partnership.",
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative w-full min-h-[55vh] flex items-end overflow-hidden bg-[#0d0b08]">
        <Image
          src="/hero-image.jpg"
          alt="Hellas Silk atelier, Athens"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative content-container mx-auto py-16">
          <p className="text-xs uppercase tracking-[0.28em] text-white/55 mb-3">
            Athens · Greece
          </p>
          <h1 className="text-4xl small:text-6xl font-semibold text-white leading-tight tracking-tight max-w-2xl">
            Woven with purpose,<br />worn with pride
          </h1>
        </div>
      </section>

      {/* Story */}
      <div className="content-container mx-auto py-16 small:py-24">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-14 small:gap-20">
          <div className="flex flex-col gap-6">
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
              Our story
            </p>
            <h2 className="text-2xl small:text-3xl font-semibold text-foreground leading-snug">
              Rooted in Athens since 1987
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              What began as a small weaving workshop in the heart of Athens has grown into one of Greece's most respected silk houses. For nearly four decades, we have honoured ancient weaving traditions while embracing contemporary design sensibilities.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every piece is crafted from 100% mulberry silk, ethically sourced and hand-finished by our Athens artisans. We believe the finest fabrics tell stories — of place, craft, and the people who wear them.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { value: "1987", sub: "Est. Athens, Greece", label: "Founded" },
              { value: "100%", sub: "Mulberry silk", label: "Material" },
              { value: "40+", sub: "Local craftspeople", label: "Artisans" },
              { value: "60+", sub: "Worldwide distribution", label: "Countries" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 p-5 rounded-[var(--radius)] bg-card border border-border"
              >
                <p className="text-3xl font-semibold text-foreground leading-none">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-primary">{stat.sub}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-20 border-t border-border pt-16">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">
            Our values
          </p>
          <h2 className="text-2xl small:text-3xl font-semibold text-foreground mb-10">
            What we stand for
          </h2>
          <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
            {[
              {
                icon: "✦",
                title: "Craft",
                desc: "Every thread is chosen, every weave is purposeful. We refuse shortcuts because quality is not accidental.",
              },
              {
                icon: "♻",
                title: "Sustainability",
                desc: "Natural dyes, ethical sourcing, minimal waste. We are stewards of the land that inspires our work.",
              },
              {
                icon: "🤝",
                title: "Partnership",
                desc: "We work with retailers, designers and B2B clients who share our commitment to exceptional, enduring quality.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="flex flex-col gap-4 p-6 rounded-[var(--radius)] bg-card border border-border hover:border-primary/40 transition-colors"
              >
                <span className="text-2xl">{v.icon}</span>
                <h3 className="text-base font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* B2B CTA */}
        <div className="mt-16 flex flex-col small:flex-row items-start small:items-center justify-between gap-6 p-8 rounded-[var(--radius)] bg-secondary border border-border">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground">
              Ready to partner with us?
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Explore our B2B programme for wholesale pricing, bulk ordering and dedicated account management.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LocalizedClientLink
              href="/account"
              className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-[var(--radius)] hover:bg-accent/10 transition-colors"
            >
              B2B account
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-[var(--radius)] hover:opacity-90 transition-opacity"
            >
              Shop collection →
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}
