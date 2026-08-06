"use client";
import Image from "next/image";
import { useState } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { cn } from "@/lib/utils";

/**
 * Concentric rings, outermost first, sized for the 400px frame. Five divs
 * rather than an image so the label stays crisp at any size — including the
 * 0.68 scale the record state renders it at. Each ring is opaque and alternates
 * tone, so the label reads the same way in both colour schemes instead of
 * stacking translucent layers that only separate on a light background.
 */
const LABEL_RINGS = [
  "size-24 bg-background",
  "size-[94px] bg-muted-foreground",
  "size-20 bg-muted",
  "size-14 bg-muted-foreground",
  "size-12 bg-muted",
];

export const AlbumBlock = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  // A record turning in a tab nobody is looking at is a composited frame every
  // 16ms for no one.
  const { isIntersecting, ref } = useIntersectionObserver({ threshold: 0 });

  return (
    <div
      className="relative aspect-square w-full max-w-[400px] overflow-hidden rounded-[32px] border border-border bg-muted shadow-lg"
      ref={ref}
    >
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 px-6 text-center">
        <h2 className="font-semibold text-base text-foreground tracking-tight">
          Bridge Over Troubled Water
        </h2>
        <p className="text-muted-foreground text-sm">Simon &amp; Garfunkel</p>
      </div>

      {/*
       * The button is the artwork itself, so the hit area is always exactly the
       * thing you meant to click — the circle in the record state, the full
       * cover in the other. Focus draws inside (`-outline-offset`) because the
       * frame clips anything outside it once the cover fills the square.
       */}
      <button
        aria-label={isPlaying ? "Show the record" : "Show the album cover"}
        aria-pressed={isPlaying}
        className={cn(
          // Tailwind v4 emits `translate` and `scale` as their own properties,
          // not as `transform`, so both have to be named here.
          "absolute inset-0 z-10 overflow-hidden transition-[translate,scale,border-radius] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:-outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
          isPlaying
            ? "translate-y-0 scale-100 rounded-none"
            : // Half the 400px box, not `rounded-full`: Tailwind v4 resolves
              // that to `calc(infinity * 1px)`, which cannot interpolate, so
              // the corners would snap instead of opening.
              "-translate-y-[10%] scale-[0.68] rounded-[200px]"
        )}
        onClick={() => setIsPlaying(!isPlaying)}
        type="button"
      >
        <div
          className={cn("absolute inset-0", !isPlaying && "album-record-spin")}
          style={{
            animationPlayState: isIntersecting ? "running" : "paused",
          }}
        >
          <Image
            alt="Bridge Over Troubled Water by Simon & Garfunkel"
            className="object-cover"
            fill
            sizes="(max-width: 400px) 100vw, 400px"
            src="/experiments/album.png"
          />
        </div>

        <div
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex items-center justify-center transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isPlaying && "opacity-0"
          )}
        >
          {LABEL_RINGS.map((ring) => (
            <div className={cn("absolute rounded-full", ring)} key={ring} />
          ))}
        </div>
      </button>
    </div>
  );
};
