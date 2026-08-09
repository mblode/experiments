import { renderZoneOgImage } from "@/app/og-image-shared";
import { blocks } from "@/lib/blocks";

/**
 * The card for a demo that has no recorded screenshot.
 *
 * `npm run og:generate` drives Playwright over the gallery's *visible* demos,
 * so a `hidden` one never gets an `og/<id>.png` and the metadata pointed at a
 * 404. Three of the four are indexable, so they are genuinely shareable.
 *
 * A colocated `opengraph-image.tsx` is what makes this work rather than a
 * fallback in `getExperimentMetadata`: a file-convention image wins over a
 * declared `openGraph.images` on the same segment, but an inherited one does
 * not survive a child segment declaring its own `openGraph` at all.
 */
export const renderDemoCard = (id: keyof typeof blocks) =>
  renderZoneOgImage({
    badge: "EXPERIMENTS",
    eyebrow: `blode.co/experiments/${id}`,
    subtitle: blocks[id].description,
    title: blocks[id].name,
  });
