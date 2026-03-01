# Storefront Redesign (Phase 5)

Minimal luxury redesign of the Next.js storefront — silk/gold aesthetic, editorial typography, clean layouts.

---

## Design Principles

- **@medusajs/ui first** — `Text`, `Heading`, `Button`, `Container`, `clx` etc. kept throughout
- **Shadcn/ui for gaps** — `Select`, `Sheet`, `Dialog` etc. where @medusajs/ui has no equivalent
- **CSS variables everywhere** — `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `border-border`, `text-accent`, `rounded-[var(--radius)]`
- **No hardcoded neutrals** — `text-neutral-*`, `bg-neutral-*` replaced by CSS var classes

---

## TanStack Integration

| Package | Version | Usage |
|---|---|---|
| `@tanstack/react-query` | 5.90.21 | Global data-fetching client (QueryProvider) |
| `@tanstack/react-table` | 8.21.3 | All table UIs (orders, company, quotes) |
| `@tanstack/react-virtual` | 3.13.19 | Virtualized long lists |
| `@tanstack/react-query-devtools` | latest | Dev-only overlay |

**Key files:**
- `storefront/src/lib/context/query-provider.tsx` — QueryClient (1min stale, 5min gc) + devtools
- `storefront/src/app/layout.tsx` — `<QueryProvider>` wraps the app

---

## Components Redesigned

### Layout
| File | Change |
|---|---|
| `modules/layout/templates/nav/index.tsx` | Minimal bar, backdrop-blur, brand "Hellas Silk Athens", CSS vars |
| `modules/layout/templates/footer/index.tsx` | 4-column grid, brand story, CSS vars, no MedusaCTA |

### Home
| File | Change |
|---|---|
| `modules/home/components/hero/index.tsx` | Editorial left-aligned, gradient overlay, `Heading` from @medusajs/ui |
| `modules/home/components/featured-products/product-rail/index.tsx` | Section eyebrow + title, `bg-background`, `Text` from @medusajs/ui |
| `app/[countryCode]/(main)/page.tsx` | Metadata "Hellas Silk", removed `gap-y-2 m-2` wrapper |

### Product Listing (PLP)
| File | Change |
|---|---|
| `modules/products/components/product-preview/index.tsx` | `bg-card border-border rounded-[var(--radius)]`, `Text` @medusajs/ui, CSS vars |
| `modules/products/components/product-preview/price.tsx` | `text-muted-foreground` / `text-foreground` / `text-accent` |
| `modules/products/components/product-preview/preview-add-to-cart.tsx` | Icon `Button` from @medusajs/ui, `rounded-full` |
| `modules/store/components/refinement-list/sort-products/index.tsx` | shadcn `Select`, borderless trigger |
| `modules/store/components/refinement-list/search-in-results/index.tsx` | Border-b search bar, `MagnifyingGlassMini` icon |
| `modules/store/components/refinement-list/category-list/index.tsx` | Tree nav, CSS vars, depth-aware indent, dot for leaf |
| `modules/store/components/refinement-list/index.tsx` | `bg-card border-border` card wrapper, gap-6 |
| `modules/store/templates/index.tsx` | `bg-background`, py-8, gap-6 |
| `modules/store/templates/paginated-products.tsx` | `gap-4` grid, clean empty state |
| `modules/categories/templates/index.tsx` | `bg-background`, gap-6, clean empty state with `Text` |
| `modules/collections/templates/index.tsx` | `bg-background`, gap-6 |

---

## Key CSS Variable Mapping

| Old class | New class |
|---|---|
| `bg-neutral-100` | `bg-background` or `bg-muted/30` |
| `text-neutral-500` | `text-muted-foreground` |
| `hover:text-neutral-700` | `hover:text-foreground` |
| `divide-neutral-200` | `divide-border` |
| `border-neutral-200` | `border-border` |
| `text-neutral-900` | `text-foreground` |

---

## Env Vars

No new environment variables added by this phase.

---

## Gotchas

- `@medusajs/ui`'s `Container` was removed where it wrapped plain divs (it adds `px-8 py-4` opinionated padding)
- `cn()` utility from `@/lib/utils` used instead of `clx` from @medusajs/ui for conditional class composition in new components
- Product rail `gap-y-36` was intentional in the original (optical spacing) — replaced with uniform `gap-4` for cleaner grid
