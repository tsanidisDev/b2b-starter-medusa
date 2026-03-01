"use server"

import { setActiveChannel, type Channel } from "@/lib/data/cookies"
import { revalidatePath } from "next/cache"

/**
 * Server Action to switch the active channel.
 * Called from the ChannelSelector when JS is available; also usable as a
 * form action for progressive enhancement.
 */
export async function switchChannelAction(channel: Channel) {
  await setActiveChannel(channel)
  revalidatePath("/", "layout")
}
