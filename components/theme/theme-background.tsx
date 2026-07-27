import type { CSSProperties } from "react";

import { MediaImage } from "@/components/ui/media-image";
import type { VenueThemeSchema } from "@/lib/types";

interface Props {
  content: Partial<VenueThemeSchema> | undefined;
  style?: CSSProperties;
}

export const ThemeBackground = ({ content, style }: Props) => {
  return (
    <MediaImage
      height={1000}
      media={content?.media}
      style={{
        height: "100lvh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
        ...style,
      }}
      width={1000}
    />
  );
};
