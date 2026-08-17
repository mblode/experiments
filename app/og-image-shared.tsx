import { readFileSync } from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

/**
 * Layout helper for this zone's social card. The zone owns the route, the
 * brand colours, and the mark. This file only sets type in Glide and the
 * poster lockup (mark at the top, title on the baseline).
 *
 * It is not served by blode-co. `app/opengraph-image.tsx` in this repo is the
 * card; Next serves it at `/opengraph-image` on this zone's origin.
 *
 * Three constraints, all load-bearing:
 *
 * 1. **Satori cannot read woff2.** It throws `Unsupported OpenType signature
 *    wOF2`, a hard error rather than a silent fallback, so the variable woff2
 *    this app serves to browsers is unusable here. `lib/og-assets/` holds
 *    static TTF cuts instanced at wght 400 and 600 and subset to Latin-1 plus
 *    punctuation. Copy those files; do not regenerate them.
 * 2. **Satori parses neither `oklch()` nor CSS variables**, so every colour
 *    passed in must be a hand-synced sRGB literal.
 * 3. **This is a `.tsx` route and must stay one.** Next emits a *static*
 *    metadata image file (`opengraph-image.png`) with `basePath` already on
 *    it, and `metadataBase` carries the basePath too, so the two stack up
 *    into `/zone/zone/opengraph-image.png`. A generated route is not
 *    prefixed, so this form is the one that cannot double.
 */

export const OG_SIZE = { height: 630, width: 1200 } as const;
export const OG_CONTENT_TYPE = "image/png";

const ogAsset = (file: string) =>
  path.join(process.cwd(), "lib/og-assets", file);

const glideFonts = [
  {
    data: readFileSync(ogAsset("glide-600.ttf")),
    name: "Glide",
    style: "normal" as const,
    weight: 600 as const,
  },
];

export const renderZoneOgImage = ({
  background,
  color,
  logo,
  subtitle,
  subtitleColor,
  title,
}: {
  /** sRGB hex. Satori cannot read `oklch()` or CSS variables. */
  background: string;
  color: string;
  logo: ReactNode;
  /** A second line under the title. The demo cards put the description here. */
  subtitle?: string;
  subtitleColor?: string;
  title: string;
}) => {
  // A subtitle takes a line off the baseline, so the whole ladder steps down
  // one rung to leave room for it rather than crowding the mark.
  const sizes = subtitle ? [88, 72, 60] : [108, 88, 72];
  let titleSize = sizes[0];
  if (title.length > 28) {
    titleSize = sizes[1];
  }
  if (title.length > 44) {
    titleSize = sizes[2];
  }

  const content = (
    <div
      style={{
        background,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: 80,
        width: "100%",
      }}
    >
      <div style={{ display: "flex" }}>{logo}</div>

      {/* Satori has no block layout, so every wrapper is an explicit flex box. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            color,
            display: "flex",
            fontFamily: "Glide",
            fontSize: titleSize,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            maxWidth: 1040,
            textWrap: "balance",
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              color: subtitleColor ?? color,
              display: "flex",
              fontFamily: "Glide",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              maxWidth: 900,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  return new ImageResponse(content, { ...OG_SIZE, fonts: glideFonts });
};
