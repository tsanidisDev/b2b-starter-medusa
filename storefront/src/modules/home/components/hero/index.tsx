"use client"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden min-h-[88vh] flex flex-col">
      {/* Background — always dark-toned regardless of theme */}
      <div className="absolute inset-0 bg-[#0d0b08]">
        <Image
          src="/hero-image.jpg"
          alt="Greek silk fabric — Hellas Silk Athens"
          fill
          className="object-cover object-center opacity-55"
          priority
        />
        {/* Strong left-to-right vignette so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
        {/* Subtle bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content — pinned to bottom-left */}
      <div className="relative flex-1 content-container mx-auto flex flex-col items-start justify-end pb-20 small:pb-28 gap-5 min-h-[88vh]">
        {/* Eyebrow */}
        <p className="text-xs uppercase tracking-[0.28em] text-white/55 font-medium">
          Athens · Greece · Since 1987
        </p>

        <h1 className="text-5xl small:text-[5.5rem] font-semibold text-white leading-[1.05] tracking-tight max-w-2xl">
          Silk for every story
        </h1>

        <p className="text-base small:text-lg text-white/65 max-w-sm leading-relaxed">
          Scarves, robes and home linens woven from the finest Aegean mulberry silk. Timeless craft, contemporary design.
        </p>

        <div className="flex items-center gap-3 flex-wrap pt-2">
          <LocalizedClientLink href="/store">
            <button className="px-7 py-3.5 bg-white text-[#1a1209] text-sm font-semibold rounded-[var(--radius)] hover:bg-white/90 transition-all hover:shadow-lg">
              Shop the collection
            </button>
          </LocalizedClientLink>
          <LocalizedClientLink href="/about">
            <button className="px-7 py-3.5 border border-white/35 text-white text-sm font-medium rounded-[var(--radius)] hover:border-white/60 hover:bg-white/10 transition-all">
              Our story →
            </button>
          </LocalizedClientLink>
        </div>

        {/* Bottom stats bar */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/15">
          {[
            { value: "1987", label: "Est. Athens" },
            { value: "100%", label: "Mulberry silk" },
            { value: "60+", label: "Countries" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-white leading-none">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/45">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero

