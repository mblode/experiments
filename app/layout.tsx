import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import "@dnd-grid/react/styles.css";
import { CraftedBy } from "@/components/crafted-by";
import { Toaster } from "@/components/ui/sonner";

const glide = localFont({
  src: [
    { path: "../public/fonts/glide-variable.woff2", style: "normal" },
    { path: "../public/fonts/glide-variable-italic.woff2", style: "italic" },
  ],
  variable: "--font-glide",
  weight: "400 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blode.co"),
  title: "Blode Experiments",
  description: "A collection of Matthew Blode's UI experiments",
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
      className={`${glide.variable} h-full font-normal font-sans text-foreground antialiased`}
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
        <div className="flex-1">{children}</div>
        <footer className="flex justify-center p-6">
          <CraftedBy />
        </footer>
      </body>
      <Toaster />
    </html>
  );
}
