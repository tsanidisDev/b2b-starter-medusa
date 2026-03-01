import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Sends an order confirmation email when an order is placed.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "shipping_total",
      "email",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
      "shipping_address.*",
      "billing_address.*",
      "shipping_methods.*",
    ],
    filters: { id: data.id },
  });

  if (!order?.email) {
    return;
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
    data: {
      order,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
