import { renderZoneOgImage } from "@/app/og-image-shared";
import { ROOT_TITLE } from "@/lib/seo";

export {
  OG_CONTENT_TYPE as contentType,
  OG_SIZE as size,
} from "@/app/og-image-shared";

export { ROOT_TITLE as alt } from "@/lib/seo";

/**
 * The house card (Rule 12), replacing the static `opengraph-image.png`.
 *
 * Generated rather than static on purpose: Next emits a static metadata image
 * file with `basePath` already on it, and `metadataBase` carries the basePath
 * too, so the two stacked into `/experiments/experiments/opengraph-image.png`.
 * A generated route is not prefixed. Adopting the card removes that whole bug
 * class from this repo rather than just the one URL.
 *
 * This card also covers every demo that has no recorded clip of its own: the
 * capture script only visits the gallery's visible demos, so the four hidden
 * ones inherit this rather than pointing at an `og/<id>.png` that was never
 * written.
 */
export default function OpengraphImage() {
  return renderZoneOgImage({
    badge: "EXPERIMENTS",
    eyebrow: "blode.co/experiments",
    subtitle: "Interactions, 3D scenes and components, built to a finish.",
    title: ROOT_TITLE,
  });
}
