"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useIntersectionObserver, useMediaQuery } from "usehooks-ts";

import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  /** False when no clip has been recorded yet — the poster still renders. */
  hasClip: boolean;
  className?: string;
}

/**
 * The looping demo clip on a gallery card. The poster is the clip's own first
 * frame, so the swap is invisible; the video is only fetched once the card is
 * near the viewport, and only ever plays while it is on screen.
 */
export const BlockPreview = ({ slug, hasClip, className }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // A clip that starts itself is motion the reader did not ask for, so reduced
  // motion gets the poster and no video request at all.
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false,
  });
  const { isIntersecting, ref } = useIntersectionObserver({
    rootMargin: "200px",
    threshold: 0.2,
  });

  const play = hasClip && !reduced && isIntersecting;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (!play) {
      video.pause();
      return;
    }
    void (async () => {
      try {
        await video.play();
      } catch {
        // Rejects when the element detaches mid-scroll; nothing to recover
      }
    })();
  }, [play]);

  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-xl border bg-card",
        className
      )}
      ref={ref}
    >
      <Image
        alt=""
        className="object-cover"
        fill
        // Two columns inside a max-w-4xl page, one column below `md`
        sizes="(min-width: 768px) 440px, 100vw"
        src={`/experiments/previews/${slug}.jpg`}
      />

      {/* Rendered only once the card has been near the viewport, so the mp4 is
          never requested for cards nobody scrolled to. */}
      {hasClip && !reduced && isIntersecting && (
        <video
          aria-hidden
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-200 ease-out",
            ready ? "opacity-100" : "opacity-0"
          )}
          loop
          muted
          onCanPlay={() => setReady(true)}
          playsInline
          preload="none"
          ref={videoRef}
          src={`/experiments/previews/${slug}.mp4`}
        />
      )}
    </div>
  );
};
