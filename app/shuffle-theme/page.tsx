"use client";
import { useCallback, useEffect, useState } from "react";

import { ThemeBackground } from "@/components/theme/theme-background";
import { ThemeFont } from "@/components/theme/theme-font";
import { ThemeStyle } from "@/components/theme/theme-style";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { themes } from "@/lib/themes";
import type { VenueThemeSchema } from "@/lib/types";

import { CardBlock } from "./card-block";

export default function Page() {
  const [themeContent, setThemeContent] = useState<
    Partial<VenueThemeSchema> | undefined
  >(undefined);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * themes.length);
    const randomTheme = themes[randomIndex];
    setThemeContent(
      JSON.parse(randomTheme?.content) as Partial<VenueThemeSchema>
    );
  }, []);

  const handleShuffleClick = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * themes.length);
    const randomTheme = themes[randomIndex];
    setThemeContent(
      JSON.parse(randomTheme?.content) as Partial<VenueThemeSchema>
    );
  }, []);

  return (
    <>
      <div className="bg-background p-8" data-chrome>
        <div className="mx-auto max-w-4xl">
          <Header id="shuffle-theme" />
          <Button onClick={handleShuffleClick}>Shuffle theme</Button>
        </div>
      </div>

      <ThemeBackground content={themeContent} />
      <ThemeStyle content={themeContent} />
      <ThemeFont content={themeContent} />

      <div className="relative flex h-full flex-col">
        <div className="relative z-1 w-full font-page-body font-page-body-weight text-page-text">
          <div className="relative z-30 mx-auto w-full max-w-[480px]">
            <div className="flex flex-col gap-4 p-4">
              {[
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 },
                { id: 6 },
              ].map((item) => (
                <CardBlock item={item} key={item.id} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
