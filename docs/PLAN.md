# 🧵 Greek Silk Shop — Transformation Plan

**Goal:** Transform the B2B starter into a complete B2C + B2B Greek silk products shop with a modern storefront.

---

## Phase 1 — Backend: Production Modules & Providers

> Configure essential Medusa modules for a real shop.

### 1.1 Stripe Payment Provider
- [x] Add Stripe config to `backend/medusa-config.ts`
- [x] Add `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` to `.env.prod.example`
- [x] Add `NEXT_PUBLIC_STRIPE_KEY` to storefront env
- [ ] Enable Stripe in region(s) via Admin

### 1.2 S3 File Provider (product images)
- [x] Add S3 config to `backend/medusa-config.ts`
- [x] Add `S3_*` env vars to `.env.prod.example`
- [x] Replace local file module in production

### 1.3 Nodemailer SMTP Notification Provider (order emails)
- [x] Install `@perseidesjs/notification-nodemailer` (community plugin, MIT, v3.1.1)
- [x] Register as notification provider in `backend/medusa-config.ts`
- [x] Add env vars to `.env.prod.example`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`
- [x] Create subscribers for: `order.placed`, `order.shipped`, `order.canceled`

### 1.4 Redis Caching + Locking Modules
- [x] Add Redis Caching Module to `medusa-config.ts`
- [x] Add Redis Locking Module Provider to `medusa-config.ts`
- [x] Add `CACHE_REDIS_URL` and `LOCKING_REDIS_URL` env vars

---

## Phase 2 — Data: Greek Silk Products Seed

> Remove demo electronics, seed real silk product data.

### 2.1 Clean Existing Data
- [ ] Create `backend/src/scripts/clean-seed-data.ts` to delete demo products, categories, collections

### 2.2 New Seed Script
- [ ] Create `backend/src/scripts/seed-silk-shop.ts` with:

**Regions:**
- Greece (GR) — EUR, default
- EU (DE, FR, IT, ES, NL, AT, BE, etc.) — EUR
- Cyprus (CY) — EUR

**Tax Regions:**
- Greece: 24% standard, 13% reduced (clothing may qualify)
- Cyprus: 19%
- EU: per-country defaults

**Categories:**
- Scarves & Shawls
- Clothing (Blouses, Dresses, Skirts)
- Home & Living (Pillowcases, Throws, Table Runners)
- Accessories (Ties, Pocket Squares, Hair Accessories)
- Gifts & Sets

**Collections:**
- "New Arrivals"
- "Bestsellers"
- "Luxury Collection"
- "Wedding & Bridal"

**Products (15-20 initial):**
- Silk Scarf "Aegean Blue" — multiple sizes (70×70, 90×90, 140×140)
- Silk Pillowcase Set — Standard, King
- Silk Blouse "Olympia" — XS-XL
- Silk Tie "Parthenon" — One Size
- Silk Dress "Santorini" — XS-XL
- Silk Throw "Mykonos" — 130×170
- Silk Eye Mask "Morpheus" — One Size
- Mulberry Silk Robe "Aphrodite" — S-XL
- Silk Hair Scrunchie Set — Pack of 3, Pack of 6
- Table Runner "Cyclades" — 35×180, 35×250
- Silk Pocket Square "Acropolis" — One Size
- Bridal Silk Set "Hera" — S-XL
- Silk Pajama Set "Nyx" — XS-XL
- Baby Silk Blanket "Eros" — One Size
- Gift Set "Athena" — Scarf + Pillowcase + Eye Mask

**Sales Channels:**
- "B2C Storefront" — all products
- "B2B Wholesale" — all products (with separate price list)

**Publishable API Keys:**
- One key scoped to B2C channel
- One key scoped to B2B channel

**Shipping:**
- Standard Shipping (5-7 days) — flat €5.00 / free over €100
- Express Shipping (1-3 days) — flat €12.00
- Free Shipping on orders over €100

### 2.3 Placeholder Images
- [ ] Use high-quality placeholder images (silk textures, fabric photos)
- [ ] Upload via S3 or local file module

---

## Phase 3 — B2C / B2B Channel Switching

> Let users switch between retail and wholesale views.

### 3.1 Architecture
- Two publishable API keys (one per channel)
- A React context that holds the active channel
- Channel selector dropdown in the header
- Persist selection in cookie (survives page reloads)
- Server-side: read cookie in middleware, set correct API key header

### 3.2 Implementation
- [ ] Create `storefront/src/lib/context/channel-context.tsx`
- [ ] Create `ChannelSelector` dropdown component (shadcn `Select`)
- [ ] Update `storefront/src/lib/data/` fetch helpers to use dynamic publishable key
- [ ] Update `storefront/src/middleware.ts` to read channel cookie
- [ ] Add `NEXT_PUBLIC_MEDUSA_B2C_PUBLISHABLE_KEY` and `NEXT_PUBLIC_MEDUSA_B2B_PUBLISHABLE_KEY` env vars
- [ ] Show wholesale pricing in B2B mode, retail pricing in B2C mode
- [ ] B2B mode: show company features (quotes, approvals, spending limits)
- [ ] B2C mode: hide company features, show standard checkout

---

## Phase 4 — Storefront: shadcn/ui + Theming System

> Replace `@medusajs/ui` with shadcn components. Build a theme system compatible with shadcnstudio.com.

### 4.1 Initialize shadcn/ui
- [x] Run `npx shadcn@latest init` in storefront
- [x] Configure `components.json` (path aliases, style, etc.)
- [x] Install core components: `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `skeleton`, `badge`, `avatar`, `accordion`, `tabs`, `toast`, `tooltip`, `popover`, `command`, `table`, `form`, `checkbox`, `radio-group`, `switch`, `textarea`, `navigation-menu`, `breadcrumb`, `carousel`, `aspect-ratio`

