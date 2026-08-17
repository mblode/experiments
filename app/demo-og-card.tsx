import { renderZoneOgImage } from "@/app/og-image-shared";
import { OgLogo } from "@/app/og-logo";
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
    background: "#0a0a0a",
    color: "#ffffff",
    logo: <OgLogo />,
    subtitle: blocks[id].description,
    // Half-tone white rather than a second hex, so the pair stays right if the
    // background ever moves.
    subtitleColor: "rgba(255,255,255,0.64)",
    title: blocks[id].name,
  });
