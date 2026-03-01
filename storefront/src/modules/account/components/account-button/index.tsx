import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import User from "@/modules/common/icons/user"
import { B2BCustomer } from "@/types/global"

export default async function AccountButton({
  customer,
}: {
  customer: B2BCustomer | null
}) {
  return (
    <LocalizedClientLink href="/account">
      <button className="flex gap-1.5 items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
        <User />
        <span className="hidden small:inline-block">
          {customer ? customer.first_name : "Log in"}
        </span>
      </button>
    </LocalizedClientLink>
  )
}

