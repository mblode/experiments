"use client";

import { CheckIcon, ChevronsUpDownIcon } from "blode-icons-react";
import mergeRefs from "merge-refs";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";

const texts = [
  "Line graph",
  "Motion choreography",
  "Responsive interfaces",
  "Preface",
];

const LETTER_STAGGER = 0.015;
const CYCLE_MS = 2000;
const DIM_DURATION_MS = 2000;

/**
 * Hook to cycle through texts automatically. The interval only runs while the
 * pill is on screen, so four timers are not ticking on a page nobody is looking
 * at.
 */
function useTextLoop(): [string, React.RefObject<HTMLElement | null>] {
  const [active, setActive] = useState(texts[0]);
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (!isInView) {
      return;
    }
    const interval = setInterval(() => {
      setActive((currentActive) => {
        const index = texts.indexOf(currentActive);
        const nextIndex = (index + 1) % texts.length;
        return texts[nextIndex];
      });
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [isInView]);

  return [active, ref];
}

/**
 * StaggeredFadeBlock with dynamic width measurement
 */
export const StaggeredFadeBlock = () => {
  const [measureRef, bounds] = useMeasure();
  const [activeText, loopRef] = useTextLoop();
  const [isDimmed, setIsDimmed] = useState(false);
  const reduced = useReducedMotion();
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (dimTimer.current) {
        clearTimeout(dimTimer.current);
      }
    },
    []
  );

  const handleDim = () => {
    if (dimTimer.current) {
      clearTimeout(dimTimer.current);
    }
    setIsDimmed(true);
    dimTimer.current = setTimeout(() => setIsDimmed(false), DIM_DURATION_MS);
  };

  const enterSpring = {
    type: "spring" as const,
    stiffness: 350,
    damping: 55,
  };

  return (
    <div className="relative">
      <div className="relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-border bg-card px-4 py-2 shadow-sm">
        {/* Container springs to the measured width of the next phrase, so it
            never snaps to the new size before the letters arrive. */}
        <motion.div
          animate={{ width: bounds.width > 0 ? bounds.width : "auto" }}
          className="flex items-center gap-3"
          transition={reduced ? { duration: 0 } : enterSpring}
        >
          {/* Content that gets measured */}
          <div
            className="flex w-fit items-center gap-3"
            ref={mergeRefs(measureRef, loopRef) as React.Ref<HTMLDivElement>}
          >
            {/* Static checkmark */}
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckIcon aria-hidden="true" className="size-4" />
            </div>

            {/* Animated text. Split into per-letter spans, so the readable copy
                is exposed once rather than one character at a time. */}
            <div className="font-medium text-foreground text-sm">
              <span className="sr-only">{activeText}</span>
              <AnimatePresence initial={false} mode="popLayout">
                <span
                  aria-hidden="true"
                  className="inline-flex"
                  key={activeText}
                >
                  {activeText.split("").map((letter, index) => (
                    <motion.span
                      animate={{
                        opacity: isDimmed ? 0.7 : 1,
                        filter: isDimmed ? "blur(0.5px)" : "blur(0px)",
                        transition: reduced
                          ? { duration: 0 }
                          : {
                              ...enterSpring,
                              delay: index * LETTER_STAGGER,
                            },
                      }}
                      className="inline-block"
                      // Faster and blurrier than the entrance: the outgoing word
                      // has to clear before the incoming one is legible.
                      exit={{
                        opacity: 0,
                        filter: "blur(2px)",
                        transition: reduced
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 500,
                              damping: 55,
                            },
                      }}
                      initial={{
                        opacity: 0,
                        filter: "blur(2px)",
                      }}
                      key={index + letter + activeText}
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                  ))}
                </span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Email section */}
        <div className="z-10 flex shrink-0 items-center gap-1 text-muted-foreground text-sm">
          <span className="select-none">yo@blode.co</span>
          {/* Kept mounted rather than unmounted while dimmed, so activating it
              does not throw focus back to the document. */}
          <button
            aria-label="Preview the dimmed state"
            aria-pressed={isDimmed}
            className="rounded-md p-0.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            onClick={handleDim}
            type="button"
          >
            <ChevronsUpDownIcon aria-hidden="true" className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaggeredFadeBlock;
