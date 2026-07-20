import type { Metadata } from "next";

import { blocks } from "@/lib/blocks";

export const SITE_URL = "https://experiments.blode.co";
export const SITE_NAME = "Matt's experiments";

const DESCRIPTION_MAX = 158;
const DESCRIPTION_SUFFIX =
  " An interactive UI experiment by Matthew Blode. Live demo and source at experiments.blode.co.";

const clampDescription = (value: string): string => {
  if (value.length <= DESCRIPTION_MAX) {
    return value;
  }
  const truncated = value.slice(0, DESCRIPTION_MAX);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : DESCRIPTION_MAX).trimEnd()}…`;
};

const buildDescription = (description: string): string => {
  const base = description.endsWith(".") ? description : `${description}.`;
  return clampDescription(`${base}${DESCRIPTION_SUFFIX}`);
};

export const getExperimentMetadata = (id: keyof typeof blocks): Metadata => {
  const block = blocks[id];
  const url = `${SITE_URL}/${id}`;
  const title = `${block.name} · ${SITE_NAME}`;
  const description = buildDescription(block.description);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: `/og/${id}.png`, width: 2400, height: 1260, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/og/${id}.png`],
    },
  };
};
