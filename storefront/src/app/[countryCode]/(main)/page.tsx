import { listRegions } from "@/lib/data/regions"
import CategoryShowcase from "@/modules/home/components/category-showcase"
import FeaturedProducts from "@/modules/home/components/featured-products"
import NewArrivals from "@/modules/home/components/new-arrivals"
import Hero from "@/modules/home/components/hero"
import SkeletonFeaturedProducts from "@/modules/skeletons/templates/skeleton-featured-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Hellas Silk — Luxury Silk from Athens",
  description:
    "Discover handcrafted silk scarves, shawls, and accessories made in Athens, Greece since 1987.",
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then(
      (regions) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )
    return countryCodes.map((countryCode) => ({ countryCode }))
  } catch {
    // Backend unreachable at build time; pages generated on-demand at runtime
    return []
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  return (
    <div className="flex flex-col">
      <Hero />
      <Suspense fallback={<SkeletonFeaturedProducts />}>
        <NewArrivals countryCode={countryCode} />
      </Suspense>
      <CategoryShowcase />
      <Suspense fallback={<SkeletonFeaturedProducts />}>
        <FeaturedProducts countryCode={countryCode} />
      </Suspense>
    </div>
  )
}
