import type { CSSProperties } from "react";

import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { DitherBlock } from "./dither-block";

export const metadata = getExperimentMetadata("dither");

/**
 * The page is one of the two colours the dither pass outputs, which leaves the
 * header prose sitting on a dark olive it was never toned for: the light-theme
 * `--muted-foreground` lands at about 3.6:1 against it. These re-point the few
 * tokens the header reads at values that clear 4.5:1 without introducing a
 * third colour — they are white held back, not a new hue.
 */
const DARK_SURFACE_TOKENS = {
  "--muted-foreground": "oklch(0.78 0 0)",
  "--border": "oklch(1 0 0 / 20%)",
  "--ring": "oklch(0.9 0 0)",
} as CSSProperties;

export default function Page() {
  return (
    <div
      className="relative min-h-screen bg-[#333319] text-white"
      style={DARK_SURFACE_TOKENS}
    >
      <div className="relative z-10 mx-auto max-w-4xl px-8 pt-8">
        <Header id="dither" />
      </div>

      {/* Fixed, not absolute: the HUD crosshair is centred on the viewport, so
          a canvas sized to a page that scrolls past one screen would put the
          scene's centre somewhere the crosshair is not. The header keeps its
          place in reading order above it and stays on top on `z-10`. */}
      <div className="fixed inset-0">
        <DitherBlock />
      </div>
    </div>
  );
}
