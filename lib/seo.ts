import type { Metadata } from "next";

import { blocks } from "@/lib/blocks";

export const SITE_URL = "https://blode.co/experiments";

/**
 * Just "Experiments". The `Blode X` prefix belongs to the house kit (Blode UI,
 * Blode Icons, Blode.md); a gallery of toys is not part of it, and the byline
 * is carried by `og:site_name` and the breadcrumb instead.
 */
export const SITE_NAME = "Experiments";

/** Shared by the layout's `title.default` and the root page's share card. */
export const ROOT_TITLE = `${SITE_NAME}: interactive UI and animation demos`;

const DESCRIPTION_MAX = 158;
const DESCRIPTION_SUFFIX =
  " An interactive UI experiment by Matthew Blode. Live demo and source at blode.co/experiments.";

const clampDescription = (value: string): string => {
  if (value.length <= DESCRIPTION_MAX) {
    return value;
  }
  const truncated = value.slice(0, DESCRIPTION_MAX);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : DESCRIPTION_MAX).trimEnd()}…`;
};

const asSentence = (description: string): string =>
  description.endsWith(".") ? description : `${description}.`;

export const getExperimentMetadata = (id: keyof typeof blocks): Metadata => {
  const block = blocks[id];
  const url = `${SITE_URL}/${id}`;
  // The layout's `title.template` appends the site name to `<title>`, so
  // spelling it out here too would print it twice. Social cards replace the
  // template rather than composing with it, hence the second string.
  const title = block.name;
  const socialTitle = `${block.name} | ${SITE_NAME}`;
  // Search results have room for the boilerplate suffix; social cards don't —
  // they truncate near 125 chars and already show the domain and site name.
  const description = clampDescription(
    `${asSentence(block.description)}${DESCRIPTION_SUFFIX}`
  );
  const socialDescription = asSentence(block.description);

  // `og:generate` only visits the gallery's visible demos, so a hidden one has
  // no `og/<id>.png` and pointing at it served a 404 card. Those four have a
  // colocated `opengraph-image.tsx` instead (see app/demo-og-card.tsx), and
  // this key has to be *absent* for the file convention to win: `images:
  // undefined` is still an override, and suppresses it to no card at all.
  //
  // No `/experiments` prefix on the ones that do exist: `metadataBase` already
  // carries the basePath, and Next joins the two rather than replacing.
  const cardImage = block.hidden
    ? {}
    : {
        images: [
          { alt: socialTitle, height: 1260, url: `/og/${id}.png`, width: 2400 },
        ],
      };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      // `og:site_name` says who made it, not what the product is: the product
      // is already in `og:title`. See
      // blode-co/apps/web/.claude/knowledge/zone-conventions.md Rule 9.
      siteName: "Matthew Blode",
      title: socialTitle,
      description: socialDescription,
      ...cardImage,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@mattblode",
      title: socialTitle,
      description: socialDescription,
      ...cardImage,
    },
  };
};
