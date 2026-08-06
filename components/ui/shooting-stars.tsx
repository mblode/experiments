"use client";
import type React from "react";
import { useEffect, useId, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";

import { cn } from "@/lib/utils";

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  distance: number;
}

interface ShootingStarsProps {
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starColor?: string;
  trailColor?: string;
  starWidth?: number;
  starHeight?: number;
  className?: string;
}

/** Speeds are authored per 60fps frame, so a 120Hz display has to be scaled
 *  down to match rather than running the stars at double speed. */
const FRAME_MS = 1000 / 60;
/** A backgrounded tab hands back one enormous delta; cap it so the star does
 *  not teleport across the screen on the first frame after it resumes. */
const MAX_CATCH_UP_FRAMES = 3;
/** How far a star travels before its trail has doubled in length. */
const TRAIL_GROWTH = 100;
/** Slack around the viewport before a star counts as gone. */
const EXIT_MARGIN = 20;

const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4);

  switch (side) {
    case 0:
      return { x: Math.random() * window.innerWidth, y: 0, angle: 45 };
    case 1:
      return {
        x: window.innerWidth,
        y: Math.random() * window.innerHeight,
        angle: 135,
      };
    case 2:
      return {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight,
        angle: 225,
      };
    default:
      return { x: 0, y: Math.random() * window.innerHeight, angle: 315 };
  }
};

/**
 * One shooting star crossing the viewport at a time, on a loop.
 *
 * The star is moved by writing a transform onto a single `<rect>` from inside
 * one requestAnimationFrame loop, rather than by re-rendering React every
 * frame. It also means the trail lengthens through `scale` instead of the
 * `width` attribute, so nothing re-lays-out as it flies.
 *
 * Purely decorative, so the loop does not run at all under reduced motion, and
 * stops whenever the element scrolls out of view or the tab goes to the
 * background.
 */
export const ShootingStars: React.FC<ShootingStarsProps> = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#fff",
  trailColor = "#fff",
  starWidth = 10,
  starHeight = 1,
  className,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  // Two instances on a page would otherwise both point at the same `#gradient`
  const gradientId = useId();

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false,
  });

  useEffect(() => {
    const svg = svgRef.current;
    const rect = rectRef.current;
    if (reducedMotion || !(svg && rect)) {
      return;
    }

    let frame = 0;
    let running = false;
    let onScreen = true;
    let star: ShootingStar | null = null;
    let nextSpawnAt = 0;
    let previous = 0;

    const hideStar = () => rect.setAttribute("opacity", "0");

    const retire = (now: number) => {
      star = null;
      hideStar();
      nextSpawnAt = now + minDelay + Math.random() * (maxDelay - minDelay);
    };

    const step = (now: number) => {
      frame = requestAnimationFrame(step);

      const frames = previous
        ? Math.min((now - previous) / FRAME_MS, MAX_CATCH_UP_FRAMES)
        : 0;
      previous = now;

      if (!star) {
        if (now >= nextSpawnAt) {
          const { x, y, angle } = getRandomStartPoint();
          star = {
            x,
            y,
            angle,
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            distance: 0,
          };
        }
        return;
      }

      const current = star;
      const radians = (current.angle * Math.PI) / 180;
      const travelled = current.speed * frames;
      current.x += travelled * Math.cos(radians);
      current.y += travelled * Math.sin(radians);
      current.distance += travelled;

      if (
        current.x < -EXIT_MARGIN ||
        current.x > window.innerWidth + EXIT_MARGIN ||
        current.y < -EXIT_MARGIN ||
        current.y > window.innerHeight + EXIT_MARGIN
      ) {
        retire(now);
        return;
      }

      const scale = 1 + current.distance / TRAIL_GROWTH;
      rect.setAttribute("opacity", "1");
      rect.setAttribute(
        "transform",
        `translate(${current.x} ${current.y}) rotate(${current.angle}) scale(${scale} 1)`
      );
    };

    const start = () => {
      if (running) {
        return;
      }
      running = true;
      previous = 0;
      frame = requestAnimationFrame(step);
    };

    const stop = () => {
      if (!running) {
        return;
      }
      running = false;
      cancelAnimationFrame(frame);
      star = null;
      hideStar();
    };

    const sync = () => {
      if (onScreen && document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(svg);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      stop();
    };
  }, [reducedMotion, minSpeed, maxSpeed, minDelay, maxDelay]);

  return (
    <svg
      aria-hidden
      className={cn("absolute inset-0 h-full w-full", className)}
      ref={svgRef}
    >
      {/* Anchored on its own centre so the flight transform is just a
          translate, a rotate and a stretch — no origin arithmetic. */}
      <rect
        fill={`url(#${gradientId})`}
        height={starHeight}
        opacity="0"
        ref={rectRef}
        width={starWidth}
        x={-starWidth / 2}
        y={-starHeight / 2}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop
            offset="100%"
            style={{ stopColor: starColor, stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};
