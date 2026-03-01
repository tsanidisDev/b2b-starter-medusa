import { clx } from "@medusajs/ui"

const Divider = ({ className }: { className?: string }) => (
  <div
    className={clx(
      "h-px border-b border-border ml-[-1.5rem] w-[calc(100%+3rem)] my-2",
      className
    )}
  />
)

export default Divider
