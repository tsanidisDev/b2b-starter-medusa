import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Sends a cancellation email when an order is canceled.
 */
export default async function orderCanceledHandler({
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
      "canceled_at",
      "currency_code",
      "total",
      "email",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
    ],
    filters: { id: data.id },
  });

  if (!order?.email) {
    return;
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-canceled",
    data: {
      order,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.canceled",
};
