import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createCustomerGroupsWorkflow,
  createCustomersWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows";
import {
  ExecArgs,
  IFulfillmentModuleService,
  ISalesChannelModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import { createCompaniesWorkflow } from "../workflows/company/workflows/create-companies";
import { COMPANY_MODULE } from "../modules/company";
import { ModuleCompanySpendingLimitResetFrequency } from "../types/company/module";

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

  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Greece",
          currency_code: "eur",
          countries: ["gr"],
          payment_providers: ["pp_system_default"],
        },
        {
          name: "European Union",
          currency_code: "eur",
          countries: euCountries,
          payment_providers: ["pp_system_default"],
        },
        {
          name: "Cyprus",
          currency_code: "eur",
          countries: ["cy"],
          payment_providers: ["pp_system_default"],
        },
        {
          name: "United States",
          currency_code: "usd",
          countries: ["us"],
          payment_providers: ["pp_system_default"],
        },
        {
          name: "United Kingdom",
          currency_code: "gbp",
          countries: ["gb"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });

  const greeceRegion = regionResult[0];
  logger.info("Finished seeding regions.");

  // ── Tax regions ────────────────────────────────────────────────────────────
  logger.info("Creating tax regions...");
  const allCountries = ["gr", "cy", "us", "gb", ...euCountries];
  await createTaxRegionsWorkflow(container).run({
    input: allCountries.map((country_code) => ({ country_code })),
  });
  logger.info("Finished seeding tax regions.");

  // ── Stock location ─────────────────────────────────────────────────────────
  logger.info("Creating stock location...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Athens Warehouse",
          address: {
            city: "Athens",
            country_code: "GR",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

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

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  const serviceZoneId = fulfillmentSet.service_zones[0].id;

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping (5-7 days)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Standard", description: "5-7 business days", code: "standard" },
        prices: [
          { currency_code: "eur", amount: 500 },
          { region_id: greeceRegion.id, amount: 300 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: '"true"', operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "Express Shipping (1-3 days)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Express", description: "1-3 business days", code: "express" },
        prices: [
          { currency_code: "eur", amount: 1200 },
          { region_id: greeceRegion.id, amount: 800 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: '"true"', operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });
  logger.info("Finished seeding shipping.");

  // Link both channels to stock location
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [b2cChannel.id, b2bChannel.id] },
  });

  // ── Publishable API keys ───────────────────────────────────────────────────
  logger.info("Creating publishable API keys...");
  const { result: apiKeyResult } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        { title: "B2C Storefront", type: "publishable", created_by: "" },
        { title: "B2B Wholesale", type: "publishable", created_by: "" },
      ],
    },
  });
  const [b2cKey, b2bKey] = apiKeyResult;

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: b2cKey.id, add: [b2cChannel.id] },
  });
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: b2bKey.id, add: [b2bChannel.id] },
  });

  logger.info(`B2C publishable key: ${b2cKey.token}`);
  logger.info(`B2B publishable key: ${b2bKey.token}`);

  // ── Collections ────────────────────────────────────────────────────────────
  logger.info("Creating collections...");
  const { result: collectionsResult } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        { title: "New Arrivals", handle: "new-arrivals" },
        { title: "Bestsellers", handle: "bestsellers" },
        { title: "Luxury Collection", handle: "luxury-collection" },
        { title: "Wedding & Bridal", handle: "wedding-bridal" },
        { title: "Summer Edit", handle: "summer-edit" },
        { title: "Men's Silk", handle: "mens-silk" },
      ],
    },
  });
  const [newArrivals, bestsellers, luxuryCollection, weddingBridal, summerEdit, mensSilk] =
    collectionsResult;

  // ── Categories ─────────────────────────────────────────────────────────────
  logger.info("Creating product categories...");
  const { result: topCategories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Scarves & Shawls", handle: "scarves-shawls", is_active: true, rank: 0 },
        { name: "Clothing", handle: "clothing", is_active: true, rank: 1 },
        { name: "Home & Living", handle: "home-living", is_active: true, rank: 2 },
        { name: "Accessories", handle: "accessories", is_active: true, rank: 3 },
        { name: "Gifts & Sets", handle: "gifts-sets", is_active: true, rank: 4 },
      ],
    },
  });
  const [scarvesCategory, clothingCategory, homeCategory, accessoriesCategory, giftsCategory] = topCategories;

  // Sub-categories
  const { result: subCategories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        // Scarves sub-categories
        { name: "Square Scarves", handle: "square-scarves", is_active: true, parent_category_id: scarvesCategory.id, rank: 0 },
        { name: "Long Scarves", handle: "long-scarves", is_active: true, parent_category_id: scarvesCategory.id, rank: 1 },
        { name: "Shawls & Wraps", handle: "shawls-wraps", is_active: true, parent_category_id: scarvesCategory.id, rank: 2 },
        // Clothing sub-categories
        { name: "Dresses", handle: "dresses", is_active: true, parent_category_id: clothingCategory.id, rank: 0 },
        { name: "Blouses & Tops", handle: "blouses-tops", is_active: true, parent_category_id: clothingCategory.id, rank: 1 },
        { name: "Robes & Loungewear", handle: "robes-loungewear", is_active: true, parent_category_id: clothingCategory.id, rank: 2 },
        // Home sub-categories
        { name: "Pillowcases", handle: "pillowcases", is_active: true, parent_category_id: homeCategory.id, rank: 0 },
        { name: "Throws & Blankets", handle: "throws-blankets", is_active: true, parent_category_id: homeCategory.id, rank: 1 },
        { name: "Table Linens", handle: "table-linens", is_active: true, parent_category_id: homeCategory.id, rank: 2 },
        // Accessories sub-categories
        { name: "Ties & Pocket Squares", handle: "ties-pocket-squares", is_active: true, parent_category_id: accessoriesCategory.id, rank: 0 },
        { name: "Hair Accessories", handle: "hair-accessories", is_active: true, parent_category_id: accessoriesCategory.id, rank: 1 },
        { name: "Eye Masks", handle: "eye-masks", is_active: true, parent_category_id: accessoriesCategory.id, rank: 2 },
        // Gifts sub-categories
        { name: "Bridal", handle: "bridal", is_active: true, parent_category_id: giftsCategory.id, rank: 0 },
        { name: "Corporate Gifts", handle: "corporate-gifts", is_active: true, parent_category_id: giftsCategory.id, rank: 1 },
      ],
    },
  });
  const [
    squareScarves, longScarves, shawlsWraps,
    dresses, blousesTops, robesLoungewear,
    pillowcases, throwsBlankets, tableLinens,
    tiesPocketSquares, hairAccessories, eyeMasks,
    bridal, corporateGifts,
  ] = subCategories;

  // ── Products ───────────────────────────────────────────────────────────────
  logger.info("Creating products...");

  const channelIds = [{ id: b2cChannel.id }, { id: b2bChannel.id }];

  await createProductsWorkflow(container).run({
    input: {
      products: [
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
      ],
    },
  });

  logger.info("Finished seeding products.");

  // ── Customer Groups ────────────────────────────────────────────────────────
  logger.info("Creating customer groups...");
  const { result: customerGroupResult } = await createCustomerGroupsWorkflow(container).run({
    input: {
      customersData: [
        { name: "B2B Wholesale" },
        { name: "VIP Retail" },
        { name: "Bridal Trade" },
      ],
    },
  });
  const [b2bGroup, vipGroup, bridalGroup] = customerGroupResult;

  // ── Demo B2B Customers ─────────────────────────────────────────────────────
  logger.info("Creating demo B2B customers...");
  const { result: customersResult } = await createCustomersWorkflow(container).run({
    input: {
      customersData: [
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
      ],
    },
  });
  const [hotelBuyer, bridalBuyer, corporateBuyer, retailCustomer] = customersResult;

  // ── B2B Companies ──────────────────────────────────────────────────────────
  logger.info("Creating B2B companies...");
  const { result: companiesResult } = await createCompaniesWorkflow(container).run({
    input: [
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
    ],
  });

  logger.info(`Created ${companiesResult.length} B2B companies.`);

  // ── Company Employees ──────────────────────────────────────────────────────
  logger.info("Creating company employees...");
  const companyModuleService = container.resolve(COMPANY_MODULE);
  const [hotelCompany, bridalCompany, corporateCompany] = companiesResult;

  await companyModuleService.createEmployees([
    {
      company_id: hotelCompany.id,
      customer_id: hotelBuyer.id,
      spending_limit: 500000,
      is_admin: true,
    },
    {
      company_id: bridalCompany.id,
      customer_id: bridalBuyer.id,
      spending_limit: 300000,
      is_admin: true,
    },
    {
      company_id: corporateCompany.id,
      customer_id: corporateBuyer.id,
      spending_limit: 1000000,
      is_admin: true,
    },
  ]);

  logger.info("Finished seeding B2B companies, employees and customer groups.");

  logger.info("Silk Shop seed complete!");
  logger.info(`B2C publishable key: ${b2cKey.token}`);
  logger.info(`B2B publishable key: ${b2bKey.token}`);
  logger.info(
    "→ Update NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in storefront/.env.local with the B2C key"
  );
  logger.info("─────────────────────────────────────────");
}
