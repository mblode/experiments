"use client";
import { ShuffleIcon } from "blode-icons-react";
import { useCallback, useEffect, useState } from "react";

import { ThemeBackground } from "@/components/theme/theme-background";
import { ThemeFont } from "@/components/theme/theme-font";
import { ThemeStyle } from "@/components/theme/theme-style";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { themes } from "@/lib/themes";
import type { VenueThemeSchema } from "@/lib/types";

import { CardBlock } from "./card-block";

const CARDS = [1, 2, 3, 4, 5, 6];

export default function Page() {
  // The index is the only state; the parsed theme is derived from it, and it
  // starts null so the server and the first client render agree before the
  // random pick lands.
  const [themeIndex, setThemeIndex] = useState<number | null>(null);

  const shuffle = useCallback(() => {
    setThemeIndex((previous) => {
      let next = previous;
      while (next === previous) {
        next = Math.floor(Math.random() * themes.length);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    shuffle();
  }, [shuffle]);

  const themeContent =
    themeIndex === null
      ? undefined
      : (JSON.parse(themes[themeIndex].content) as Partial<VenueThemeSchema>);

  return (
    <>
      <div className="bg-background p-8" data-chrome>
        <div className="mx-auto max-w-4xl">
          <Header id="shuffle-theme" />
          <Button className="gap-2" onClick={shuffle}>
            <ShuffleIcon aria-hidden="true" className="size-4" />
            Shuffle theme
          </Button>
          <p aria-live="polite" className="sr-only">
            {themeIndex === null
              ? ""
              : `Theme ${themeIndex + 1} of ${themes.length}`}
          </p>
        </div>
      </div>

      <ThemeBackground content={themeContent} />
      <ThemeStyle content={themeContent} />
      <ThemeFont content={themeContent} />

      <div className="relative flex h-full flex-col">
        <div className="relative z-1 w-full font-page-body font-page-body-weight text-page-text">
          <div className="relative z-30 mx-auto w-full max-w-[480px]">
            <div className="flex flex-col gap-4 p-4">
              {CARDS.map((id) => (
                <CardBlock id={id} key={id} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
