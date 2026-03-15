import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@dnd-grid/react/styles.css";
import { Toaster } from "@/components/ui/sonner";

const apercu = localFont({
  src: [
    {
      path: "../public/fonts/apercu-regular-pro.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/apercu-italic-pro.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/apercu-bold-pro.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/apercu-bold-italic-pro.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-apercu",
});

export const metadata: Metadata = {
  title: "Matt's experiments",
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
      className={`${apercu.variable} h-full font-normal font-sans text-foreground antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="h-full bg-page-background">
        <div className="h-full">{children}</div>
      </body>
      <GoogleAnalytics gaId="G-FW4LDY9GCD" />
      <Toaster />
    </html>
  );
}
