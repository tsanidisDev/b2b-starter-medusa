"use client"

import { useCart } from "@/lib/context/cart-context"
import { useChannel } from "@/lib/context/channel-context"
import { getCheckoutStep } from "@/lib/util/get-checkout-step"
import CartToCsvButton from "@/modules/cart/components/cart-to-csv-button"
import CartTotals from "@/modules/cart/components/cart-totals"
import PromotionCode from "@/modules/checkout/components/promotion-code"
import Button from "@/modules/common/components/button"
import Divider from "@/modules/common/components/divider"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"
import { B2BCustomer } from "@/types"
import { ApprovalStatusType } from "@/types/approval"
import { ExclamationCircle } from "@medusajs/icons"
import { Container } from "@medusajs/ui"

type SummaryProps = {
  customer: B2BCustomer | null
  spendLimitExceeded: boolean
}

const Summary = ({ customer, spendLimitExceeded }: SummaryProps) => {
  const { handleEmptyCart, cart } = useCart()
  const { isB2B } = useChannel()

  if (!cart) return null

  const checkoutStep = getCheckoutStep(cart)
  const checkoutPath = checkoutStep
    ? `/checkout?step=${checkoutStep}`
    : "/checkout"

  // B2C guests go straight to checkout; B2B guests must log in first
  const checkoutButtonLink = customer || !isB2B ? checkoutPath : "/account"

  const isPendingApproval = cart?.approvals?.some(
    (approval) => approval?.status === ApprovalStatusType.PENDING
  )

  return (
    <Container className="flex flex-col gap-y-3">
      <CartTotals />
      <Divider />
      <PromotionCode cart={cart} />
      <Divider className="my-6" />
      {spendLimitExceeded && (
        <div className="flex items-center gap-x-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md">
          <ExclamationCircle className="text-orange-500 w-fit overflow-visible" />
          <p className="text-foreground text-xs">
            This order exceeds your spending limit.
            <br />
            Please contact your manager for approval.
          </p>
        </div>
      )}
      <LocalizedClientLink
        href={checkoutButtonLink}
        data-testid="checkout-button"
      >
        <Button
          className="w-full h-10 rounded-full shadow-none"
          disabled={spendLimitExceeded}
        >
          {customer
            ? spendLimitExceeded
              ? "Spending Limit Exceeded"
              : "Checkout"
            : isB2B
              ? "Log in to Checkout"
              : "Checkout"}
        </Button>
      </LocalizedClientLink>
      {/* Quote buttons — B2B only */}
      {isB2B && !!customer && (
        <RequestQuoteConfirmation>
          <Button
            className="w-full h-10 rounded-full shadow-borders-base"
            variant="secondary"
            disabled={isPendingApproval}
          >
            Request Quote
          </Button>
        </RequestQuoteConfirmation>
      )}
      {isB2B && !customer && (
        <RequestQuotePrompt>
          <Button
            className="w-full h-10 rounded-full shadow-borders-base"
            variant="secondary"
            disabled={isPendingApproval}
          >
            Request Quote
          </Button>
        </RequestQuotePrompt>
      )}
      <CartToCsvButton cart={cart} />
      <Button
        onClick={handleEmptyCart}
        className="w-full h-10 rounded-full shadow-borders-base"
        variant="secondary"
        disabled={isPendingApproval}
      >
        Empty Cart
      </Button>
    </Container>
  )
}

export default Summary