### 4.2 Theming System (shadcnstudio.com compatible)
- [x] Rewrite `storefront/src/styles/globals.css` with CSS variables matching the shadcnstudio.com format:
  - `:root` — light mode variables
  - `.dark` — dark mode variables
  - `@theme inline` — Tailwind v4 theme bindings
- [x] Variables to support:
  - `--background`, `--foreground`
  - `--card`, `--card-foreground`
  - `--popover`, `--popover-foreground`
  - `--primary`, `--primary-foreground`
  - `--secondary`, `--secondary-foreground`
  - `--muted`, `--muted-foreground`
  - `--accent`, `--accent-foreground`
  - `--destructive`
  - `--border`, `--input`, `--ring`
  - `--chart-1` through `--chart-5`
  - `--sidebar-*` variants
  - `--font-sans`, `--font-serif`, `--font-mono`
  - `--radius`
  - `--shadow-*` scale
- [x] Default theme: warm silk/gold aesthetic (browns, golds, cream)
- [x] Dark mode support (toggle in header)
- [x] Ensure drop-in replacement: paste any shadcnstudio.com export into globals.css

### 4.3 Bridge @medusajs/ui to Our Theme (No Component Replacement)
- [x] Override `@medusajs/ui` CSS variables (`--bg-base`, `--fg-base`, `--border-base`, `--button-*`, etc.) in `globals.css` for both light and dark modes
- [x] `@medusajs/ui` components (Button, Table, Drawer, Prompt, Select, CurrencyInput, StatusBadge…) automatically adopt the silk/gold palette — no import changes needed
- **Decision:** Keep `@medusajs/ui` and `@medusajs/ui-preset`. New pages/sections use shadcn components. Existing components keep their current imports unchanged.
- **Why:** 111 files use `@medusajs/ui`. The CSS variable bridge gives us full theming control in one place (~80 CSS variable overrides), making a full component replacement unnecessary and wasteful.

---

## Phase 5 — Storefront: Full Redesign

> Rebuild every module with shadcn components, keeping existing business logic.

### 5.1 Layout
- [ ] **Nav:** Redesign with shadcn `NavigationMenu` + `Sheet` (mobile)
  - Logo (Greek silk branding)
  - Category mega-menu
  - B2C/B2B channel selector (`Select`)
  - Search (`Command` palette or input)
  - Account dropdown (`DropdownMenu`)
  - Cart sheet (`Sheet`)
  - Dark mode toggle
