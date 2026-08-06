import type { Metadata } from "next";

import { blocks } from "@/lib/blocks";

export const SITE_URL = "https://blode.co/experiments";
export const SITE_NAME = "Blode Experiments";

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
  const title = `${block.name} · ${SITE_NAME}`;
  // Search results have room for the boilerplate suffix; social cards don't —
  // they truncate near 125 chars and already show the domain and site name.
  const description = clampDescription(
    `${asSentence(block.description)}${DESCRIPTION_SUFFIX}`
  );
  const socialDescription = asSentence(block.description);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title,
      description: socialDescription,
      images: [
        {
          url: `/experiments/og/${id}.png`,
          width: 2400,
          height: 1260,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: socialDescription,
      images: [`/experiments/og/${id}.png`],
    },
  };
};
