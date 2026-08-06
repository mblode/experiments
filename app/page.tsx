import { readdirSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";
import Link from "next/link";

import { BlockPreview } from "@/components/ui/block-preview";
import { blocks } from "@/lib/blocks";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// Read once at build rather than keeping a generated manifest in sync: a card
// whose clip has not been recorded yet still renders, just without the video.
const clips = new Set(
  readdirSync(path.join(process.cwd(), "public", "previews"))
    .filter((file) => file.endsWith(".mp4"))
    .map((file) => file.replace(/\.mp4$/, ""))
);

export const metadata: Metadata = {
  // Not bare SITE_NAME: the h1 already says that, and a title tag that repeats
  // the h1 verbatim spends the one line search results give you on nothing.
  title: `${SITE_NAME}: interactive UI and animation demos`,
  description:
    "A gallery of interactive UI and animation experiments by Matthew Blode, built with Next.js, React, Tailwind, Motion, and Three.js. Live demos and source.",
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
        <header>
          <h1 className="mb-8 font-bold text-4xl">Matt's experiments</h1>
        </header>

        {/* A list, marked up as one, so it is announced with its length. */}
        <main>
          <ul className="grid list-none gap-x-6 gap-y-8 md:grid-cols-2">
            {Object.entries(blocks)
              .filter(([, block]) => !block.hidden)
              .reverse()
              .map(([key, block]) => (
                <li key={key}>
                  {/* The caption sits outside the frame, so the whole cell is
                      the link rather than the preview being one target and the
                      title another. */}
                  <Link className="group block" href={`/${key}`}>
                    <BlockPreview
                      className="transition-colors duration-200 ease-out group-hover:border-foreground/25"
                      hasClip={clips.has(key)}
                      slug={key}
                    />

                    <h2 className="mt-3 font-medium">{block.name}</h2>

                    <p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
                      {block.description}
                    </p>
                  </Link>
                </li>
              ))}
          </ul>
        </main>

        <footer className="mt-8 border-border border-t px-4 py-8 text-center">
          <div className="text-sm">
            © 2026{" "}
            <a
              className="text-foreground underline-offset-2 hover:underline"
              href="https://blode.co"
              rel="noopener noreferrer"
              target="_blank"
            >
              Matthew Blode
            </a>
            {" · "}
            <a
              className="text-foreground underline-offset-2 hover:underline"
              href="https://github.com/mblode/experiments"
              rel="noopener noreferrer"
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
