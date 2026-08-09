import { readdirSync } from "node:fs";
import path from "node:path";

import { GithubIcon } from "blode-icons-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BlockPreview } from "@/components/ui/block-preview";
import { ZoneBreadcrumb } from "@/components/zone-breadcrumb";
import { blocks } from "@/lib/blocks";
import { ROOT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";

// Read once at build rather than keeping a generated manifest in sync: a card
// whose clip has not been recorded yet still renders, just without the video.
const clips = new Set(
  readdirSync(path.join(process.cwd(), "public", "previews"))
    .filter((file) => file.endsWith(".mp4"))
    .map((file) => file.replace(/\.mp4$/, ""))
);

const SOCIAL_DESCRIPTION =
  "A gallery of interactive UI and animation experiments by Matthew Blode, built with Next.js, React, Tailwind, Motion, and Three.js.";

// No `title` here. The layout's `title.default` is already ROOT_TITLE, and a
// string set on this segment would be run through the layout's template and
// come out saying "Experiments" twice.
export const metadata: Metadata = {
  description: `${SOCIAL_DESCRIPTION} Live demos and source.`,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    // Who made it, not what it is: the product is already in og:title. See
    // blode-co/apps/web/.claude/knowledge/zone-conventions.md Rule 9.
    siteName: "Matthew Blode",
    title: ROOT_TITLE,
    description: SOCIAL_DESCRIPTION,
    // This block replaces the root layout's openGraph rather than merging into
    // it, so the card has to be repeated here.
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@mattblode",
    title: ROOT_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: ["/twitter-image.png"],
  },
};

/**
 * One script holding one `@graph`. Separate blocks are disconnected nodes, and
 * disconnected nodes cannot be merged into one entity. See
 * blode-co/apps/web/.claude/knowledge/zone-conventions.md Rule 3.
 *
 * `CollectionPage` rather than bare `WebPage`: this page is nothing but a list
 * of the demos, and the `ItemList` below is that same list, so the type is
 * describing markup that is actually on the page.
 *
 * `#person`, `#website` and `#organization` are referenced by `@id` and never
 * redefined; a zone-scoped copy would publish a second Matthew Blode on this
 * domain.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": `${SITE_URL}/#webpage`,
      "@type": "CollectionPage",
      author: { "@id": "https://blode.co/#person" },
      breadcrumb: { "@id": `${SITE_URL}/#breadcrumb` },
      description: SOCIAL_DESCRIPTION,
      inLanguage: "en",
      isPartOf: { "@id": "https://blode.co/#website" },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: Object.entries(blocks)
          .filter(([, block]) => !block.hidden)
          .reverse()
          .map(([key, block], index) => ({
            "@type": "ListItem",
            item: `${SITE_URL}/${key}`,
            name: block.name,
            position: index + 1,
          })),
      },
      name: ROOT_TITLE,
      // `publisher` is the Organization and `author` is the Person: a Person
      // publisher shows up as a Search Console enhancement warning.
      publisher: { "@id": "https://blode.co/#organization" },
      url: SITE_URL,
    },
    {
      "@id": `${SITE_URL}/#breadcrumb`,
      "@type": "BreadcrumbList",
      // Word for word what <ZoneBreadcrumb> renders: Google reads a mismatch
      // between the two as a markup error.
      itemListElement: [
        {
          "@type": "ListItem",
          item: "https://blode.co",
          name: "Matthew Blode",
          position: 1,
        },
        {
          "@type": "ListItem",
          item: "https://blode.co/projects",
          name: "Projects",
          position: 2,
        },
        {
          "@type": "ListItem",
          item: SITE_URL,
          name: SITE_NAME,
          position: 3,
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Static object literal, no user input. */}
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />

      <div className="mx-auto max-w-4xl">
        <ZoneBreadcrumb product={SITE_NAME} />

        <header className="mt-6 mb-8 flex items-center justify-between gap-4">
          <h1 className="font-bold text-4xl">{SITE_NAME}</h1>

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
          <ul className="grid list-none gap-12 md:grid-cols-2">
            {Object.entries(blocks)
              .filter(([, block]) => !block.hidden)
              .reverse()
              .map(([key, block]) => (
                <li key={key}>
                  {/* The caption sits outside the frame, so the whole cell is
                      the link rather than the preview being one target and the
                      title another. */}
                  <Link
                    className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                    href={`/${key}`}
                  >
                    <BlockPreview hasClip={clips.has(key)} slug={key} />

                    {/* One 24px line each, both at the body size: the caption
                        is a label under a picture, not a heading over a card.
                        The underline on hover is the part that says link. */}
                    <h2 className="mt-4 font-normal text-base/6 underline-offset-2 group-hover:underline">
                      {block.name}
                    </h2>

                    <p className="line-clamp-1 text-base/6 text-muted-foreground">
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
