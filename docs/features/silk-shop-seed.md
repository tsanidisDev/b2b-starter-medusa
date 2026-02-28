# Silk Shop Seed

Seeds the Medusa database with Greek silk products, regions, sales channels, and publishable API keys for both B2C and B2B.

---

## Scripts

| Script | Command | What it does |
|---|---|---|
| `seed:silk` | `yarn seed:silk` | Full silk shop seed (idempotent — checks channels before creating) |
| `seed:clean` | `yarn seed:clean` | Removes all products, categories, and collections |
| `seed` (original) | `yarn seed` | Legacy demo electronics seed — kept for reference |

`scripts/dev.sh` runs `seed:silk` automatically on first boot (when no regions exist).

---

## What gets seeded

### Regions (EUR)
- **Greece** — GR
- **European Union** — DE, FR, IT, ES, NL, AT, BE, PT, IE, FI, SE, DK, PL
- **Cyprus** — CY

### Sales Channels + Publishable API Keys
- **B2C Storefront** — `pk_...` (printed to console after seed, set in `storefront/.env.local`)
- **B2B Wholesale** — `pk_...` (for wholesale portal)

### Collections
`New Arrivals` · `Bestsellers` · `Luxury Collection` · `Wedding & Bridal`

### Categories
`Scarves & Shawls` · `Clothing` · `Home & Living` · `Accessories` · `Gifts & Sets`

### Products (15)

| Product | Category | Variants |
|---|---|---|
| Silk Scarf "Aegean Blue" | Scarves | 3 sizes |
| Silk Shawl "Santorini Sunset" | Scarves | 2 sizes |
| Silk Blouse "Olympia" | Clothing | 5 sizes × 2 colours |
| Silk Dress "Santorini" | Clothing | 5 sizes × 2 colours |
| Mulberry Silk Robe "Aphrodite" | Clothing | 4 sizes |
| Silk Pajama Set "Nyx" | Clothing | 5 sizes × 3 colours |
| Silk Pillowcase Set | Home | 2 sizes × 3 colours |
| Silk Throw "Mykonos" | Home | 1 size |
| Table Runner "Cyclades" | Home | 2 sizes |
| Silk Tie "Parthenon" | Accessories | 4 colours |
| Silk Pocket Square "Acropolis" | Accessories | 3 colours |
| Silk Eye Mask "Morpheus" | Accessories | 3 colours |
| Silk Hair Scrunchie Set | Accessories | 2 pack sizes × 3 colours |
| Bridal Silk Set "Hera" | Gifts | 4 sizes |
| Gift Set "Athena" | Gifts | One size |

### Shipping (Greece & EU zone)
- Standard (5-7 days) — €5.00 EU / €3.00 GR
- Express (1-3 days) — €12.00 EU / €8.00 GR

---

## After seeding

1. Copy the B2C publishable key printed to console
2. Set it in `storefront/.env.local`:
   ```dotenv
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
   ```
3. Enable payment providers in regions: Admin → Settings → Regions → edit each region

---

## Re-seeding

```bash
# Wipe products/categories/collections, then re-seed
cd backend
yarn seed:clean && yarn seed:silk
```

Or from repo root for a full DB reset:
```bash
bash scripts/dev.sh --reset
```
