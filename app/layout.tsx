import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import "@dnd-grid/react/styles.css";
import { CraftedBy } from "@/components/crafted-by";
import { Toaster } from "@/components/ui/sonner";
import { ROOT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";

// Glide 2.0.0 — https://github.com/mblode/glide. One variable file per style
// covers the whole weight axis, so each declares 100-950 rather than a face per
// weight.
const glide = localFont({
  src: [
    { path: "./fonts/glide-variable.woff2", style: "normal" },
    { path: "./fonts/glide-variable-italic.woff2", style: "italic" },
  ],
  variable: "--font-glide",
  weight: "100 950",
  display: "swap",
});

const glideMono = localFont({
  src: "./fonts/glide-mono.woff2",
  variable: "--font-glide-mono",
  weight: "400",
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
  // the arrangement that produced glide's `/glide/glide/` card.
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
      className={`${glide.variable} ${glideMono.variable} h-full font-normal font-sans text-foreground antialiased`}
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
