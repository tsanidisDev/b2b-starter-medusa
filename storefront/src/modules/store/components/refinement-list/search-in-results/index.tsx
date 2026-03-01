"use client"

import { MagnifyingGlassMini } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"

const SearchInResults = ({ listName }: { listName?: string }) => {
  const placeholder = listName ? `Search in ${listName}` : "Search products"
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) {
        params.set("q", val)
      } else {
        params.delete("q")
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    }, 400)
  }

  return (
    <div className="relative flex items-center gap-2 px-3 py-2 border-b border-border">
      <MagnifyingGlassMini className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full text-xs bg-transparent placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  )
}

export default SearchInResults

