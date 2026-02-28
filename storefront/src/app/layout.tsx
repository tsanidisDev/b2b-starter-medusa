import { getBaseURL } from "@/lib/util/env"
import { Toaster } from "@medusajs/ui"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ChannelProvider } from "@/lib/context/channel-context"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Metadata } from "next"
import "@/styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ChannelProvider>
            <main className="relative">{props.children}</main>
            <Toaster className="z-[99999]" position="bottom-left" />
            <SonnerToaster />
          </ChannelProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
