/**
 * seed-mock-data.ts
 *
 * Enriches the silk shop database with realistic demo data:
 *   - Inventory levels (stock quantities at Athens Warehouse)
 *   - Inventory item details (HS codes, origin, dimensions, weight)
 *   - Product types & product tags (assigned to products)
 *   - Prices for empty-variant products (scarves, table runner, gift sets)
 *   - Price lists  (B2B Wholesale 20% off, VIP Retail 10% off, Bridal Trade 15% off)
 *   - Promotion campaigns  (SUMMER10, WELCOME5, BULK25, FREESHIP)
 *   - Return reasons
 *
 * Fully idempotent — safe to re-run.
 * Run with: yarn medusa exec ./src/scripts/seed-mock-data.ts
 */

import {
  createInventoryLevelsWorkflow,
  updateInventoryItemsWorkflow,
  createPriceListsWorkflow,
  createPriceListPricesWorkflow,
  createProductTypesWorkflow,
  createProductTagsWorkflow,
  updateProductsWorkflow,
  createPromotionsWorkflow,
  createCampaignsWorkflow,
  addOrRemoveCampaignPromotionsWorkflow,
  createReturnReasonsWorkflow,
} from "@medusajs/core-flows";
import {
  ExecArgs,
  IInventoryService,
  IProductModuleService,
  IPricingModuleService,
  IPromotionModuleService,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  PriceListStatus,
  PriceListType,
  PromotionType,
  ApplicationMethodType,
  ApplicationMethodTargetType,
  ApplicationMethodAllocation,
  PromotionStatus,
} from "@medusajs/framework/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Silk category → HS code mapping (approximate) */
const HS_CODES: Record<string, string> = {
  scarf:     "6214.10.00",
  shawl:     "6214.10.00",
  blouse:    "6206.10.00",
  dress:     "6204.49.10",
  robe:      "6207.91.00",
  kimono:    "6207.91.00",
  pajama:    "6207.91.00",
  pillowcase:"6302.31.10",
  throw:     "6301.10.00",
  runner:    "6303.92.10",
  tie:       "6215.10.00",
  pocket:    "6215.10.00",
  mask:      "6217.10.00",
  scrunchie: "6217.10.00",
  headband:  "6217.10.00",
  bridal:    "6302.31.10",
  gift:      "6308.00.00",
  wedding:   "6214.10.00",
  corporate: "6215.10.00",
};

function hsCodeForSku(sku: string): string {
  const lower = sku.toLowerCase();
  for (const [key, code] of Object.entries(HS_CODES)) {
    if (lower.includes(key)) return code;
  }
  return "6214.10.00";
}

