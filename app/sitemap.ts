import type { MetadataRoute } from "next";

import { blocks } from "@/lib/blocks";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const experiments = Object.entries(blocks)
    .filter(([, block]) => !block.hidden)
    .map(([id]) => ({
      url: `${SITE_URL}/${id}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...experiments,
  ];
}
