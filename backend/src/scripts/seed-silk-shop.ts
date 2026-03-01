import {
  addOrRemoveCampaignPromotionsWorkflow,
  createApiKeysWorkflow,
  createCampaignsWorkflow,
  createCollectionsWorkflow,
  createCustomerGroupsWorkflow,
  createCustomersWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createReturnReasonsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateInventoryItemsWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows";
import {
  ExecArgs,
  IFulfillmentModuleService,
  IInventoryService,
  ISalesChannelModuleService,
  IStoreModuleService,
  IRegionModuleService,
  IProductModuleService,
  IPricingModuleService,
  IPromotionModuleService,
  ICustomerModuleService,
  IApiKeyModuleService,
  ITaxModuleService,
} from "@medusajs/framework/types";
import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  PriceListStatus,
  PriceListType,
  ProductStatus,
  PromotionStatus,
  PromotionType,
} from "@medusajs/framework/utils";
import { createCompaniesWorkflow } from "../workflows/company/workflows/create-companies";
import { COMPANY_MODULE } from "../modules/company";
import { ModuleCompanySpendingLimitResetFrequency } from "../types/company/module";

// ── Inventory helpers ────────────────────────────────────────────────────────
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

function stockQty(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Seeds the Greek Silk Shop with:
 * - 2 sales channels (B2C + B2B)
 * - Greek / EU / Cyprus / US regions
 * - Tax regions
 * - Athens warehouse + shipping options
 * - 2 publishable API keys
 * - 6 collections, 5 top-level categories + sub-categories
 * - 25 silk products with variants and inventory
 * - 3 demo B2B companies + customer groups + employee customers
 *
 * Run with: yarn medusa exec src/scripts/seed-silk-shop.ts
 */
export default async function seedSilkShop({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );
  const salesChannelModuleService: ISalesChannelModuleService =
    container.resolve(ModuleRegistrationName.SALES_CHANNEL);
  const storeModuleService: IStoreModuleService = container.resolve(
    ModuleRegistrationName.STORE
  );

  // ── Sales Channels ─────────────────────────────────────────────────────────
  logger.info("Creating sales channels...");

  let b2cChannel = (
    await salesChannelModuleService.listSalesChannels({
      name: "B2C Storefront",
    })
  )[0];
  if (!b2cChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "B2C Storefront" }],
      },
    });
    b2cChannel = result[0];
  }

  let b2bChannel = (
    await salesChannelModuleService.listSalesChannels({
      name: "B2B Wholesale",
    })
  )[0];
  if (!b2bChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "B2B Wholesale" }],
      },
    });
    b2bChannel = result[0];
  }

  // ── Store defaults ─────────────────────────────────────────────────────────
  logger.info("Updating store defaults...");
  const [store] = await storeModuleService.listStores();
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "eur", is_default: true },
          { currency_code: "usd" },
        ],
        default_sales_channel_id: b2cChannel.id,
      },
    },
  });

  // ── Regions ────────────────────────────────────────────────────────────────
  logger.info("Creating regions...");

  const euCountries = ["de", "fr", "it", "es", "nl", "at", "be", "pt", "ie", "fi", "se", "dk", "pl"];

  // Idempotent: look up existing regions and only create missing ones,
  // filtering out any countries already assigned to another region.
  const regionModuleService: IRegionModuleService = container.resolve(
    ModuleRegistrationName.REGION
  );
  const allExistingRegions = await regionModuleService.listRegions({});
  const existingRegionsByName = new Map(allExistingRegions.map((r) => [r.name, r]));

  // Build a set of country codes already assigned across ALL existing regions
  const allRegionsWithCountries = await regionModuleService.listRegions(
    {},
    { relations: ["countries"] }
  );
  const assignedCountryCodes = new Set<string>(
    allRegionsWithCountries.flatMap((r) =>
      (r.countries ?? []).map((c: { iso_2: string }) => c.iso_2)
    )
  );

  const desiredRegions = [
    { name: "Greece",          currency_code: "eur", countries: ["gr"] },
    { name: "European Union",  currency_code: "eur", countries: euCountries },
    { name: "Cyprus",          currency_code: "eur", countries: ["cy"] },
    { name: "United States",   currency_code: "usd", countries: ["us"] },
    { name: "United Kingdom",  currency_code: "gbp", countries: ["gb"] },
  ];

  for (const regionDef of desiredRegions) {
    if (existingRegionsByName.has(regionDef.name)) {
      logger.info(`Region "${regionDef.name}" already exists — skipping.`);
      continue;
    }
    const availableCountries = regionDef.countries.filter(
      (c) => !assignedCountryCodes.has(c)
    );
    if (availableCountries.length === 0) {
      logger.warn(
        `Region "${regionDef.name}" has no unassigned countries — skipping.`
      );
      continue;
    }
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            ...regionDef,
            countries: availableCountries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    existingRegionsByName.set(regionDef.name, result[0]);
    availableCountries.forEach((c) => assignedCountryCodes.add(c));
  }

  // Prefer Greece; fall back to any EUR region if somehow absent
  const greeceRegion =
    existingRegionsByName.get("Greece") ??
    [...existingRegionsByName.values()].find((r) => r.currency_code === "eur");

  if (!greeceRegion) throw new Error("Could not resolve a EUR region for shipping prices");

  logger.info("Finished seeding regions.");

  // ── Tax regions ────────────────────────────────────────────────────────────
  logger.info("Creating tax regions...");
  const taxModuleService: ITaxModuleService = container.resolve(
    ModuleRegistrationName.TAX
  );
  const existingTaxRegions = await taxModuleService.listTaxRegions({});
  const taxedCountries = new Set(existingTaxRegions.map((r) => r.country_code));
  const allCountries = ["gr", "cy", "us", "gb", ...euCountries];
  const countriesForTax = allCountries.filter((c) => !taxedCountries.has(c));
  if (countriesForTax.length > 0) {
    await createTaxRegionsWorkflow(container).run({
      input: countriesForTax.map((country_code) => ({ country_code, provider_id: "tp_system" })),
    });
  }
  logger.info("Finished seeding tax regions.");

  // ── Stock location ─────────────────────────────────────────────────────────
  logger.info("Creating stock location...");
  const stockLocationMod = container.resolve(ModuleRegistrationName.STOCK_LOCATION);
  const existingLocations = await stockLocationMod.listStockLocations({ name: "Athens Warehouse" });
  let stockLocation: { id: string };
  if (existingLocations.length > 0) {
    stockLocation = existingLocations[0];
    logger.info("Stock location \"Athens Warehouse\" already exists — skipping.");
  } else {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Athens Warehouse",
            address: { city: "Athens", country_code: "GR", address_1: "" },
          },
        ],
      },
    });
    stockLocation = stockLocationResult[0];
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      });
    } catch {
      logger.warn("Stock location ↔ fulfillment provider link may already exist.");
    }
  }

  // ── Shipping ───────────────────────────────────────────────────────────────
  logger.info("Creating shipping...");
  const existingProfiles =
    await fulfillmentModuleService.listShippingProfiles({ name: "Default" });
  const shippingProfile =
    existingProfiles.length > 0
      ? existingProfiles[0]
      : (
          await createShippingProfilesWorkflow(container).run({
            input: { data: [{ name: "Default", type: "default" }] },
          })
        ).result[0];

  const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets(
    { name: "Greece & EU Shipping" },
    { relations: ["service_zones"] }
  );
  let serviceZoneId: string;
  if (fulfillmentSets.length > 0) {
    logger.info("Fulfillment set \"Greece & EU Shipping\" already exists — skipping.");
    serviceZoneId = fulfillmentSets[0].service_zones[0]?.id ?? "";
  } else {
    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Greece & EU Shipping",
      type: "shipping",
      service_zones: [
        {
          name: "Greece & EU",
          geo_zones: allCountries.map((country_code) => ({
            country_code,
            type: "country" as const,
          })),
        },
      ],
    });
    serviceZoneId = fulfillmentSet.service_zones[0].id;
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });
  }

  const existingShippingOptions = await fulfillmentModuleService.listShippingOptions({});
  const shippingOptionNames = new Set(existingShippingOptions.map((o) => o.name));
  const shippingOptionsToCreate = [
    {
      name: "Standard Shipping (5-7 days)",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: serviceZoneId,
      shipping_profile_id: shippingProfile.id,
      type: { label: "Standard", description: "5-7 business days", code: "standard" },
      prices: [
        { currency_code: "eur", amount: 500 },
        { region_id: greeceRegion.id, amount: 300 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: '"true"', operator: "eq" as const },
        { attribute: "is_return", value: "false", operator: "eq" as const },
      ],
    },
    {
      name: "Express Shipping (1-3 days)",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: serviceZoneId,
      shipping_profile_id: shippingProfile.id,
      type: { label: "Express", description: "1-3 business days", code: "express" },
      prices: [
        { currency_code: "eur", amount: 1200 },
        { region_id: greeceRegion.id, amount: 800 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: '"true"', operator: "eq" as const },
        { attribute: "is_return", value: "false", operator: "eq" as const },
      ],
    },
  ].filter((opt) => !shippingOptionNames.has(opt.name));

  if (shippingOptionsToCreate.length > 0) {
    await createShippingOptionsWorkflow(container).run({
      input: shippingOptionsToCreate,
    });
  }
  logger.info("Finished seeding shipping.");

  // Link both channels to stock location (idempotent — fails silently if already linked)
  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [b2cChannel.id, b2bChannel.id] },
    });
  } catch {
    logger.warn("Sales channel ↔ stock location link may already exist — skipping.");
  }

  // ── Publishable API keys ───────────────────────────────────────────────────
  logger.info("Creating publishable API keys...");
  const apiKeyModuleService: IApiKeyModuleService = container.resolve(
    ModuleRegistrationName.API_KEY
  );
  const allApiKeys = await apiKeyModuleService.listApiKeys({});
  const keysByTitle = new Map(allApiKeys.map((k) => [k.title, k]));

  const keysToCreate = [
    { title: "B2C Storefront", type: "publishable" as const, created_by: "" },
    { title: "B2B Wholesale",  type: "publishable" as const, created_by: "" },
  ].filter((k) => !keysByTitle.has(k.title));

  if (keysToCreate.length > 0) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: keysToCreate },
    });
    result.forEach((k) => keysByTitle.set(k.title, k));
  }

  const b2cKey = keysByTitle.get("B2C Storefront")!;
  const b2bKey = keysByTitle.get("B2B Wholesale")!;
  if (!b2cKey || !b2bKey) throw new Error("Failed to resolve publishable API keys");

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: b2cKey.id, add: [b2cChannel.id] },
    });
  } catch { logger.warn("B2C key <-> channel link may already exist."); }
  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: b2bKey.id, add: [b2bChannel.id] },
    });
  } catch { logger.warn("B2B key <-> channel link may already exist."); }

  logger.info(`B2C publishable key: ${b2cKey.token}`);
  logger.info(`B2B publishable key: ${b2bKey.token}`);

  // ── Collections ────────────────────────────────────────────────────────────
  logger.info("Creating collections...");
  const productModuleService: IProductModuleService = container.resolve(
    ModuleRegistrationName.PRODUCT
  );
  const existingCollections = await productModuleService.listProductCollections({});
  const collectionsByHandle = new Map(existingCollections.map((c) => [c.handle, c]));

  const collectionsToCreate = [
    { title: "New Arrivals",      handle: "new-arrivals" },
    { title: "Bestsellers",       handle: "bestsellers" },
    { title: "Luxury Collection", handle: "luxury-collection" },
    { title: "Wedding & Bridal",  handle: "wedding-bridal" },
    { title: "Summer Edit",       handle: "summer-edit" },
    { title: "Men's Silk",        handle: "mens-silk" },
  ].filter((c) => !collectionsByHandle.has(c.handle));

  if (collectionsToCreate.length > 0) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: { collections: collectionsToCreate },
    });
    result.forEach((c) => collectionsByHandle.set(c.handle!, c));
  }

  const newArrivals      = collectionsByHandle.get("new-arrivals")!;
  const bestsellers      = collectionsByHandle.get("bestsellers")!;
  const luxuryCollection = collectionsByHandle.get("luxury-collection")!;
  const weddingBridal    = collectionsByHandle.get("wedding-bridal")!;
  const summerEdit       = collectionsByHandle.get("summer-edit")!;
  const mensSilk         = collectionsByHandle.get("mens-silk")!;

  // ── Categories ─────────────────────────────────────────────────────────────
  logger.info("Creating product categories...");
  const existingCategories = await productModuleService.listProductCategories(
    {},
    { select: ["id", "handle", "parent_category_id"] }
  );
  const categoriesByHandle = new Map(existingCategories.map((c) => [c.handle, c]));

  const topLevelCategoryDefs = [
    { name: "Scarves & Shawls", handle: "scarves-shawls", is_active: true, rank: 0 },
    { name: "Clothing",         handle: "clothing",       is_active: true, rank: 1 },
    { name: "Home & Living",    handle: "home-living",    is_active: true, rank: 2 },
    { name: "Accessories",      handle: "accessories",    is_active: true, rank: 3 },
    { name: "Gifts & Sets",     handle: "gifts-sets",     is_active: true, rank: 4 },
  ];
  const missingTopLevel = topLevelCategoryDefs.filter(
    (c) => !categoriesByHandle.has(c.handle)
  );
  if (missingTopLevel.length > 0) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingTopLevel },
    });
    result.forEach((c) => categoriesByHandle.set(c.handle!, c));
  }

  const scarvesCategory     = categoriesByHandle.get("scarves-shawls")!;
  const clothingCategory    = categoriesByHandle.get("clothing")!;
  const homeCategory        = categoriesByHandle.get("home-living")!;
  const accessoriesCategory = categoriesByHandle.get("accessories")!;
  const giftsCategory       = categoriesByHandle.get("gifts-sets")!;

  // Sub-categories
  const subCategoryDefs = [
    // Scarves
    { name: "Square Scarves",       handle: "square-scarves",       is_active: true, parent_category_id: scarvesCategory.id,     rank: 0 },
    { name: "Long Scarves",         handle: "long-scarves",         is_active: true, parent_category_id: scarvesCategory.id,     rank: 1 },
    { name: "Shawls & Wraps",       handle: "shawls-wraps",         is_active: true, parent_category_id: scarvesCategory.id,     rank: 2 },
    // Clothing
    { name: "Dresses",              handle: "dresses",              is_active: true, parent_category_id: clothingCategory.id,    rank: 0 },
    { name: "Blouses & Tops",       handle: "blouses-tops",         is_active: true, parent_category_id: clothingCategory.id,    rank: 1 },
    { name: "Robes & Loungewear",   handle: "robes-loungewear",     is_active: true, parent_category_id: clothingCategory.id,    rank: 2 },
    // Home
    { name: "Pillowcases",          handle: "pillowcases",          is_active: true, parent_category_id: homeCategory.id,        rank: 0 },
    { name: "Throws & Blankets",    handle: "throws-blankets",      is_active: true, parent_category_id: homeCategory.id,        rank: 1 },
    { name: "Table Linens",         handle: "table-linens",         is_active: true, parent_category_id: homeCategory.id,        rank: 2 },
    // Accessories
    { name: "Ties & Pocket Squares", handle: "ties-pocket-squares", is_active: true, parent_category_id: accessoriesCategory.id, rank: 0 },
    { name: "Hair Accessories",     handle: "hair-accessories",     is_active: true, parent_category_id: accessoriesCategory.id, rank: 1 },
    { name: "Eye Masks",            handle: "eye-masks",            is_active: true, parent_category_id: accessoriesCategory.id, rank: 2 },
    // Gifts
    { name: "Bridal",               handle: "bridal",               is_active: true, parent_category_id: giftsCategory.id,       rank: 0 },
    { name: "Corporate Gifts",      handle: "corporate-gifts",      is_active: true, parent_category_id: giftsCategory.id,       rank: 1 },
  ];
  const missingSubCats = subCategoryDefs.filter((c) => !categoriesByHandle.has(c.handle));
  if (missingSubCats.length > 0) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingSubCats },
    });
    result.forEach((c) => categoriesByHandle.set(c.handle!, c));
  }

  const squareScarves    = categoriesByHandle.get("square-scarves")!;
  const longScarves      = categoriesByHandle.get("long-scarves")!;
  const shawlsWraps      = categoriesByHandle.get("shawls-wraps")!;
  const dresses          = categoriesByHandle.get("dresses")!;
  const blousesTops      = categoriesByHandle.get("blouses-tops")!;
  const robesLoungewear  = categoriesByHandle.get("robes-loungewear")!;
  const pillowcases      = categoriesByHandle.get("pillowcases")!;
  const throwsBlankets   = categoriesByHandle.get("throws-blankets")!;
  const tableLinens      = categoriesByHandle.get("table-linens")!;
  const tiesPocketSquares = categoriesByHandle.get("ties-pocket-squares")!;
  const hairAccessories  = categoriesByHandle.get("hair-accessories")!;
  const eyeMasks         = categoriesByHandle.get("eye-masks")!;
  const bridal           = categoriesByHandle.get("bridal")!;
  const corporateGifts   = categoriesByHandle.get("corporate-gifts")!;

  // ── Products ───────────────────────────────────────────────────────────────
  logger.info("Creating products...");

  const channelIds = [{ id: b2cChannel.id }, { id: b2bChannel.id }];

  const existingProductList = await productModuleService.listProducts({}, { select: ["handle"] });
  const existingHandles = new Set(existingProductList.map((p) => p.handle));

  const allSilkProducts = [
        // ── Scarves & Shawls ─────────────────────────────────────────────
        {
          title: 'Silk Scarf "Aegean Blue"',
          handle: "silk-scarf-aegean-blue",
          subtitle: "Pure mulberry silk · Square",
          description: "Hand-finished pure mulberry silk scarf in the deep blues of the Aegean Sea. Naturally temperature-regulating and irresistibly soft. Hand-rolled edges, 16mm weight.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [scarvesCategory.id, squareScarves.id],
          collection_id: bestsellers.id,
          weight: 120,
          material: "100% Mulberry Silk",
          options: [{ title: "Size", values: ["70×70 cm", "90×90 cm", "140×140 cm"] }],
          variants: [
          ],
        },
        {
          title: 'Silk Scarf "Olive Grove"',
          handle: "silk-scarf-olive-grove",
          subtitle: "Pure mulberry silk · Square",
          description: "Inspired by the ancient olive groves of Attica — soft greens, silvery whites and warm earth tones printed on the finest charmeuse silk.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [scarvesCategory.id, squareScarves.id],
          collection_id: summerEdit.id,
          weight: 100,
          material: "100% Mulberry Silk Charmeuse",
          options: [{ title: "Size", values: ["70×70 cm", "90×90 cm"] }],
          variants: [
          ],
        },
        {
          title: 'Silk Shawl "Santorini Sunset"',
          handle: "silk-shawl-santorini-sunset",
          subtitle: "16mm charmeuse silk · Large shawl",
          description: "Generous silk shawl in warm terracotta, coral and gold — the colours of a Santorini sunset. 100% 16mm charmeuse silk with hand-rolled edges.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [scarvesCategory.id, shawlsWraps.id],
          collection_id: newArrivals.id,
          weight: 200,
          material: "100% Mulberry Silk 16mm",
          options: [{ title: "Size", values: ["90×180 cm", "110×200 cm"] }],
          variants: [
          ],
        },
        {
          title: 'Long Silk Scarf "Poseidon"',
          handle: "silk-long-scarf-poseidon",
          subtitle: "Pure silk · Long format",
          description: "A flowing long silk scarf in deep ocean navy and white wave motifs. Versatile — wear as a scarf, belt or bag accessory.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [scarvesCategory.id, longScarves.id],
          collection_id: bestsellers.id,
          weight: 80,
          material: "100% Mulberry Silk",
          options: [{ title: "Size", values: ["25×170 cm", "35×180 cm"] }],
          variants: [
          ],
        },

        // ── Clothing ─────────────────────────────────────────────────────
        {
          title: 'Silk Blouse "Olympia"',
          handle: "silk-blouse-olympia",
          subtitle: "Pure silk · Relaxed fit",
          description: "Flowing pure silk blouse with a relaxed silhouette. Features delicate pin-tuck detail at the placket. Dry clean or hand wash.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [clothingCategory.id, blousesTops.id],
          collection_id: newArrivals.id,
          weight: 180,
          material: "100% Mulberry Silk",
          options: [
            { title: "Size", values: ["XS", "S", "M", "L", "XL"] },
            { title: "Colour", values: ["Ivory", "Navy"] },
          ],
          variants: [
            ...["XS", "S", "M", "L", "XL"].flatMap((size) =>
              ["Ivory", "Navy"].map((colour) => ({
                title: `${size} / ${colour}`,
                sku: `BLOUSE-OLYMPIA-${size}-${colour.toUpperCase()}`,
                options: { Size: size, Colour: colour },
                manage_inventory: true,
                prices: [
                  { currency_code: "eur", amount: 18900 },
                  { currency_code: "usd", amount: 20900 },
                  { currency_code: "gbp", amount: 16500 },
                ],
              }))
            ),
          ],
        },
        {
          title: 'Silk Dress "Santorini"',
          handle: "silk-dress-santorini",
          subtitle: "Silk satin · Midi slip dress",
          description: "Midi slip dress in liquid silk satin. Adjustable spaghetti straps, bias cut. Drapes beautifully for both daytime and evening wear.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [clothingCategory.id, dresses.id],
          collection_id: luxuryCollection.id,
          weight: 280,
          material: "100% Silk Satin",
          options: [
            { title: "Size", values: ["XS", "S", "M", "L", "XL"] },
            { title: "Colour", values: ["Champagne", "Midnight Blue"] },
          ],
          variants: [
            ...["XS", "S", "M", "L", "XL"].flatMap((size) =>
              ["Champagne", "Midnight Blue"].map((colour) => ({
                title: `${size} / ${colour}`,
                sku: `DRESS-SANTORINI-${size}-${colour.replace(" ", "-").toUpperCase()}`,
                options: { Size: size, Colour: colour },
                manage_inventory: true,
                prices: [
                  { currency_code: "eur", amount: 28900 },
                  { currency_code: "usd", amount: 31900 },
                  { currency_code: "gbp", amount: 24900 },
                ],
              }))
            ),
          ],
        },
        {
          title: 'Mulberry Silk Robe "Aphrodite"',
          handle: "silk-robe-aphrodite",
          subtitle: "22mm mulberry silk · Long robe",
          description: "Luxurious long robe in 22mm mulberry silk. Deep cuffs, wide shawl collar, inner tie. The ultimate loungewear upgrade. Available in classic ivory.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [clothingCategory.id, robesLoungewear.id],
          collection_id: luxuryCollection.id,
          weight: 420,
          material: "100% Mulberry Silk 22mm",
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: ["S", "M", "L", "XL"].map((size) => ({
            title: size,
            sku: `ROBE-APHRODITE-${size}`,
            options: { Size: size },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 34900 },
              { currency_code: "usd", amount: 38900 },
              { currency_code: "gbp", amount: 29900 },
            ],
          })),
        },
        {
          title: 'Silk Kimono "Thessaloniki"',
          handle: "silk-kimono-thessaloniki",
          subtitle: "Printed silk · Relaxed kimono",
          description: "Short kimono in light-weight printed silk. Byzantine mosaic pattern in warm gold and terracotta. One-size relaxed fit for all.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [clothingCategory.id, robesLoungewear.id],
          collection_id: summerEdit.id,
          weight: 160,
          material: "100% Mulberry Silk",
          options: [{ title: "Colour", values: ["Gold & Terracotta", "Blue & White"] }],
          variants: ["Gold & Terracotta", "Blue & White"].map((colour) => ({
            title: colour,
            sku: `KIMONO-THES-${colour.replace(/[& ]/g, "-").toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 14900 },
              { currency_code: "usd", amount: 16500 },
              { currency_code: "gbp", amount: 12900 },
            ],
          })),
        },
        {
          title: 'Silk Pajama Set "Nyx"',
          handle: "silk-pajama-set-nyx",
          subtitle: "Charmeuse silk · Classic pajamas",
          description: "Classic two-piece pajama set in pure charmeuse silk. Piped trim detail on collar, cuffs and pockets. Breathable all year round.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [clothingCategory.id, robesLoungewear.id],
          collection_id: bestsellers.id,
          weight: 350,
          material: "100% Charmeuse Silk",
          options: [
            { title: "Size", values: ["XS", "S", "M", "L", "XL"] },
            { title: "Colour", values: ["Ivory", "Rose Gold", "Black"] },
          ],
          variants: [
            ...["XS", "S", "M", "L", "XL"].flatMap((size) =>
              ["Ivory", "Rose Gold", "Black"].map((colour) => ({
                title: `${size} / ${colour}`,
                sku: `PJ-NYX-${size}-${colour.replace(" ", "-").toUpperCase()}`,
                options: { Size: size, Colour: colour },
                manage_inventory: true,
                prices: [
                  { currency_code: "eur", amount: 24900 },
                  { currency_code: "usd", amount: 27900 },
                  { currency_code: "gbp", amount: 21500 },
                ],
              }))
            ),
          ],
        },

        // ── Home & Living ────────────────────────────────────────────────
        {
          title: "Silk Pillowcase Set",
          handle: "silk-pillowcase-set",
          subtitle: "22mm mulberry silk · Set of 2",
          description: "Set of 2 silk pillowcases in 22mm mulberry silk. Reduces hair breakage, maintains skin moisture. Oxford style with envelope closure.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [homeCategory.id, pillowcases.id],
          collection_id: bestsellers.id,
          weight: 200,
          material: "100% Mulberry Silk 22mm",
          options: [
            { title: "Size", values: ["Standard (50×75 cm)", "King (50×90 cm)"] },
            { title: "Colour", values: ["Ivory", "Champagne", "Silver Grey"] },
          ],
          variants: [
            ...["Standard (50×75 cm)", "King (50×90 cm)"].flatMap((size) =>
              ["Ivory", "Champagne", "Silver Grey"].map((colour) => ({
                title: `${size} / ${colour}`,
                sku: `PILLOW-${size.split(" ")[0].toUpperCase()}-${colour.replace(" ", "-").toUpperCase()}`,
                options: { Size: size, Colour: colour },
                manage_inventory: true,
                prices: [
                  { currency_code: "eur", amount: 5900 },
                  { currency_code: "usd", amount: 6500 },
                  { currency_code: "gbp", amount: 5200 },
                ],
              }))
            ),
          ],
        },
        {
          title: 'Silk Throw "Mykonos"',
          handle: "silk-throw-mykonos",
          subtitle: "Silk-blend · Lightweight throw",
          description: "Lightweight silk-blend throw in Cycladic white with woven border detail. Perfect for warm Mediterranean evenings. Machine washable at 30°.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [homeCategory.id, throwsBlankets.id],
          collection_id: newArrivals.id,
          weight: 400,
          material: "70% Silk, 30% Cotton",
          options: [{ title: "Colour", values: ["Cycladic White", "Sand", "Aegean Blue"] }],
          variants: ["Cycladic White", "Sand", "Aegean Blue"].map((colour) => ({
            title: colour,
            sku: `THROW-MYKONOS-${colour.replace(" ", "-").toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 15900 },
              { currency_code: "usd", amount: 17900 },
              { currency_code: "gbp", amount: 13900 },
            ],
          })),
        },
        {
          title: 'Table Runner "Cyclades"',
          handle: "silk-table-runner-cyclades",
          subtitle: "Dupioni silk · Artisan edges",
          description: "Elegant table runner in heavyweight dupioni silk with raw edge finish. Adds quiet luxury to any table setting. Dry clean recommended.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [homeCategory.id, tableLinens.id],
          collection_id: luxuryCollection.id,
          weight: 150,
          material: "100% Dupioni Silk",
          options: [{ title: "Size", values: ["35×180 cm", "35×250 cm"] }],
          variants: [
          ],
        },

        // ── Accessories ──────────────────────────────────────────────────
        {
          title: 'Silk Tie "Parthenon"',
          handle: "silk-tie-parthenon",
          subtitle: "7-fold · Hand-rolled",
          description: "7-fold hand-rolled silk tie woven with a subtle Greek key (meander) pattern. Each tie is a wearable work of art. Presented in a silk-lined gift box.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [accessoriesCategory.id, tiesPocketSquares.id],
          collection_id: mensSilk.id,
          weight: 90,
          material: "100% Mulberry Silk",
          options: [{ title: "Colour", values: ["Deep Navy", "Burgundy", "Forest Green", "Charcoal"] }],
          variants: ["Deep Navy", "Burgundy", "Forest Green", "Charcoal"].map((colour) => ({
            title: colour,
            sku: `TIE-PARTHENON-${colour.replace(" ", "-").toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 8900 },
              { currency_code: "usd", amount: 9900 },
              { currency_code: "gbp", amount: 7800 },
            ],
          })),
        },
        {
          title: 'Silk Pocket Square "Acropolis"',
          handle: "silk-pocket-square-acropolis",
          subtitle: "Hand-rolled · Hand-painted motif",
          description: "Hand-rolled pure silk pocket square with hand-painted Parthenon frieze motif. One size. Arrives in a branded card envelope.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [accessoriesCategory.id, tiesPocketSquares.id],
          collection_id: mensSilk.id,
          weight: 30,
          material: "100% Mulberry Silk",
          options: [{ title: "Colour", values: ["White", "Ivory", "Sky Blue"] }],
          variants: ["White", "Ivory", "Sky Blue"].map((colour) => ({
            title: colour,
            sku: `POCKET-ACROPOLIS-${colour.replace(" ", "-").toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 3900 },
              { currency_code: "usd", amount: 4500 },
              { currency_code: "gbp", amount: 3400 },
            ],
          })),
        },
        {
          title: 'Silk Eye Mask "Morpheus"',
          handle: "silk-eye-mask-morpheus",
          subtitle: "19mm mulberry silk · Sleep mask",
          description: "Ultra-soft 19mm mulberry silk sleep mask with adjustable elastic strap. Blocks light without creasing delicate skin around the eyes.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [accessoriesCategory.id, eyeMasks.id],
          collection_id: bestsellers.id,
          weight: 40,
          material: "100% Mulberry Silk 19mm",
          options: [{ title: "Colour", values: ["Ivory", "Black", "Rose"] }],
          variants: ["Ivory", "Black", "Rose"].map((colour) => ({
            title: colour,
            sku: `MASK-MORPHEUS-${colour.toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 2900 },
              { currency_code: "usd", amount: 3200 },
              { currency_code: "gbp", amount: 2500 },
            ],
          })),
        },
        {
          title: "Silk Hair Scrunchie Set",
          handle: "silk-hair-scrunchie-set",
          subtitle: "Pure silk · No crimping",
          description: "Silk hair scrunchies — kind to hair, no crimping, no breakage. A small luxury with real benefits. Each scrunchie has a double-stitched elastic core.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [accessoriesCategory.id, hairAccessories.id],
          collection_id: newArrivals.id,
          weight: 50,
          material: "100% Mulberry Silk",
          options: [
            { title: "Pack", values: ["Pack of 3", "Pack of 6"] },
            { title: "Colour", values: ["Neutrals", "Pastels", "Jewels"] },
          ],
          variants: [
            ...["Pack of 3", "Pack of 6"].flatMap((pack) =>
              ["Neutrals", "Pastels", "Jewels"].map((colour) => ({
                title: `${pack} / ${colour}`,
                sku: `SCRUNCHIE-${pack.replace(" ", "-").toUpperCase()}-${colour.toUpperCase()}`,
                options: { Pack: pack, Colour: colour },
                manage_inventory: true,
                prices: [
                  { currency_code: "eur", amount: pack === "Pack of 3" ? 1900 : 3400 },
                  { currency_code: "usd", amount: pack === "Pack of 3" ? 2100 : 3800 },
                  { currency_code: "gbp", amount: pack === "Pack of 3" ? 1700 : 2900 },
                ],
              }))
            ),
          ],
        },
        {
          title: "Silk Headband",
          handle: "silk-headband",
          subtitle: "Pure silk · Padded band",
          description: "Wide padded silk headband with a discreet velvet-grip lining to keep it in place. Gentle on hair with zero snagging.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [accessoriesCategory.id, hairAccessories.id],
          collection_id: summerEdit.id,
          weight: 35,
          material: "100% Mulberry Silk outer, Velvet lining",
          options: [{ title: "Colour", values: ["Ivory", "Black", "Dusty Rose", "Sage"] }],
          variants: ["Ivory", "Black", "Dusty Rose", "Sage"].map((colour) => ({
            title: colour,
            sku: `HEADBAND-${colour.replace(" ", "-").toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 2200 },
              { currency_code: "usd", amount: 2500 },
              { currency_code: "gbp", amount: 1900 },
            ],
          })),
        },

        // ── Gifts & Sets ─────────────────────────────────────────────────
        {
          title: 'Bridal Silk Set "Hera"',
          handle: "silk-bridal-set-hera",
          subtitle: "Complete bridal trousseau · Gift box",
          description: "The complete bridal trousseau: robe, pajama set, eye mask and two pillowcases, presented in a keepsake gift box with satin ribbon and personalised card.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [giftsCategory.id, bridal.id],
          collection_id: weddingBridal.id,
          weight: 1200,
          material: "100% Mulberry Silk",
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: ["S", "M", "L", "XL"].map((size) => ({
            title: size,
            sku: `BRIDAL-HERA-${size}`,
            options: { Size: size },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 89900 },
              { currency_code: "usd", amount: 98900 },
              { currency_code: "gbp", amount: 77900 },
            ],
          })),
        },
        {
          title: 'Gift Set "Athena"',
          handle: "silk-gift-set-athena",
          subtitle: "Curated trio · Luxury gift box",
          description: "A curated silk gift trio: one Aegean Blue scarf, one pillowcase and one Morpheus eye mask, presented in a luxe branded gift box.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [giftsCategory.id],
          collection_id: bestsellers.id,
          weight: 400,
          material: "100% Mulberry Silk",
          options: [{ title: "Size", values: ["One Size"] }],
          variants: [
          ],
        },
        {
          title: 'Corporate Gift Box "Pericles"',
          handle: "silk-corporate-gift-pericles",
          subtitle: "Corporate gifting · Premium packaging",
          description: "A refined corporate gift featuring a silk tie or scarf, a pocket square and a branded gift note. Available with custom monogramming. Minimum order 10 units.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [giftsCategory.id, corporateGifts.id],
          collection_id: mensSilk.id,
          weight: 350,
          material: "100% Mulberry Silk",
          options: [
            { title: "Type", values: ["Tie & Pocket Square", "Scarf & Eye Mask"] },
          ],
          variants: [
          ],
        },
        {
          title: 'Wedding Favour Scarf "Eros"',
          handle: "silk-wedding-favour-eros",
          subtitle: "Mini silk scarf · Wedding favour",
          description: "Miniature hand-rolled silk scarf in ivory and gold. The perfect wedding favour — each one arrives tied with a personalised ribbon tag.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          category_ids: [giftsCategory.id, bridal.id],
          collection_id: weddingBridal.id,
          weight: 40,
          material: "100% Mulberry Silk",
          options: [{ title: "Pack", values: ["Pack of 10", "Pack of 25", "Pack of 50"] }],
          variants: [
          ],
        },
  ];

  const productsToCreate = allSilkProducts.filter(
    (p) => !existingHandles.has(p.handle as string)
  );
  if (productsToCreate.length > 0) {
    logger.info(`Creating ${productsToCreate.length} new product(s)...`);
    await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    });
  } else {
    logger.info("All products already exist — skipping.");
  }

  // ── Link all products to Default shipping profile ────────────────────────
  logger.info("Linking all products to Default shipping profile...");
  const allProducts = await productModuleService.listProducts({}, { take: 500 });
  for (const product of allProducts) {
    try {
      await link.create({
        [Modules.PRODUCT]: { product_id: product.id },
        [Modules.FULFILLMENT]: { shipping_profile_id: shippingProfile.id },
      });
    } catch {
      // Link already exists — skip
    }
  }
  logger.info(`Linked ${allProducts.length} product(s) to shipping profile.`);

  logger.info("Finished seeding products.");

  // ── Customer Groups ────────────────────────────────────────────────────────
  logger.info("Creating customer groups...");
  const customerModuleService: ICustomerModuleService = container.resolve(
    ModuleRegistrationName.CUSTOMER
  );
  const existingGroups = await customerModuleService.listCustomerGroups({});
  const groupsByName = new Map(existingGroups.map((g) => [g.name, g]));

  const groupsToCreate = [
    { name: "B2B Wholesale" },
    { name: "VIP Retail" },
    { name: "Bridal Trade" },
  ].filter((g) => !groupsByName.has(g.name));

  if (groupsToCreate.length > 0) {
    const { result } = await createCustomerGroupsWorkflow(container).run({
      input: { customersData: groupsToCreate },
    });
    result.forEach((g) => groupsByName.set(g.name, g));
  }

  const b2bGroup    = groupsByName.get("B2B Wholesale")!;
  const vipGroup    = groupsByName.get("VIP Retail")!;
  const bridalGroup = groupsByName.get("Bridal Trade")!;

  // ── Demo B2B Customers ─────────────────────────────────────────────────────
  logger.info("Creating demo B2B customers...");
  const existingCustomers = await customerModuleService.listCustomers({});
  const customersByEmail = new Map(existingCustomers.map((c) => [c.email, c]));

  const customerDefs = [
    {
      email: "buyer@athens-luxury-hotels.gr",
      first_name: "Nikos",
      last_name: "Papadopoulos",
      phone: "+30 210 123 4567",
      company_name: "Athens Luxury Hotels Group",
    },
    {
      email: "owner@mediterranean-bridal.gr",
      first_name: "Maria",
      last_name: "Stavros",
      phone: "+30 210 987 6543",
      company_name: "Mediterranean Bridal Studio",
    },
    {
      email: "procurement@hellas-corporate.com",
      first_name: "Alexandros",
      last_name: "Georgiou",
      phone: "+30 211 234 5678",
      company_name: "Hellas Corporate Gifts",
    },
    {
      email: "demo@b2c-customer.com",
      first_name: "Elena",
      last_name: "Christodoulou",
      phone: "+30 697 123 4567",
    },
  ];
  const customersToCreate = customerDefs.filter((c) => !customersByEmail.has(c.email));
  if (customersToCreate.length > 0) {
    const { result } = await createCustomersWorkflow(container).run({
      input: { customersData: customersToCreate },
    });
    result.forEach((c) => customersByEmail.set(c.email!, c));
  }

  const hotelBuyer     = customersByEmail.get("buyer@athens-luxury-hotels.gr")!;
  const bridalBuyer    = customersByEmail.get("owner@mediterranean-bridal.gr")!;
  const corporateBuyer = customersByEmail.get("procurement@hellas-corporate.com")!;
  const retailCustomer = customersByEmail.get("demo@b2c-customer.com")!;

  // ── B2B Companies ──────────────────────────────────────────────────────────
  logger.info("Creating B2B companies...");
  const companyModuleService = container.resolve(COMPANY_MODULE);
  const existingCompanies = await companyModuleService.listCompanies({});
  const companiesByName = new Map(
    (existingCompanies as Array<{ name: string; id: string }>).map((c) => [c.name, c])
  );

  const companyDefs = [
    {
      name: "Athens Luxury Hotels Group",
      email: "procurement@athens-luxury-hotels.gr",
      phone: "+30 210 123 4567",
      address: "Leoforos Vassilissis Sofias 15",
      city: "Athens",
      state: "Attica",
      zip: "10674",
      country: "GR",
      currency_code: "eur",
      spending_limit_reset_frequency: ModuleCompanySpendingLimitResetFrequency.MONTHLY,
      logo_url: null,
    },
    {
      name: "Mediterranean Bridal Studio",
      email: "info@mediterranean-bridal.gr",
      phone: "+30 210 987 6543",
      address: "Tsimiski 42",
      city: "Thessaloniki",
      state: "Central Macedonia",
      zip: "54623",
      country: "GR",
      currency_code: "eur",
      spending_limit_reset_frequency: ModuleCompanySpendingLimitResetFrequency.MONTHLY,
      logo_url: null,
    },
    {
      name: "Hellas Corporate Gifts",
      email: "orders@hellas-corporate.com",
      phone: "+30 211 234 5678",
      address: "Ermou 25",
      city: "Athens",
      state: "Attica",
      zip: "10563",
      country: "GR",
      currency_code: "eur",
      spending_limit_reset_frequency: ModuleCompanySpendingLimitResetFrequency.YEARLY,
      logo_url: null,
    },
  ];

  const companiesToCreate = companyDefs.filter((c) => !companiesByName.has(c.name));
  if (companiesToCreate.length > 0) {
    const { result } = await createCompaniesWorkflow(container).run({
      input: companiesToCreate,
    });
    (result as Array<{ name: string; id: string }>).forEach((c) =>
      companiesByName.set(c.name, c)
    );
  }

  logger.info(`Seeded ${companyDefs.length} B2B companies.`);

  // ── Company Employees ──────────────────────────────────────────────────────
  logger.info("Creating company employees...");
  const hotelCompany     = companiesByName.get("Athens Luxury Hotels Group")!;
  const bridalCompany    = companiesByName.get("Mediterranean Bridal Studio")!;
  const corporateCompany = companiesByName.get("Hellas Corporate Gifts")!;

  const existingEmployees = await companyModuleService.listEmployees({
    company_id: [hotelCompany.id, bridalCompany.id, corporateCompany.id],
  });
  const companyIdsWithEmployees = new Set(
    (existingEmployees as Array<{ company_id: string }>).map((e) => e.company_id)
  );

  const employeeDefs = [
    { company_id: hotelCompany.id,     customer_id: hotelBuyer.id,     spending_limit: 500000,  is_admin: true },
    { company_id: bridalCompany.id,    customer_id: bridalBuyer.id,    spending_limit: 300000,  is_admin: true },
    { company_id: corporateCompany.id, customer_id: corporateBuyer.id, spending_limit: 1000000, is_admin: true },
  ];
  const employeesToCreate = employeeDefs.filter(
    (e) => !companyIdsWithEmployees.has(e.company_id)
  );
  if (employeesToCreate.length > 0) {
    await companyModuleService.createEmployees(employeesToCreate);
  }

  logger.info("Finished seeding B2B companies, employees and customer groups.");

  // ── Inventory levels ──────────────────────────────────────────────────────
  logger.info("Seeding inventory levels...");
  const inventoryService: IInventoryService = container.resolve(ModuleRegistrationName.INVENTORY);
  const allInventoryItems = await inventoryService.listInventoryItems({});
  const existingLevels = await inventoryService.listInventoryLevels({ location_id: [stockLocation.id] });
  const itemsWithLevel = new Set(existingLevels.map((l) => l.inventory_item_id));

  const levelsToCreate = allInventoryItems
    .filter((item) => !itemsWithLevel.has(item.id))
    .map((item) => {
      const sku = (item.sku ?? "").toLowerCase();
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

      return { inventory_item_id: item.id, location_id: stockLocation.id, stocked_quantity: qty };
    });

  if (levelsToCreate.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: levelsToCreate },
    });
    logger.info(`Created ${levelsToCreate.length} inventory levels.`);
  } else {
    logger.info("Inventory levels already exist — skipping.");
  }

  // Enrich inventory item metadata (HS codes, weight, origin)
  const itemsMissingMeta = allInventoryItems.filter((item) => !item.hs_code);
  if (itemsMissingMeta.length > 0) {
    const updates = itemsMissingMeta.map((item) => {
      const sku = item.sku ?? "";
      const lowerSku = sku.toLowerCase();
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
    await updateInventoryItemsWorkflow(container).run({ input: { updates } });
    logger.info(`Enriched ${updates.length} inventory items.`);
  }

  // ── Product types & tags ──────────────────────────────────────────────────
  logger.info("Seeding product types and tags...");
  const existingTypes = await productModuleService.listProductTypes({});
  const typesByValue = new Map(existingTypes.map((t) => [t.value, t]));
  const typeDefs = [
    { value: "Scarves & Shawls" }, { value: "Clothing" }, { value: "Home & Living" },
    { value: "Accessories" }, { value: "Gift Sets" },
  ];
  const typesToCreate = typeDefs.filter((t) => !typesByValue.has(t.value));
  if (typesToCreate.length > 0) {
    const { result } = await createProductTypesWorkflow(container).run({ input: { product_types: typesToCreate } });
    result.forEach((t) => typesByValue.set(t.value, t));
  }

  const existingTags = await productModuleService.listProductTags({});
  const tagsByValue = new Map(existingTags.map((t) => [t.value, t]));
  const tagDefs = [
    "mulberry-silk", "charmeuse", "22mm", "19mm", "16mm", "hand-rolled",
    "made-in-greece", "sustainable", "luxury", "bridal", "corporate-gifting",
    "bestseller", "new-arrival", "summer", "wedding", "mens", "gift-idea",
    "pillowcase", "loungewear", "accessories",
  ];
  const tagsToCreate = tagDefs.filter((v) => !tagsByValue.has(v)).map((v) => ({ value: v }));
  if (tagsToCreate.length > 0) {
    const { result } = await createProductTagsWorkflow(container).run({ input: { product_tags: tagsToCreate } });
    result.forEach((t) => tagsByValue.set(t.value, t));
  }

  const typeMap: Record<string, string> = {
    "silk-scarf": "Scarves & Shawls", "silk-shawl": "Scarves & Shawls",
    "silk-long-scarf": "Scarves & Shawls", "silk-blouse": "Clothing",
    "silk-dress": "Clothing", "silk-robe": "Clothing", "silk-kimono": "Clothing",
    "silk-pajama": "Clothing", "silk-pillowcase": "Home & Living",
    "silk-throw": "Home & Living", "silk-table-runner": "Home & Living",
    "silk-tie": "Accessories", "silk-pocket-square": "Accessories",
    "silk-eye-mask": "Accessories", "silk-hair-scrunchie": "Accessories",
    "silk-headband": "Accessories", "silk-bridal-set": "Gift Sets",
    "silk-gift-set": "Gift Sets", "silk-corporate-gift": "Gift Sets",
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
    "silk-pillowcase-set":             ["22mm", "bestseller", "made-in-greece"],
    "silk-throw-mykonos":              ["summer", "new-arrival"],
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

  const allProductsForTypes = await productModuleService.listProducts({}, { select: ["id", "handle", "type_id"] });
  for (const product of allProductsForTypes) {
    if (!product.handle) continue;
    const prefix = Object.keys(typeMap).find((k) => product.handle!.startsWith(k));
    if (!prefix) continue;
    const targetTypeId = typesByValue.get(typeMap[prefix])?.id;
    if (!targetTypeId) continue;
    const tagValues = tagMap[product.handle] ?? [];
    const tagIds = tagValues.map((v) => tagsByValue.get(v)?.id).filter(Boolean) as string[];
    if (product.type_id === targetTypeId && tagIds.length === 0) continue;
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: {
          type_id: targetTypeId,
          ...(tagIds.length > 0 ? { tags: tagIds.map((id) => ({ id })) } : {}),
        },
      },
    });
  }
  logger.info("Product types and tags assigned.");

  // ── Price lists ───────────────────────────────────────────────────────────
  logger.info("Seeding price lists...");
  const pricingService: IPricingModuleService = container.resolve(ModuleRegistrationName.PRICING);
  const remoteQuery = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: variantRows } = await (remoteQuery as any).graph({
    entity: "variant",
    fields: ["id", "sku", "product.handle", "price_set.id", "price_set.prices.currency_code", "price_set.prices.amount"],
  }) as { data: Array<{ id: string; sku: string | null; product?: { handle?: string }; price_set?: { id: string; prices?: Array<{ currency_code: string; amount: number }> } | null }> };

  const silkOnly = variantRows.filter((v) => v.sku && v.price_set?.id);
  const variantBasePrices = new Map<string, number>();
  for (const v of silkOnly) {
    const eurPrice = v.price_set?.prices?.find((p) => p.currency_code === "eur");
    if (eurPrice) variantBasePrices.set(v.id, eurPrice.amount);
  }

  const existingPriceLists = await pricingService.listPriceLists({});
  const priceListsByTitle = new Map(existingPriceLists.map((pl) => [pl.title, pl]));

  const allCustomerGroups = await (container.resolve(ModuleRegistrationName.CUSTOMER) as any).listCustomerGroups({});
  const b2bGroupId    = allCustomerGroups.find((g: any) => g.name === "B2B Wholesale")?.id;
  const vipGroupId    = allCustomerGroups.find((g: any) => g.name === "VIP Retail")?.id;
  const bridalGroupId = allCustomerGroups.find((g: any) => g.name === "Bridal Trade")?.id;

  const priceListDefs = [
    { title: "B2B Wholesale – 20% Off", description: "20% off for verified B2B wholesale partners.", type: PriceListType.SALE, status: PriceListStatus.ACTIVE, discountPct: 0.20, customerGroupIds: b2bGroupId ? [b2bGroupId] : [] },
    { title: "VIP Retail – 10% Off",    description: "10% loyalty discount for VIP retail members.",  type: PriceListType.SALE, status: PriceListStatus.ACTIVE, discountPct: 0.10, customerGroupIds: vipGroupId ? [vipGroupId] : [] },
    { title: "Bridal Trade – 15% Off",  description: "15% off for bridal trade buyers.",               type: PriceListType.SALE, status: PriceListStatus.ACTIVE, discountPct: 0.15, customerGroupIds: bridalGroupId ? [bridalGroupId] : [] },
  ];

  for (const def of priceListDefs) {
    if (priceListsByTitle.has(def.title)) continue;
    const prices: Array<{ variant_id: string; currency_code: string; amount: number; min_quantity?: number }> = [];
    for (const variant of silkOnly) {
      const baseEur = variantBasePrices.get(variant.id);
      if (!baseEur) continue;
      prices.push({ variant_id: variant.id, currency_code: "eur", amount: Math.round(baseEur * (1 - def.discountPct)) });
      prices.push({ variant_id: variant.id, currency_code: "usd", amount: Math.round(baseEur * (1 - def.discountPct) * 1.1) });
      if (def.title.includes("B2B")) prices[prices.length - 2].min_quantity = 5;
    }
    if (prices.length === 0) continue;
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [{
          title: def.title,
          name: def.title,
          description: def.description,
          type: def.type as any,
          status: def.status as any,
          ...(def.customerGroupIds.length > 0 ? { rules: { customer_group_id: def.customerGroupIds } } : {}),
          prices,
        } as any],
      },
    });
    logger.info(`Created price list "${def.title}".`);
  }

  // ── Promotions ────────────────────────────────────────────────────────────
  logger.info("Seeding promotions...");
  const promotionService: IPromotionModuleService = container.resolve(ModuleRegistrationName.PROMOTION);

  const existingCampaigns = await promotionService.listCampaigns({});
  const campaignsByIdentifier = new Map(existingCampaigns.map((c) => [c.campaign_identifier, c]));
  const campaignDefs = [
    { name: "Welcome Program",    campaign_identifier: "WELCOME-ALWAYS", description: "Ongoing welcome discount",         budget: { type: "usage" as const, limit: 1000 } },
    { name: "B2B Bulk Programme", campaign_identifier: "B2B-BULK",       description: "Bulk order incentive for B2B",     budget: { type: "usage" as const, limit: 5000 } },
    { name: "Summer 2026",        campaign_identifier: "SUMMER-2026",    description: "Summer 2026 promotional campaign", budget: { type: "usage" as const, limit: 500 }, starts_at: new Date("2026-06-01"), ends_at: new Date("2026-09-30") },
  ];
  const campaignsToCreate = campaignDefs.filter((c) => !campaignsByIdentifier.has(c.campaign_identifier));
  if (campaignsToCreate.length > 0) {
    const { result: createdCampaigns } = await createCampaignsWorkflow(container).run({ input: { campaignsData: campaignsToCreate as any } });
    createdCampaigns.forEach((c) => campaignsByIdentifier.set(c.campaign_identifier!, c));
  }

  const existingPromotions = await promotionService.listPromotions({});
  const promotionsByCode = new Map(existingPromotions.map((p) => [p.code, p]));
  const promotionDefs = [
    { code: "WELCOME5",   campaign_identifier: "WELCOME-ALWAYS", type: PromotionType.STANDARD, status: PromotionStatus.ACTIVE, application_method: { type: ApplicationMethodType.PERCENTAGE, target_type: ApplicationMethodTargetType.ITEMS, allocation: ApplicationMethodAllocation.ACROSS, value: 5, currency_code: "eur" } },
    { code: "BULK25",     campaign_identifier: "B2B-BULK",       type: PromotionType.STANDARD, status: PromotionStatus.ACTIVE, application_method: { type: ApplicationMethodType.PERCENTAGE, target_type: ApplicationMethodTargetType.ITEMS, allocation: ApplicationMethodAllocation.EACH,   value: 25, currency_code: "eur", max_quantity: 100 } },
    { code: "SUMMER10",   campaign_identifier: "SUMMER-2026",    type: PromotionType.STANDARD, status: PromotionStatus.ACTIVE, application_method: { type: ApplicationMethodType.PERCENTAGE, target_type: ApplicationMethodTargetType.ITEMS, allocation: ApplicationMethodAllocation.ACROSS, value: 10, currency_code: "eur" } },
    { code: "FREESHIP",   campaign_identifier: "SUMMER-2026",    type: PromotionType.STANDARD, status: PromotionStatus.ACTIVE, application_method: { type: ApplicationMethodType.FIXED, target_type: ApplicationMethodTargetType.SHIPPING_METHODS, allocation: ApplicationMethodAllocation.EACH, value: 500, currency_code: "eur", max_quantity: 1 } },
  ];
  const promotionsToCreate = promotionDefs.filter((p) => !promotionsByCode.has(p.code));
  if (promotionsToCreate.length > 0) {
    const { result: createdPromotions } = await createPromotionsWorkflow(container).run({
      input: { promotionsData: promotionsToCreate.map(({ campaign_identifier, ...rest }) => rest) as any },
    });
    for (const promo of createdPromotions) {
      const def = promotionsToCreate.find((d) => d.code === promo.code);
      const campaign = campaignsByIdentifier.get(def?.campaign_identifier ?? "");
      if (!campaign) continue;
      try { await addOrRemoveCampaignPromotionsWorkflow(container).run({ input: { id: campaign.id, add: [promo.id] } }); }
      catch { /* already linked */ }
    }
    logger.info(`Created ${createdPromotions.length} promotions.`);
  }

  // ── Return reasons ────────────────────────────────────────────────────────
  logger.info("Seeding return reasons...");
  const orderModuleService = container.resolve(ModuleRegistrationName.ORDER) as any;
  const existingReasons = await orderModuleService.listReturnReasons({}).catch(() => [] as any[]);
  const existingReasonValues = new Set((existingReasons as Array<{ value: string }>).map((r) => r.value));
  const returnReasonDefs = [
    { value: "wrong_item",       label: "Wrong item received",       description: "Item received does not match order." },
    { value: "defective",        label: "Defective / damaged",       description: "Item arrived damaged or has a defect." },
    { value: "not_as_described", label: "Not as described",          description: "Product does not match description." },
    { value: "changed_mind",     label: "Changed mind",              description: "Customer no longer wants the item." },
    { value: "sizing_issue",     label: "Sizing / fit issue",        description: "Size or dimensions do not suit customer." },
    { value: "colour_mismatch",  label: "Colour not as expected",    description: "Colour differs from website photos." },
    { value: "late_delivery",    label: "Arrived too late",          description: "Item arrived after required date." },
    { value: "quality_concern",  label: "Quality below expectation", description: "Silk quality below customer expectations." },
  ];
  const reasonsToCreate = returnReasonDefs.filter((r) => !existingReasonValues.has(r.value));
  if (reasonsToCreate.length > 0) {
    await createReturnReasonsWorkflow(container).run({ input: { data: reasonsToCreate } });
    logger.info(`Created ${reasonsToCreate.length} return reasons.`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  logger.info("Silk Shop seed complete!");
  logger.info(`B2C publishable key: ${b2cKey.token}`);
  logger.info(`B2B publishable key: ${b2bKey.token}`);
  logger.info("→ Update NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in storefront/.env.local with the B2C key");
  logger.info("─────────────────────────────────────────");
  logger.info("Seeded:");
  logger.info(`  ✓ ${levelsToCreate.length} inventory levels at Athens Warehouse`);
  logger.info("  ✓ Product types, tags, and types assigned");
  logger.info("  ✓ Price lists (B2B 20%, VIP 10%, Bridal 15%)");
  logger.info("  ✓ Promotion campaigns + discount codes (WELCOME5, BULK25, SUMMER10, FREESHIP)");
  logger.info("  ✓ Return reasons");
  logger.info("─────────────────────────────────────────");
}
