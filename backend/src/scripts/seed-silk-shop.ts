import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
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

/**
 * Seeds the Greek Silk Shop with:
 * - 2 sales channels (B2C + B2B)
 * - Greek / EU / Cyprus regions with EUR
 * - Tax regions for all countries
 * - Greek warehouse stock location
 * - Standard + Express shipping options
 * - 2 publishable API keys
 * - 4 collections, 5 top-level categories
 * - 15 silk products
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
      ],
    },
  });

  const greeceRegion = regionResult[0];
  logger.info("Finished seeding regions.");

  // ── Tax regions ────────────────────────────────────────────────────────────
  logger.info("Creating tax regions...");
  const allCountries = ["gr", "cy", ...euCountries];
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
  const { result: shippingProfileResult } =
    await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default", type: "default" }] },
    });
  const shippingProfile = shippingProfileResult[0];

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
      ],
    },
  });
  const [newArrivals, bestsellers, luxuryCollection, weddingBridal] =
    collectionsResult;

  // ── Categories ─────────────────────────────────────────────────────────────
  logger.info("Creating product categories...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Scarves & Shawls", handle: "scarves-shawls", is_active: true },
        { name: "Clothing", handle: "clothing", is_active: true },
        { name: "Home & Living", handle: "home-living", is_active: true },
        { name: "Accessories", handle: "accessories", is_active: true },
        { name: "Gifts & Sets", handle: "gifts-sets", is_active: true },
      ],
    },
  });
  const [scarvesCategory, clothingCategory, homeCategory, accessoriesCategory, giftsCategory] =
    categoryResult;

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
          description:
            "Hand-finished pure mulberry silk scarf in the deep blues of the Aegean Sea. Naturally temperature-regulating and irresistibly soft.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: scarvesCategory.id }],
          collection_id: bestsellers.id,
          options: [{ title: "Size", values: ["70×70 cm", "90×90 cm", "140×140 cm"] }],
          variants: [
            {
              title: "70×70 cm",
              sku: "SCARF-AEGEAN-70",
              options: { Size: "70×70 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 7900 },
                { currency_code: "usd", amount: 8900 },
              ],
            },
            {
              title: "90×90 cm",
              sku: "SCARF-AEGEAN-90",
              options: { Size: "90×90 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 9900 },
                { currency_code: "usd", amount: 10900 },
              ],
            },
            {
              title: "140×140 cm",
              sku: "SCARF-AEGEAN-140",
              options: { Size: "140×140 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 13900 },
                { currency_code: "usd", amount: 15900 },
              ],
            },
          ],
        },
        {
          title: 'Silk Shawl "Santorini Sunset"',
          handle: "silk-shawl-santorini-sunset",
          description:
            "Generous silk shawl in warm terracotta, coral and gold — the colours of a Santorini sunset. 100% 16mm charmeuse silk.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: scarvesCategory.id }],
          collection_id: newArrivals.id,
          options: [{ title: "Size", values: ["90×180 cm", "110×200 cm"] }],
          variants: [
            {
              title: "90×180 cm",
              sku: "SHAWL-SANTORINI-90",
              options: { Size: "90×180 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 11900 },
                { currency_code: "usd", amount: 12900 },
              ],
            },
            {
              title: "110×200 cm",
              sku: "SHAWL-SANTORINI-110",
              options: { Size: "110×200 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 15900 },
                { currency_code: "usd", amount: 17900 },
              ],
            },
          ],
        },

        // ── Clothing ─────────────────────────────────────────────────────
        {
          title: 'Silk Blouse "Olympia"',
          handle: "silk-blouse-olympia",
          description:
            "Flowing pure silk blouse with a relaxed silhouette. Features delicate pin-tuck detail at the placket. Available in ivory and deep navy.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: clothingCategory.id }],
          collection_id: newArrivals.id,
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
                ],
              }))
            ),
          ],
        },
        {
          title: 'Silk Dress "Santorini"',
          handle: "silk-dress-santorini",
          description:
            "Midi slip dress in liquid silk satin. Adjustable spaghetti straps, bias cut. Drapes beautifully for both daytime and evening.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: clothingCategory.id }],
          collection_id: luxuryCollection.id,
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
                ],
              }))
            ),
          ],
        },
        {
          title: 'Mulberry Silk Robe "Aphrodite"',
          handle: "silk-robe-aphrodite",
          description:
            "Luxurious long robe in 22mm mulberry silk. Deep cuffs, wide shawl collar, inner tie. The ultimate loungewear upgrade.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: clothingCategory.id }],
          collection_id: luxuryCollection.id,
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: ["S", "M", "L", "XL"].map((size) => ({
            title: size,
            sku: `ROBE-APHRODITE-${size}`,
            options: { Size: size },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 34900 },
              { currency_code: "usd", amount: 38900 },
            ],
          })),
        },
        {
          title: 'Silk Pajama Set "Nyx"',
          handle: "silk-pajama-set-nyx",
          description:
            "Classic two-piece pajama set in pure charmeuse silk. Piped trim detail on collar, cuffs and pockets. Breathable all year round.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: clothingCategory.id }],
          collection_id: bestsellers.id,
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
                ],
              }))
            ),
          ],
        },

        // ── Home & Living ────────────────────────────────────────────────
        {
          title: "Silk Pillowcase Set",
          handle: "silk-pillowcase-set",
          description:
            "Set of 2 silk pillowcases in 22mm mulberry silk. Reduces hair breakage, maintains moisture, and simply feels amazing. Oxford style with envelope closure.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: homeCategory.id }],
          collection_id: bestsellers.id,
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
                ],
              }))
            ),
          ],
        },
        {
          title: 'Silk Throw "Mykonos"',
          handle: "silk-throw-mykonos",
          description:
            "Lightweight silk-blend throw in Cycladic white with woven border detail. Perfect for warm Mediterranean evenings.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: homeCategory.id }],
          collection_id: newArrivals.id,
          options: [{ title: "Size", values: ["130×170 cm"] }],
          variants: [
            {
              title: "130×170 cm",
              sku: "THROW-MYKONOS-130",
              options: { Size: "130×170 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 15900 },
                { currency_code: "usd", amount: 17900 },
              ],
            },
          ],
        },
        {
          title: 'Table Runner "Cyclades"',
          handle: "silk-table-runner-cyclades",
          description:
            "Elegant table runner in heavyweight dupioni silk with raw edge finish. Adds quiet luxury to any table setting.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: homeCategory.id }],
          collection_id: luxuryCollection.id,
          options: [{ title: "Size", values: ["35×180 cm", "35×250 cm"] }],
          variants: [
            {
              title: "35×180 cm",
              sku: "RUNNER-CYCLADES-180",
              options: { Size: "35×180 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 4900 },
                { currency_code: "usd", amount: 5500 },
              ],
            },
            {
              title: "35×250 cm",
              sku: "RUNNER-CYCLADES-250",
              options: { Size: "35×250 cm" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 6500 },
                { currency_code: "usd", amount: 7200 },
              ],
            },
          ],
        },

        // ── Accessories ──────────────────────────────────────────────────
        {
          title: 'Silk Tie "Parthenon"',
          handle: "silk-tie-parthenon",
          description:
            "7-fold hand-rolled silk tie woven with a subtle Greek key (meander) pattern. Each tie is a wearable work of art.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: accessoriesCategory.id }],
          collection_id: bestsellers.id,
          options: [
            {
              title: "Colour",
              values: ["Deep Navy", "Burgundy", "Forest Green", "Charcoal"],
            },
          ],
          variants: ["Deep Navy", "Burgundy", "Forest Green", "Charcoal"].map(
            (colour) => ({
              title: colour,
              sku: `TIE-PARTHENON-${colour.replace(" ", "-").toUpperCase()}`,
              options: { Colour: colour },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 8900 },
                { currency_code: "usd", amount: 9900 },
              ],
            })
          ),
        },
        {
          title: 'Silk Pocket Square "Acropolis"',
          handle: "silk-pocket-square-acropolis",
          description:
            "Hand-rolled pure silk pocket square with hand-painted Parthenon frieze motif. One size, one-of-a-kind character.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: accessoriesCategory.id }],
          collection_id: luxuryCollection.id,
          options: [{ title: "Colour", values: ["White", "Ivory", "Sky Blue"] }],
          variants: ["White", "Ivory", "Sky Blue"].map((colour) => ({
            title: colour,
            sku: `POCKET-ACROPOLIS-${colour.replace(" ", "-").toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 3900 },
              { currency_code: "usd", amount: 4500 },
            ],
          })),
        },
        {
          title: 'Silk Eye Mask "Morpheus"',
          handle: "silk-eye-mask-morpheus",
          description:
            "Ultra-soft 19mm mulberry silk sleep mask with adjustable elastic. Blocks light without creasing delicate skin.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: accessoriesCategory.id }],
          collection_id: bestsellers.id,
          options: [{ title: "Colour", values: ["Ivory", "Black", "Rose"] }],
          variants: ["Ivory", "Black", "Rose"].map((colour) => ({
            title: colour,
            sku: `MASK-MORPHEUS-${colour.toUpperCase()}`,
            options: { Colour: colour },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 2900 },
              { currency_code: "usd", amount: 3200 },
            ],
          })),
        },
        {
          title: "Silk Hair Scrunchie Set",
          handle: "silk-hair-scrunchie-set",
          description:
            "Set of silk hair scrunchies — kind to hair, no crimping, no breakage. A small luxury with real benefits.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: accessoriesCategory.id }],
          collection_id: newArrivals.id,
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
                  {
                    currency_code: "eur",
                    amount: pack === "Pack of 3" ? 1900 : 3400,
                  },
                  {
                    currency_code: "usd",
                    amount: pack === "Pack of 3" ? 2100 : 3800,
                  },
                ],
              }))
            ),
          ],
        },

        // ── Gifts & Sets ─────────────────────────────────────────────────
        {
          title: 'Bridal Silk Set "Hera"',
          handle: "silk-bridal-set-hera",
          description:
            "The complete bridal trousseau: robe, pajama set, eye mask and two pillowcases, presented in a keepsake gift box with satin ribbon.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: giftsCategory.id }],
          collection_id: weddingBridal.id,
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: ["S", "M", "L", "XL"].map((size) => ({
            title: size,
            sku: `BRIDAL-HERA-${size}`,
            options: { Size: size },
            manage_inventory: true,
            prices: [
              { currency_code: "eur", amount: 89900 },
              { currency_code: "usd", amount: 98900 },
            ],
          })),
        },
        {
          title: 'Gift Set "Athena"',
          handle: "silk-gift-set-athena",
          description:
            "A curated silk gift trio: one Aegean Blue scarf, one pillowcase and one Morpheus eye mask, presented in a luxe gift box.",
          status: ProductStatus.PUBLISHED,
          sales_channels: channelIds,
          categories: [{ id: giftsCategory.id }],
          collection_id: bestsellers.id,
          options: [{ title: "Size", values: ["One Size"] }],
          variants: [
            {
              title: "One Size",
              sku: "GIFT-ATHENA-OS",
              options: { Size: "One Size" },
              manage_inventory: true,
              prices: [
                { currency_code: "eur", amount: 17900 },
                { currency_code: "usd", amount: 19900 },
              ],
            },
          ],
        },
      ],
    },
  });

  logger.info("Finished seeding products.");
  logger.info("─────────────────────────────────────────");
  logger.info("Silk Shop seed complete!");
  logger.info(`B2C publishable key: ${b2cKey.token}`);
  logger.info(`B2B publishable key: ${b2bKey.token}`);
  logger.info(
    "→ Update NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in storefront/.env.local with the B2C key"
  );
  logger.info("─────────────────────────────────────────");
}
