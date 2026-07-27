"use client";

import { memo, useMemo } from "react";

import { getDefaultPageTheme } from "@/components/theme/theme.utils";
import { useGoogleFonts } from "@/hooks/use-google-fonts";
import type { VenueThemeSchema } from "@/lib/types";

interface Props {
  content: Partial<VenueThemeSchema> | undefined;
}

export const ThemeFont = memo(({ content: defaultContent }: Props): null => {
  const content = getDefaultPageTheme(defaultContent);

  const fontConfigs = useMemo(
    () => [
      {
        family: content?.headingFontFamily || "",
        weights: [content?.headingFontWeight || ""],
      },
      {
        family: content?.bodyFontFamily || "",
        weights: [
          content?.bodyFontWeight || "",
          content?.primaryButtonFontWeight || "",
          content?.secondaryButtonFontWeight || "",
        ],
      },
    ],
    [
      content?.bodyFontFamily,
      content?.bodyFontWeight,
      content?.headingFontFamily,
      content?.headingFontWeight,
      content?.primaryButtonFontWeight,
      content?.secondaryButtonFontWeight,
    ]
  );

  useGoogleFonts(fontConfigs);

  return null;
});

ThemeFont.displayName = "PageFont";
