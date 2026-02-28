import {
  ExecArgs,
  IApiKeyModuleService,
  IFulfillmentModuleService,
  IProductModuleService,
  IRegionModuleService,
  ISalesChannelModuleService,
  IStockLocationService,
  ITaxModuleService,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/core-flows";

/**
 * Removes all demo/seed data so the silk-shop seed can start with a clean
 * slate. Cleans (in dependency order):
 *   products → categories → collections
 *   fulfillment sets (cascades shipping options/service zones/geo zones)
 *   shipping profiles
 *   stock locations
 *   publishable API keys
 *   tax regions → regions
 *   non-default sales channels
 *
 * Run with: yarn medusa exec src/scripts/clean-seed-data.ts
 */
export default async function cleanSeedData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const productModule: IProductModuleService = container.resolve(
    ModuleRegistrationName.PRODUCT
  );
  const regionModule: IRegionModuleService = container.resolve(
    ModuleRegistrationName.REGION
  );
  const taxModule: ITaxModuleService = container.resolve(Modules.TAX);
  const salesChannelModule: ISalesChannelModuleService = container.resolve(
    ModuleRegistrationName.SALES_CHANNEL
  );
  const fulfillmentModule: IFulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );
  const stockLocationModule: IStockLocationService = container.resolve(
    ModuleRegistrationName.STOCK_LOCATION
  );
  const apiKeyModule: IApiKeyModuleService = container.resolve(
    ModuleRegistrationName.API_KEY
  );

  // ── Products ──────────────────────────────────────────────────────────────
  logger.info("Deleting existing products...");
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
  });
  if (products.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: products.map((p: { id: string }) => p.id) },
    });
    logger.info(`Deleted ${products.length} products.`);
  }

  // ── Product categories ────────────────────────────────────────────────────
  logger.info("Deleting existing product categories...");
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id"],
  });
  if (categories.length) {
    await productModule.deleteProductCategories(
      categories.map((c: { id: string }) => c.id)
    );
    logger.info(`Deleted ${categories.length} categories.`);
  }

  // ── Collections ───────────────────────────────────────────────────────────
  logger.info("Deleting existing collections...");
  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
  });
  if (collections.length) {
    await productModule.deleteProductCollections(
      collections.map((c: { id: string }) => c.id)
    );
    logger.info(`Deleted ${collections.length} collections.`);
  }

  // ── Fulfillment sets (cascades shipping options, service zones, geo zones)
  logger.info("Deleting existing fulfillment sets...");
  const fulfillmentSets = await fulfillmentModule.listFulfillmentSets();
  if (fulfillmentSets.length) {
    await fulfillmentModule.deleteFulfillmentSets(
      fulfillmentSets.map((f) => f.id)
    );
    logger.info(`Deleted ${fulfillmentSets.length} fulfillment sets.`);
  }

  // ── Shipping profiles ─────────────────────────────────────────────────────
  logger.info("Deleting existing shipping profiles...");
  const shippingProfiles = await fulfillmentModule.listShippingProfiles();
  if (shippingProfiles.length) {
    await fulfillmentModule.deleteShippingProfiles(
      shippingProfiles.map((p) => p.id)
    );
    logger.info(`Deleted ${shippingProfiles.length} shipping profiles.`);
  }

  // ── Stock locations ───────────────────────────────────────────────────────
  logger.info("Deleting existing stock locations...");
  const stockLocations = await stockLocationModule.listStockLocations({});
  if (stockLocations.length) {
    await stockLocationModule.deleteStockLocations(
      stockLocations.map((sl) => sl.id)
    );
    logger.info(`Deleted ${stockLocations.length} stock locations.`);
  }

  // ── Publishable API keys ──────────────────────────────────────────────────
  logger.info("Deleting existing publishable API keys...");
  const apiKeys = await apiKeyModule.listApiKeys({ type: "publishable" });
  if (apiKeys.length) {
    // Keys must be revoked before they can be deleted
    await apiKeyModule.revoke(
      { id: apiKeys.map((k) => k.id) },
      { revoked_by: "seed-clean" }
    );
    await apiKeyModule.deleteApiKeys(apiKeys.map((k) => k.id));
    logger.info(`Deleted ${apiKeys.length} publishable API keys.`);
  }

  // ── Tax regions ───────────────────────────────────────────────────────────
  logger.info("Deleting existing tax regions...");
  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id"],
  });
  if (taxRegions.length) {
    await taxModule.deleteTaxRegions(
      taxRegions.map((t: { id: string }) => t.id)
    );
    logger.info(`Deleted ${taxRegions.length} tax regions.`);
  }

  // ── Regions ───────────────────────────────────────────────────────────────
  logger.info("Deleting existing regions...");
  const regions = await regionModule.listRegions();
  if (regions.length) {
    await regionModule.deleteRegions(regions.map((r) => r.id));
    logger.info(`Deleted ${regions.length} regions.`);
  }

  // ── Sales channels (keep "Default Sales Channel") ─────────────────────────
  logger.info("Deleting non-default sales channels...");
  const channels = await salesChannelModule.listSalesChannels();
  const toDelete = channels.filter(
    (ch) => ch.name !== "Default Sales Channel"
  );
  if (toDelete.length) {
    await salesChannelModule.deleteSalesChannels(toDelete.map((ch) => ch.id));
    logger.info(`Deleted ${toDelete.length} sales channels.`);
  }

  logger.info("Clean complete — ready for silk shop seed.");
}
