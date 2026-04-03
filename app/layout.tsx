import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@dnd-grid/react/styles.css";
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
      className={`${glide.variable} h-full font-normal font-sans text-foreground antialiased`}
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
