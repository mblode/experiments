import type { MetadataRoute } from "next";

import { blocks } from "@/lib/blocks";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const experiments = Object.entries(blocks)
    .filter(([, block]) => !block.hidden)
    .map(([id]) => ({
      url: `${SITE_URL}/${id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...experiments,
  ];
}
