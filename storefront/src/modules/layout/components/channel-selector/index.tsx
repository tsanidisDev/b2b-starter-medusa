"use client"

import { useChannel } from "@/lib/context/channel-context"
import type { Channel } from "@/lib/context/channel-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const CHANNEL_OPTIONS: { value: Channel; label: string; sublabel: string }[] =
  [
    {
      value: "b2c",
      label: "Retail",
      sublabel: "Shop as an individual",
    },
    {
      value: "b2b",
      label: "Wholesale",
      sublabel: "Shop as a business",
    },
  ]

export function ChannelSelector({ className }: { className?: string }) {
  const { channel, setChannel, isPending } = useChannel()

  return (
    <Select
      value={channel}
      onValueChange={(v) => setChannel(v as Channel)}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-[120px] text-xs border-none bg-transparent shadow-none focus:ring-0 gap-1",
          className
        )}
      >
        {channel === "b2b" ? (
          <Building2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {CHANNEL_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <div className="flex flex-col">
              <span className="font-medium">{opt.label}</span>
              <span className="text-muted-foreground text-xs">{opt.sublabel}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
