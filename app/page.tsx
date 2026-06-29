import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { blocks } from "@/lib/blocks";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "A gallery of interactive UI and animation experiments by Matthew Blode, built with Next.js, React, Tailwind, Motion, and Three.js. Explore live demos and source code.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "A gallery of interactive UI and animation experiments by Matthew Blode, built with Next.js, React, Tailwind, Motion, and Three.js.",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "A gallery of interactive UI and animation experiments by Matthew Blode, built with Next.js, React, Tailwind, Motion, and Three.js.",
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-bold text-4xl">Matt's experiments</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(blocks)
            .filter(([, block]) => !block.hidden)
            .reverse()
            .map(([key, block]) => (
              <Link className="flex w-full" href={`/${key}`} key={key}>
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>{block.name}</CardTitle>

                    <CardDescription>{block.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
        </div>

        <footer className="mt-8 border-border border-t px-4 py-8 text-center">
          <div className="text-sm">
            © 2026{" "}
            <a
              className="text-foreground underline-offset-2 hover:underline"
              href="https://matthewblode.com"
              rel="noopener"
              target="_blank"
            >
              Matthew Blode
            </a>
            {" · "}
            <a
              className="text-foreground underline-offset-2 hover:underline"
              href="https://github.com/mblode/matts-experiments"
              rel="noopener"
              target="_blank"
            >
              View Source
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