- [ ] **Footer:** Redesign with shadcn components, brand story section
- [ ] **Mobile nav:** `Sheet` from left with category tree

### 5.2 Home Page
- [ ] Hero section: full-width silk imagery with CTA
- [ ] Featured collections carousel (`Carousel`)
- [ ] Category grid (`Card` components)
- [ ] "Our Story" section (Greek heritage narrative)
- [ ] Testimonials / trust signals
- [ ] Newsletter signup (`Input` + `Button`)

### 5.3 Product Listing (PLP)
- [ ] Grid layout with `Card` components
- [ ] Filter sidebar (`Accordion` + `Checkbox` + `RadioGroup`)
- [ ] Sort dropdown (`Select`)
- [ ] Pagination or infinite scroll
- [ ] Quick view modal (`Dialog`)

### 5.4 Product Detail (PDP)
- [ ] Image gallery with zoom (`Carousel` + `AspectRatio`)
- [ ] Variant selector (size/color with `RadioGroup` or `ToggleGroup`)
- [ ] Add to cart with quantity (`Button` + `Input`)
- [ ] `Tabs` for description / care instructions / shipping info
- [ ] Related products carousel
- [ ] Breadcrumb navigation (`Breadcrumb`)

### 5.5 Cart
- [ ] Cart `Sheet` (slide-out from right)
- [ ] Line items with quantity controls
- [ ] Order summary with totals
- [ ] Proceed to checkout `Button`

### 5.6 Checkout
- [ ] Multi-step form (`Form` + `Input` + `Select`)
- [ ] Address form with country/region selectors
- [ ] Shipping method selection (`RadioGroup` + `Card`)
- [ ] Stripe payment element integration
- [ ] Order review step
- [ ] Order confirmation page

### 5.7 Account
- [ ] Login / Register forms (`Card` + `Form`)
- [ ] Account dashboard (`Tabs`: Orders, Profile, Addresses)
- [ ] Order history (`Table`)
- [ ] Address book (CRUD with `Dialog`)
- [ ] B2B: Company dashboard, employees, quotes, approvals

### 5.8 Other Pages
- [ ] Collections page
- [ ] Categories page
- [ ] Search results page
- [ ] 404 page with silk branding
- [ ] About / Story page (static)

---

## Phase 6 — Polish & Production Readiness

### 6.1 SEO & Performance
- [ ] Product structured data (JSON-LD)
- [ ] Open Graph meta tags
- [ ] Sitemap generation
- [ ] Image optimization (Next.js `Image` with S3)
- [ ] Lighthouse audit > 90 all categories

### 6.2 Analytics
- [ ] Add PostHog or Segment analytics module

### 6.3 Testing
- [ ] Full checkout flow (B2C)
- [ ] B2B quote request flow
- [ ] Channel switching
- [ ] Mobile responsive testing
- [ ] Cross-browser testing

---

## Execution Order

```
Phase 4.1-4.2 (shadcn init + theming) ─┐
Phase 1 (backend modules)             ─┼─> Phase 5 (redesign) ─> Phase 6 (polish)
Phase 2 (seed data)                    ─┤
Phase 3 (channel switching)            ─┘
```

**Start with:** Phase 4.1-4.2 (shadcn setup + theming) — everything else builds on top.

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| UI Library | shadcn/ui (Radix + Tailwind) | Copy-paste components, full control, theming |
| Theming | CSS vars via shadcnstudio.com format | Drop-in theme replacement |
| Icons | lucide-react | Default for shadcn, tree-shakeable |
| Forms | react-hook-form + zod (already installed) | Already in the project |
| Payments | Stripe (built-in provider) | Best support in Medusa |
| Email | `@perseidesjs/notification-nodemailer` v3.1.1 | Community plugin, any SMTP, MIT, no vendor lock-in |
| File Storage | S3 | Official Medusa provider, production-ready |
| Channel Switching | Cookie + middleware | SSR-compatible, no hydration issues |
| CSS | Tailwind CSS v4 + oklch colors | Modern, matches shadcnstudio.com output |
