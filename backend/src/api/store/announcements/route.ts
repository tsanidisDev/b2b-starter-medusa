import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IPromotionModuleService } from "@medusajs/framework/types"
import { ModuleRegistrationName, PromotionStatus } from "@medusajs/framework/utils"

export type Announcement = {
  id: string
  message: string
  /** Discount/promo code to highlight, if any */
  code?: string
  /** CTA label */
  cta_text?: string
  /** CTA href (relative) */
  cta_href?: string
  /** expires_at ISO string, if time-bounded */
  expires_at?: string | null
}

export type StoreGetAnnouncementsResponse = {
  announcements: Announcement[]
}

/**
 * GET /store/announcements
 *
 * Public endpoint — no auth required.
 * Returns a list of active promotional announcements to power the storefront
 * announcement bar.  Each announcement is derived from an active Medusa
 * promotion so the bar always reflects real data.
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<StoreGetAnnouncementsResponse>
) => {
  const promotionService: IPromotionModuleService = req.scope.resolve(
    ModuleRegistrationName.PROMOTION
  )

  // Fetch all active promotions with their application method
  const promotions = await promotionService.listPromotions(
    { status: [PromotionStatus.ACTIVE] },
    { relations: ["application_method", "campaign"] }
  )

  const now = new Date()

  const announcements: Announcement[] = promotions
    // Only include promotions whose campaign window is currently active.
    // Rules (all optional — a promotion without a campaign is always shown):
    //   • starts_at must be in the past (campaign has begun)
    //   • ends_at must be in the future (campaign has not expired)
    .filter((promo) => {
      const campaign = promo.campaign
      if (!campaign) return true // no campaign constraint → show it

      const { starts_at, ends_at } = campaign

      // Campaign hasn't started yet
      if (starts_at && new Date(starts_at) > now) return false
      // Campaign has already ended
      if (ends_at && new Date(ends_at) <= now) return false

      return true
    })
    .map((promo): Announcement | null => {
      const method = promo.application_method
      if (!method) return null

      const value = method.value ?? 0
      const code = promo.code ?? ""
      const campaignName = promo.campaign?.name

      let message = ""

      // Free-shipping promotion
      if (method.target_type === "shipping_methods") {
        message = `Free shipping on all orders · use ${code} at checkout`
        return {
          id: promo.id,
          message,
          code,
          cta_text: "Shop Now",
          cta_href: "/store",
          expires_at: promo.campaign?.ends_at?.toISOString() ?? null,
        }
      }

      // Percentage-off
      if (method.type === "percentage") {
        if (campaignName?.toLowerCase().includes("welcome")) {
          message = `New here? ${value}% off your first order · use ${code}`
        } else if (campaignName?.toLowerCase().includes("summer")) {
          message = `Summer Sale — ${value}% off · use ${code}`
        } else if (campaignName?.toLowerCase().includes("b2b") || campaignName?.toLowerCase().includes("bulk")) {
          message = `B2B wholesale — ${value}% off bulk orders · use ${code}`
        } else {
          message = `${value}% off — use ${code} at checkout`
        }
        return {
          id: promo.id,
          message,
          code,
          cta_text: "Shop the sale",
          cta_href: "/store",
          expires_at: promo.campaign?.ends_at?.toISOString() ?? null,
        }
      }

      // Fixed amount off
      if (method.type === "fixed") {
        message = `€${(value / 100).toFixed(0)} off your order · use ${code}`
        return {
          id: promo.id,
          message,
          code,
          cta_text: "Shop Now",
          cta_href: "/store",
          expires_at: promo.campaign?.ends_at?.toISOString() ?? null,
        }
      }

      return null
    })
    .filter((a): a is Announcement => a !== null)

  res.json({ announcements })
}
