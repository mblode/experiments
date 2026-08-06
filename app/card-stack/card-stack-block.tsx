"use client";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const CARD_WIDTH = 170;
const SPREAD_GAP = 190;

// Sharp ease-out (ease-out-quart). Long enough that the three cards read as one
// pile unfolding rather than three separate slides.
const EASE_OUT: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

const cardClassName =
  "absolute aspect-[9/16] w-full max-w-[170px] rounded-2xl shadow-md transition-shadow duration-200 group-hover:shadow-lg group-focus-visible:shadow-lg";

export const CardStackBlock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const reduced = useReducedMotion();

  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Measured in the ref callback, which commits before paint, so the stack is
  // never painted at the unmeasured offset and then jumped sideways.
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      setContainerWidth(node.offsetWidth);
    }
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // The stacked cards have to sit in the middle of a container whose width is
  // not known until it renders, so the offset comes from the DOM.
  const centerOffset = (containerWidth - CARD_WIDTH) / 2;

  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.6, ease: EASE_OUT };

  return (
    <div className="max-w-[1000px] overflow-x-auto rounded-3xl border border-border bg-card p-8">
      <div className="relative h-[400px] w-full" ref={measureRef}>
        <button
          aria-label="Spread the card stack"
          aria-pressed={isOpen}
          className="group relative flex h-full w-full cursor-pointer items-center justify-start rounded-3xl border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {/* Each card keeps its z-index through the whole transition, so the
              spread never reads as a reshuffle. */}
          <motion.span
            animate={{
              x: isOpen ? 0 : centerOffset - 60,
              rotate: isOpen ? 0 : -6,
              scale: isOpen ? 1 : 0.92,
            }}
            className={`${cardClassName} bg-chart-1`}
            initial={false}
            style={{ zIndex: 1 }}
            transition={transition}
          />

          <motion.span
            animate={{
              x: isOpen ? SPREAD_GAP : centerOffset + 60,
              rotate: isOpen ? 0 : 6,
              scale: isOpen ? 1 : 0.92,
            }}
            className={`${cardClassName} bg-chart-2`}
            initial={false}
            style={{ zIndex: 2 }}
            transition={transition}
          />

          <motion.span
            animate={{
              x: isOpen ? SPREAD_GAP * 2 : centerOffset,
              rotate: 0,
              scale: 1,
            }}
            className={`${cardClassName} bg-chart-3`}
            initial={false}
            style={{ zIndex: 3 }}
            transition={transition}
          />
        </button>
      </div>
    </div>
  );
};
