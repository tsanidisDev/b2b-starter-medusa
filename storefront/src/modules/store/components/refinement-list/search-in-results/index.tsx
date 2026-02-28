import { MagnifyingGlassMini } from "@medusajs/icons"

const SearchInResults = ({ listName }: { listName?: string }) => {
  const placeholder = listName ? `Search in ${listName}` : "Search products"

  return (
    <div className="relative flex items-center gap-2 px-3 py-2 border-b border-border">
      <MagnifyingGlassMini className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <input
        placeholder={placeholder}
        disabled
        className="w-full text-xs bg-transparent placeholder:text-muted-foreground focus:outline-none hover:cursor-not-allowed"
        title="Install a search provider to enable product search"
      />
    </div>
  )
}

export default SearchInResults

