import { renderDemoCard } from "@/app/demo-og-card";
import { blocks } from "@/lib/blocks";

export {
  OG_CONTENT_TYPE as contentType,
  OG_SIZE as size,
} from "@/app/og-image-shared";

export const alt = blocks["multi-stroke-text"].name;

// This demo is hidden from the gallery, so the capture script never recorded a
// screenshot for it. See app/demo-og-card.tsx.
export default function Image() {
  return renderDemoCard("multi-stroke-text");
}
