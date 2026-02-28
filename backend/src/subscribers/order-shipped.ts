import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Sends a shipping confirmation email when an order's fulfillment is shipped.
 */
export default async function orderShippedHandler({
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
      "currency_code",
      "total",
      "email",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
      "shipping_address.*",
      "fulfillments.*",
      "fulfillments.tracking_links.*",
    ],
    filters: { id: data.id },
  });

  if (!order?.email) {
    return;
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-shipped",
    data: {
      order,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_delivered",
};
