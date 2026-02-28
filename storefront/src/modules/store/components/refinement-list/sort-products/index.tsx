"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "New arrivals" },
  { value: "price_asc", label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3">
      <span className="text-xs text-muted-foreground uppercase tracking-widest">Sort by:</span>
      <Select
        value={sortBy}
        onValueChange={(v) => setQueryParams("sortBy", v as SortOptions)}
      >
        <SelectTrigger
          className="h-7 w-auto border-none shadow-none text-xs bg-transparent focus:ring-0 gap-1 p-0"
          data-testid={dataTestId}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default SortProducts
