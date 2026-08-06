import { readdirSync } from "node:fs";
import path from "node:path";

import { GithubIcon } from "blode-icons-react";
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
        <header className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-bold text-4xl">Matt's experiments</h1>

          {/* The only thing the old footer carried that the layout's
              attribution does not. Negative margin keeps the tap target at
              36px without adding a gap above the grid. */}
          <a
            aria-label="View source on GitHub"
            className="-m-2 rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            href="https://github.com/mblode/experiments"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon aria-hidden className="size-5" />
          </a>
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
      </div>
    </div>
  );
}
