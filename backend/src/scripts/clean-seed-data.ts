import {
  ExecArgs,
  IProductModuleService,
  ISalesChannelModuleService,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/core-flows";

/**
 * Removes all demo data (products, categories, collections, sales channels,
 * API keys) so the silk-shop seed can start with a clean slate.
 *
 * Run with: yarn medusa exec src/scripts/clean-seed-data.ts
 */
export default async function cleanSeedData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModule: IProductModuleService = container.resolve(
    ModuleRegistrationName.PRODUCT
  );
  const salesChannelModule: ISalesChannelModuleService = container.resolve(
    ModuleRegistrationName.SALES_CHANNEL
  );
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

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
    await productModule.deleteCollections(
      collections.map((c: { id: string }) => c.id)
    );
    logger.info(`Deleted ${collections.length} collections.`);
  }

  // ── Sales channels (except default) ──────────────────────────────────────
  logger.info("Deleting non-default sales channels...");
  const channels = await salesChannelModule.listSalesChannels();
  const toDelete = channels.filter(
    (ch) =>
      ch.name !== "Default Sales Channel" &&
      ch.name !== "B2C Storefront" &&
      ch.name !== "B2B Wholesale"
  );
  if (toDelete.length) {
    await salesChannelModule.deleteSalesChannels(toDelete.map((ch) => ch.id));
    logger.info(`Deleted ${toDelete.length} sales channels.`);
  }

  logger.info("Clean complete — ready for silk shop seed.");
}
