import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import "@dnd-grid/react/styles.css";
import { CraftedBy } from "@/components/crafted-by";
import { Toaster } from "@/components/ui/sonner";
import { ROOT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // The zone URL, not the bare origin, so that every relative path in this
  // app's metadata is resolved against the zone the app actually serves at.
  // See blode-co/apps/web/.claude/knowledge/zone-conventions.md Rule 11.
  //
  // Next joins `metadataBase.pathname` with the path rather than replacing it,
  // even for a leading slash, so each path here is written *without*
  // `/experiments` and gets the prefix from exactly one place. The bare origin
  // worked only because every path spelled the prefix out by hand, which is
  // the arrangement that previously produced a doubled-up card URL.
  metadataBase: new URL(SITE_URL),
  title: {
    default: ROOT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: "A collection of Matthew Blode's UI experiments",
  authors: [{ name: "Matthew Blode", url: "https://blode.co" }],
  creator: "Matthew Blode",
  // No `images` here: `app/opengraph-image.tsx` is the card. A *generated*
  // route is the one form Next does not prefix with `basePath`, so it composes
  // with `metadataBase` instead of stacking against it, which is what the
  // static `opengraph-image.png` did. Next reuses it for `twitter:image` too
  // when there is no `twitter-image` file.
  openGraph: {
    // Who made it, on every path. The product is already in og:title. See
    // blode-co/apps/web/.claude/knowledge/zone-conventions.md Rule 9.
    siteName: "Matthew Blode",
  },
  twitter: { creator: "@mattblode" },
  verification: {
    google: "mFwyBIbXTaKK4uF_NA0MzVWFyY40hPgBjFObg3rje04",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${inter.variable} ${geistMono.variable} h-full font-normal font-sans text-foreground antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link href={process.env.NEXT_PUBLIC_POSTHOG_HOST} rel="preconnect" />
      </head>
      {/* No `bg-page-background` here. That utility reads
          `--page-background-color`, which only the theme shuffler ever sets,
          and it sets it on `:root`. The variable outlives a client-side
          navigation away from that route, so every other page ended up wearing
          a random theme colour in the strip of body the content did not cover.
          The theme shuffler paints its own fixed, full-viewport background. */}
      <body className="flex min-h-screen flex-col">
        <div className="flex-1" data-page>
          {children}
        </div>
        <footer className="flex justify-center p-6">
          <CraftedBy />
        </footer>
      </body>
      <Toaster />
    </html>
  );
}