/** Randomise a stock count for realistic-looking demo data */
function stockQty(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export default async function seedMockData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const inventoryService: IInventoryService = container.resolve(
    ModuleRegistrationName.INVENTORY
  );
  const productModuleService: IProductModuleService = container.resolve(
    ModuleRegistrationName.PRODUCT
  );
  const pricingService: IPricingModuleService = container.resolve(
    ModuleRegistrationName.PRICING
  );
  const promotionService: IPromotionModuleService = container.resolve(
    ModuleRegistrationName.PROMOTION
  );

  // ── 1. Resolve stock location ─────────────────────────────────────────────
  const stockLocationMod = container.resolve(ModuleRegistrationName.STOCK_LOCATION);
  const [stockLocation] = await stockLocationMod.listStockLocations({ name: "Athens Warehouse" });
  if (!stockLocation) throw new Error("Athens Warehouse stock location not found — run seed-silk-shop.ts first");
  const locationId = stockLocation.id;

  // ── 2. Inventory levels ───────────────────────────────────────────────────
  logger.info("Seeding inventory levels...");

  const allInventoryItems = await inventoryService.listInventoryItems({});
  const existingLevels = await inventoryService.listInventoryLevels({ location_id: [locationId] });
  const itemsWithLevel = new Set(existingLevels.map((l) => l.inventory_item_id));

  const levelsToCreate = allInventoryItems
    .filter((item) => !itemsWithLevel.has(item.id))
    .map((item) => {
      const sku = (item.sku ?? "").toLowerCase();
      // Gift sets / bridal / corporate → lower stock; accessories → higher
      let qty: number;
      if (sku.includes("bridal") || sku.includes("corporate") || sku.includes("gift"))
        qty = stockQty(5, 25);
      else if (sku.includes("scarf") || sku.includes("shawl"))
        qty = stockQty(20, 80);
      else if (sku.includes("pillow") || sku.includes("throw") || sku.includes("runner"))
        qty = stockQty(15, 60);
      else if (sku.includes("tie") || sku.includes("pocket") || sku.includes("mask"))
        qty = stockQty(30, 100);
      else if (sku.includes("scrunchie") || sku.includes("headband"))
        qty = stockQty(40, 120);
      else
        qty = stockQty(10, 50);

      return {
        inventory_item_id: item.id,
        location_id: locationId,
        stocked_quantity: qty,
      };
    });

  if (levelsToCreate.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: levelsToCreate },
    });
    logger.info(`Created ${levelsToCreate.length} inventory levels.`);
  } else {
    logger.info("Inventory levels already exist — skipping.");
  }

  // ── 3. Enrich inventory item metadata ────────────────────────────────────
  logger.info("Enriching inventory item metadata...");

  // Only update items that are still missing hs_code (idempotent by checking hs_code)
  const itemsMissingMeta = allInventoryItems.filter((item) => !item.hs_code);
  if (itemsMissingMeta.length > 0) {
    const updates = itemsMissingMeta.map((item) => {
      const sku = item.sku ?? "";
      const lowerSku = sku.toLowerCase();
      // Approximate weight in grams from SKU keywords
      let weight = item.weight ?? 100;
      if (lowerSku.includes("robe")) weight = 420;
      else if (lowerSku.includes("pajama") || lowerSku.includes("pj-")) weight = 350;
      else if (lowerSku.includes("pillow")) weight = 100;
      else if (lowerSku.includes("throw")) weight = 400;
      else if (lowerSku.includes("runner")) weight = 150;
      else if (lowerSku.includes("dress")) weight = 280;
      else if (lowerSku.includes("blouse")) weight = 180;
      else if (lowerSku.includes("bridal-hera")) weight = 1200;
      else if (lowerSku.includes("tie")) weight = 90;
      else if (lowerSku.includes("pocket")) weight = 30;
      else if (lowerSku.includes("mask")) weight = 40;
      else if (lowerSku.includes("scrunchie")) weight = 15;
      else if (lowerSku.includes("headband")) weight = 35;
      else if (lowerSku.includes("scarf")) weight = 120;
      else if (lowerSku.includes("shawl") || lowerSku.includes("santorini")) weight = 200;
      else if (lowerSku.includes("kimono")) weight = 160;

      return {
        id: item.id,
        hs_code: hsCodeForSku(sku),
        origin_country: "GR",
        material: "Silk",
        weight,
        mid_code: `MID-GR-${sku.substring(0, 8).toUpperCase()}`,
        title: item.title ?? item.sku ?? undefined,
        description: item.description ?? undefined,
      };
    });

    await updateInventoryItemsWorkflow(container).run({
      input: { updates },
    });
    logger.info(`Enriched ${updates.length} inventory items.`);
  } else {
    logger.info("Inventory item metadata already enriched — skipping.");
  }

  // ── 4. Product types ──────────────────────────────────────────────────────
  logger.info("Seeding product types...");
  const existingTypes = await productModuleService.listProductTypes({});
  const typesByValue = new Map(existingTypes.map((t) => [t.value, t]));

  const typeDefs = [
    { value: "Scarves & Shawls" },
    { value: "Clothing" },
    { value: "Home & Living" },
    { value: "Accessories" },
    { value: "Gift Sets" },
  ];
  const typesToCreate = typeDefs.filter((t) => !typesByValue.has(t.value));
  if (typesToCreate.length > 0) {
    const { result } = await createProductTypesWorkflow(container).run({
      input: { product_types: typesToCreate },
    });
    result.forEach((t) => typesByValue.set(t.value, t));
    logger.info(`Created ${result.length} product types.`);
  }

  // ── 5. Product tags ───────────────────────────────────────────────────────
  logger.info("Seeding product tags...");
  const existingTags = await productModuleService.listProductTags({});
  const tagsByValue = new Map(existingTags.map((t) => [t.value, t]));

  const tagDefs = [
    "mulberry-silk", "charmeuse", "22mm", "19mm", "16mm", "hand-rolled",
    "made-in-greece", "sustainable", "luxury", "bridal", "corporate-gifting",
    "bestseller", "new-arrival", "summer", "wedding", "mens", "gift-idea",
    "pillowcase", "loungewear", "accessories",
  ];
  const tagsToCreate = tagDefs
    .filter((v) => !tagsByValue.has(v))
    .map((v) => ({ value: v }));
  if (tagsToCreate.length > 0) {
    const { result } = await createProductTagsWorkflow(container).run({
      input: { product_tags: tagsToCreate },
    });
    result.forEach((t) => tagsByValue.set(t.value, t));
    logger.info(`Created ${result.length} product tags.`);
  }

  // ── 6. Assign types + tags to products ───────────────────────────────────
  logger.info("Assigning product types and tags...");
  const allProducts = await productModuleService.listProducts(
    {},
    { select: ["id", "handle", "type_id", "tags"] }
  );

  const typeMap: Record<string, string> = {
    "silk-scarf": "Scarves & Shawls",
    "silk-shawl": "Scarves & Shawls",
    "silk-long-scarf": "Scarves & Shawls",
    "silk-blouse": "Clothing",
    "silk-dress": "Clothing",
    "silk-robe": "Clothing",
    "silk-kimono": "Clothing",
    "silk-pajama": "Clothing",
    "silk-pillowcase": "Home & Living",
    "silk-throw": "Home & Living",
    "silk-table-runner": "Home & Living",
    "silk-tie": "Accessories",
    "silk-pocket-square": "Accessories",
    "silk-eye-mask": "Accessories",
    "silk-hair-scrunchie": "Accessories",
    "silk-headband": "Accessories",
    "silk-bridal-set": "Gift Sets",
    "silk-gift-set": "Gift Sets",
    "silk-corporate-gift": "Gift Sets",
    "silk-wedding-favour": "Gift Sets",
  };

  const tagMap: Record<string, string[]> = {
    "silk-scarf-aegean-blue":         ["mulberry-silk", "hand-rolled", "bestseller", "made-in-greece"],
    "silk-scarf-olive-grove":          ["charmeuse", "summer", "hand-rolled", "made-in-greece"],
    "silk-shawl-santorini-sunset":     ["16mm", "hand-rolled", "new-arrival", "luxury"],
    "silk-long-scarf-poseidon":        ["mulberry-silk", "bestseller", "made-in-greece"],
    "silk-blouse-olympia":             ["mulberry-silk", "new-arrival", "made-in-greece"],
    "silk-dress-santorini":            ["luxury", "new-arrival", "made-in-greece"],
    "silk-robe-aphrodite":             ["22mm", "luxury", "loungewear", "made-in-greece"],
    "silk-kimono-thessaloniki":        ["mulberry-silk", "summer", "made-in-greece"],
    "silk-pajama-set-nyx":             ["charmeuse", "loungewear", "bestseller", "made-in-greece"],
    "silk-pillowcase-set":             ["22mm", "pillow-case", "bestseller", "made-in-greece"],
    "silk-throw-mykonos":              ["summer", "new-arrival", "home"],
    "silk-table-runner-cyclades":      ["luxury", "made-in-greece"],
    "silk-tie-parthenon":              ["mulberry-silk", "mens", "hand-rolled", "made-in-greece"],
    "silk-pocket-square-acropolis":    ["mulberry-silk", "mens", "gift-idea"],
    "silk-eye-mask-morpheus":          ["19mm", "bestseller", "accessories"],
    "silk-hair-scrunchie-set":         ["mulberry-silk", "accessories", "gift-idea"],
    "silk-headband":                   ["mulberry-silk", "summer", "accessories"],
    "silk-bridal-set-hera":            ["bridal", "wedding", "luxury", "gift-idea"],
    "silk-gift-set-athena":            ["gift-idea", "bestseller"],
    "silk-corporate-gift-pericles":    ["corporate-gifting", "mens", "gift-idea"],
    "silk-wedding-favour-eros":        ["bridal", "wedding", "gift-idea"],
  };

  const productsNeedingType = allProducts.filter((p) => {
    if (!p.handle) return false;
    const prefix = Object.keys(typeMap).find((k) => p.handle!.startsWith(k));
    if (!prefix) return false;
    const targetTypeId = typesByValue.get(typeMap[prefix])?.id;
    return targetTypeId && p.type_id !== targetTypeId;
  });

  if (productsNeedingType.length > 0) {
    for (const product of productsNeedingType) {
      const prefix = Object.keys(typeMap).find((k) => product.handle!.startsWith(k))!;
      const typeId = typesByValue.get(typeMap[prefix])?.id;
      const tagValues = tagMap[product.handle!] ?? [];
      const tagIds = tagValues
        .map((v) => tagsByValue.get(v)?.id)
        .filter(Boolean) as string[];

      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: product.id },
          update: {
            type_id: typeId,
            ...(tagIds.length > 0 ? { tags: tagIds.map((id) => ({ id })) } : {}),
          },
        },
      });
    }
    logger.info(`Assigned types/tags to ${productsNeedingType.length} products.`);
  } else {
    logger.info("Product types/tags already assigned — skipping.");
  }

  // ── 7. Fill in prices for variants that have none ─────────────────────────
  logger.info("Checking for variants missing prices...");

  // Products with empty variants in the seed: scarves (Aegean Blue, Olive Grove),
  // Santorini Sunset, Poseidon, table runner, Gift Set Athena, Pericles, Eros
  const emptyVariantPrices: Array<{
    variantSkuPrefix: string;
    eur: number;
    usd: number;
    gbp: number;
  }> = [
    // Scarves
    { variantSkuPrefix: "SCARF-AEGEAN",    eur: 8900,  usd: 9900,  gbp: 7800 },
    { variantSkuPrefix: "SCARF-OLIVE",     eur: 7900,  usd: 8700,  gbp: 6900 },
    { variantSkuPrefix: "SHAWL-SANTORINI", eur: 14900, usd: 16500, gbp: 12900 },
    { variantSkuPrefix: "SCARF-LONG-POSEIDON", eur: 6900, usd: 7600, gbp: 5900 },
    // Table runner
    { variantSkuPrefix: "RUNNER-CYCLADES", eur: 5900,  usd: 6500,  gbp: 5200 },
    // Gift sets
    { variantSkuPrefix: "GIFT-ATHENA",     eur: 19900, usd: 21900, gbp: 17500 },
    { variantSkuPrefix: "PERICLES",        eur: 12900, usd: 14200, gbp: 11200 },
    { variantSkuPrefix: "EROS",            eur: 4500,  usd: 4900,  gbp: 3900  },
  ];

  // Get all variants (id + sku only — price_set is not a direct ORM relation)
  const allVariants = await productModuleService.listProductVariants(
    {},
    { select: ["id", "sku"] }
  ) as Array<{ id: string; sku: string | null }>;

  const pricingMod = pricingService;

  // Build a variant-id → price-set-id map using the pricing module's link data
  // We'll query variant price sets using the remote query graph API.
  const remoteQuery = container.resolve<import("@medusajs/framework/types").RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  async function getPriceSetForVariant(variantId: string): Promise<string | null> {
    try {
      const { data } = await remoteQuery.graph({
        entity: "variant",
        fields: ["id", "price_set.id"],
        filters: { id: variantId },
      });
      return (data?.[0] as any)?.price_set?.id ?? null;
    } catch {
      return null;
    }
  }

  for (const rule of emptyVariantPrices) {
    const matchingVariants = allVariants.filter(
      (v) => v.sku && v.sku.startsWith(rule.variantSkuPrefix)
    );

    for (const variant of matchingVariants) {
      const priceSetId = await getPriceSetForVariant(variant.id);
      if (!priceSetId) continue;

      // Check if prices already exist for this price set
      const existingPrices = await pricingMod.listPrices(
        { price_set_id: [priceSetId] },
        { select: ["id"] }
      );
      if (existingPrices.length > 0) continue;

      await pricingMod.addPrices([
        {
          priceSetId,
          prices: [
            { currency_code: "eur", amount: rule.eur },
            { currency_code: "usd", amount: rule.usd },
            { currency_code: "gbp", amount: rule.gbp },
          ],
        },
      ]);
    }
  }
  logger.info("Variant prices filled.");

  // ── 8. Resolve customer groups for price lists ────────────────────────────
  const customerModuleService = container.resolve(ModuleRegistrationName.CUSTOMER);
  const allGroups = await customerModuleService.listCustomerGroups({});
  const b2bGroupId   = allGroups.find((g) => g.name === "B2B Wholesale")?.id;
  const vipGroupId   = allGroups.find((g) => g.name === "VIP Retail")?.id;
  const bridalGroupId = allGroups.find((g) => g.name === "Bridal Trade")?.id;

  // ── 9. Price lists ────────────────────────────────────────────────────────
  logger.info("Seeding price lists...");

  // Collect all silk variants for price list pricing via remote query
  const { data: variantRows } = await remoteQuery.graph({
    entity: "variant",
    fields: ["id", "sku", "product.handle", "price_set.id", "price_set.prices.currency_code", "price_set.prices.amount"],
  }) as { data: Array<{
    id: string;
    sku: string | null;
    product?: { handle?: string };
    price_set?: { id: string; prices?: Array<{ currency_code: string; amount: number }> } | null;
  }> };

  const silkOnly = variantRows.filter(
    (v) =>
      v.sku &&
      !v.sku.startsWith("MED-") &&
      !v.product?.handle?.startsWith("ACME") &&
      v.price_set?.id
  );

  // Get base EUR prices for each variant
  const variantBasePrices = new Map<string, number>();
  for (const v of silkOnly) {
    const eurPrice = v.price_set?.prices?.find((p) => p.currency_code === "eur");
    if (eurPrice) variantBasePrices.set(v.id, eurPrice.amount);
  }

  const existingPriceLists = await pricingMod.listPriceLists({});
  const priceListsByTitle = new Map(existingPriceLists.map((pl) => [pl.title, pl]));

  const priceListDefs: Array<{
    title: string;
    name: string;
    description: string;
    type: string;
    status: string;
    starts_at?: Date;
    ends_at?: Date;
    discountPct: number;
    customerGroupIds: string[];
    currencies: Array<{ code: string; rate: number }>;
  }> = [
    {
      title: "B2B Wholesale – 20% Off",
      name: "B2B Wholesale – 20% Off",
      description: "20% discount for verified B2B wholesale partners ordering via the B2B channel.",
      type: PriceListType.SALE,
      status: PriceListStatus.ACTIVE,
      discountPct: 0.20,
      customerGroupIds: b2bGroupId ? [b2bGroupId] : [],
      currencies: [
        { code: "eur", rate: 1.0 },
        { code: "usd", rate: 1.1 },
        { code: "gbp", rate: 0.875 },
      ],
    },
    {
      title: "VIP Retail – 10% Off",
      name: "VIP Retail – 10% Off",
      description: "Exclusive 10% loyalty discount for VIP retail members.",
      type: PriceListType.SALE,
      status: PriceListStatus.ACTIVE,
      discountPct: 0.10,
      customerGroupIds: vipGroupId ? [vipGroupId] : [],
      currencies: [
        { code: "eur", rate: 1.0 },
        { code: "usd", rate: 1.1 },
        { code: "gbp", rate: 0.875 },
      ],
    },
    {
      title: "Bridal Trade – 15% Off",
      name: "Bridal Trade – 15% Off",
      description: "15% discount for bridal trade buyers and wedding planners.",
      type: PriceListType.SALE,
      status: PriceListStatus.ACTIVE,
      discountPct: 0.15,
      customerGroupIds: bridalGroupId ? [bridalGroupId] : [],
      currencies: [
        { code: "eur", rate: 1.0 },
        { code: "usd", rate: 1.1 },
        { code: "gbp", rate: 0.875 },
      ],
    },
    {
      title: "Summer Sale 2025 – 25% Off Scarves",
      name: "Summer Sale 2025 – 25% Off Scarves",
      description: "Seasonal summer promotion: 25% off all scarves and shawls.",
      type: PriceListType.SALE,
      status: PriceListStatus.ACTIVE,
      starts_at: new Date("2025-06-01"),
      ends_at: new Date("2025-09-30"),
      discountPct: 0.25,
      customerGroupIds: [],
      currencies: [
        { code: "eur", rate: 1.0 },
        { code: "usd", rate: 1.1 },
        { code: "gbp", rate: 0.875 },
      ],
    },
  ];

  for (const def of priceListDefs) {
    if (priceListsByTitle.has(def.title)) {
      logger.info(`Price list "${def.title}" already exists — skipping.`);
      continue;
    }

    // Filter variants for this price list (scarves only for summer sale)
    const targetVariants =
      def.title.includes("Summer Sale")
        ? silkOnly.filter(
            (v) =>
              v.sku &&
              (v.sku.startsWith("SCARF") ||
               v.sku.startsWith("SHAWL") ||
               v.sku.startsWith("LONG-SCARF"))
          )
        : silkOnly;

    // Build prices array
    const prices: Array<{
      variant_id: string;
      currency_code: string;
      amount: number;
      min_quantity?: number;
    }> = [];

    for (const variant of targetVariants) {
      const baseEur = variantBasePrices.get(variant.id);
      if (!baseEur) continue;

      for (const cur of def.currencies) {
        const discounted = Math.round(baseEur * (1 - def.discountPct) * cur.rate);
        prices.push({
          variant_id: variant.id,
          currency_code: cur.code,
          amount: discounted,
          ...(def.title.includes("B2B") ? { min_quantity: 5 } : {}),
        });
      }
    }

    if (prices.length === 0) {
      logger.warn(`No variants found for price list "${def.title}" — skipping.`);
      continue;
    }

    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: def.title,
            name: def.name,
            description: def.description,
            type: def.type as any,
            status: def.status as any,
            ...(def.starts_at ? { starts_at: def.starts_at } : {}),
            ...(def.ends_at   ? { ends_at:   def.ends_at   } : {}),
            ...(def.customerGroupIds.length > 0
              ? { rules: { customer_group_id: def.customerGroupIds } }
              : {}),
            prices,
          } as any,
        ],
      },
    });

    logger.info(`Created price list "${def.title}" with ${prices.length} prices.`);
  }

  // ── 10. Campaigns ─────────────────────────────────────────────────────────
  logger.info("Seeding promotion campaigns...");

  const existingCampaigns = await promotionService.listCampaigns({});
  const campaignsByIdentifier = new Map(
    existingCampaigns.map((c) => [c.campaign_identifier, c])
  );

  const campaignDefs = [
    {
      name: "Summer 2025",
      campaign_identifier: "SUMMER-2025",
      description: "Summer 2025 promotional campaign",
      starts_at: new Date("2025-06-01"),
      ends_at:   new Date("2025-09-30"),
      budget: { type: "usage" as const, limit: 500 },
    },
    {
      name: "Welcome Program",
      campaign_identifier: "WELCOME-ALWAYS",
      description: "Ongoing welcome discount for new customers",
      budget: { type: "usage" as const, limit: 1000 },
    },
    {
      name: "Bridal Season 2025",
      campaign_identifier: "BRIDAL-2025",
      description: "Bridal & wedding season campaign",
      starts_at: new Date("2025-03-01"),
      ends_at:   new Date("2025-10-31"),
      budget: { type: "spend" as const, limit: 50000, currency_code: "eur" },
    },
    {
      name: "B2B Bulk Programme",
      campaign_identifier: "B2B-BULK",
      description: "Standing bulk order incentive for B2B buyers",
      budget: { type: "usage" as const, limit: 5000 },
    },
  ];

  const campaignsToCreate = campaignDefs.filter(
    (c) => !campaignsByIdentifier.has(c.campaign_identifier)
  );

  if (campaignsToCreate.length > 0) {
    const { result: createdCampaigns } = await createCampaignsWorkflow(container).run({
      input: { campaignsData: campaignsToCreate as any },
    });
    createdCampaigns.forEach((c) => campaignsByIdentifier.set(c.campaign_identifier!, c));
    logger.info(`Created ${createdCampaigns.length} campaigns.`);
  }

  // ── 11. Promotions ────────────────────────────────────────────────────────
  logger.info("Seeding promotions...");

  const existingPromotions = await promotionService.listPromotions({});
  const promotionsByCode = new Map(existingPromotions.map((p) => [p.code, p]));

  const promotionDefs = [
    {
      code: "SUMMER10",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "SUMMER-2025",
      application_method: {
        type: ApplicationMethodType.PERCENTAGE,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 10,
        currency_code: "eur",
      },
    },
    {
      code: "WELCOME5",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "WELCOME-ALWAYS",
      application_method: {
        type: ApplicationMethodType.PERCENTAGE,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 5,
        currency_code: "eur",
      },
    },
    {
      code: "BRIDAL15",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "BRIDAL-2025",
      application_method: {
        type: ApplicationMethodType.PERCENTAGE,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 15,
        currency_code: "eur",
      },
    },
    {
      // each + percentage: max_quantity required
      code: "BULK25",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "B2B-BULK",
      application_method: {
        type: ApplicationMethodType.PERCENTAGE,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.EACH,
        value: 25,
        currency_code: "eur",
        max_quantity: 100,
      },
    },
    {
      // each + fixed shipping: max_quantity required
      code: "FREESHIP",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "SUMMER-2025",
      application_method: {
        type: ApplicationMethodType.FIXED,
        target_type: ApplicationMethodTargetType.SHIPPING_METHODS,
        allocation: ApplicationMethodAllocation.EACH,
        value: 500,
        currency_code: "eur",
        max_quantity: 1,
      },
    },
    {
      code: "LUXURY20OFF",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "WELCOME-ALWAYS",
      application_method: {
        type: ApplicationMethodType.FIXED,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 2000,
        currency_code: "eur",
      },
    },
    {
      code: "SILK50",
      type: PromotionType.STANDARD,
      status: PromotionStatus.ACTIVE,
      campaign_identifier: "WELCOME-ALWAYS",
      application_method: {
        type: ApplicationMethodType.FIXED,
        target_type: ApplicationMethodTargetType.ITEMS,
        allocation: ApplicationMethodAllocation.ACROSS,
        value: 5000,
        currency_code: "eur",
      },
    },
  ];

  const promotionsToCreate = promotionDefs.filter(
    (p) => !promotionsByCode.has(p.code)
  );

  if (promotionsToCreate.length > 0) {
    const { result: createdPromotions } = await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: promotionsToCreate.map(({ campaign_identifier, ...rest }) => rest) as any,
      },
    });

    // Link promotions to their campaigns
    for (const promo of createdPromotions) {
      const def = promotionsToCreate.find((d) => d.code === promo.code);
      if (!def?.campaign_identifier) continue;
      const campaign = campaignsByIdentifier.get(def.campaign_identifier);
      if (!campaign) continue;

      try {
        await addOrRemoveCampaignPromotionsWorkflow(container).run({
          input: {
            id: campaign.id,
            add: [promo.id],
          },
        });
      } catch {
        logger.warn(`Could not link promotion ${promo.code} to campaign — may already be linked.`);
      }
    }

    logger.info(`Created ${createdPromotions.length} promotions.`);
  } else {
    logger.info("Promotions already exist — skipping.");
  }

  // ── 12. Return reasons ────────────────────────────────────────────────────
  logger.info("Seeding return reasons...");

  // Use the order module service (registration key: "order")
  const orderModuleService = container.resolve(ModuleRegistrationName.ORDER) as any;
  const existingReasons = await orderModuleService
    .listReturnReasons({})
    .catch(() => [] as Array<{ value: string }>);

  // Fallback: use the workflow which is idempotent via value check
  const returnReasonDefs = [
    { value: "wrong_item",       label: "Wrong item received",        description: "The item received does not match the order." },
    { value: "defective",        label: "Defective / damaged",        description: "Item arrived damaged or has a manufacturing defect." },
    { value: "not_as_described", label: "Not as described",           description: "The product does not match the website description or images." },
    { value: "changed_mind",     label: "Changed mind",               description: "Customer no longer wants the item." },
    { value: "sizing_issue",     label: "Sizing / fit issue",         description: "The size or dimensions do not suit the customer." },
    { value: "colour_mismatch",  label: "Colour not as expected",     description: "The colour looks different from the website photos." },
    { value: "late_delivery",    label: "Arrived too late",           description: "Item arrived after the required date (e.g. for a gift)." },
    { value: "quality_concern",  label: "Quality below expectation",  description: "The silk quality does not meet the customer's expectations." },
  ];

  const existingValues = new Set((existingReasons as Array<{value: string}>).map((r) => r.value));
  const reasonsToCreate = returnReasonDefs.filter((r) => !existingValues.has(r.value));

  if (reasonsToCreate.length > 0) {
    await createReturnReasonsWorkflow(container).run({
      input: { data: reasonsToCreate },
    });
    logger.info(`Created ${reasonsToCreate.length} return reasons.`);
  } else {
    logger.info("Return reasons already exist — skipping.");
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  logger.info("Mock data seed complete!");
  logger.info("───────────────────────────────────────────────────");
  logger.info("Summary of seeded data:");
  logger.info(`  ✓ ${levelsToCreate.length} inventory levels created`);
  logger.info("  ✓ Inventory item metadata enriched (HS codes, origin, weights)");
  logger.info("  ✓ Product types & tags created and assigned");
  logger.info("  ✓ Missing variant prices added");
  logger.info("  ✓ 4 price lists (B2B 20%, VIP 10%, Bridal 15%, Summer 25%)");
  logger.info("  ✓ 4 campaigns + 7 promotions");
  logger.info("  ✓ 8 return reasons");
  logger.info("───────────────────────────────────────────────────");
}
