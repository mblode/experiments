"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { Header } from "@/components/ui/header";
import { ShootingStars } from "@/components/ui/shooting-stars";

/**
 * The four hand-picked stops the whole page interpolates between. Scroll
 * progress across the document is the only input, so scrolling back up runs the
 * day in reverse.
 */
const STOPS = [0, 0.2, 0.8, 1];

/**
 * The section labels have to stay legible against a sky that runs from pale
 * dusk pink to near-black, and no single tone clears 3:1 at both ends. So the
 * label flips from ink to paper in one short band at 0.90–0.91. That is where
 * the sky has darkened just enough that *both* tones clear 3:1 through the
 * switch — a slow fade would spend the middle of it as grey type on a grey sky,
 * which is the one thing that fails everywhere.
 */
const LABEL_STOPS = [0, 0.2, 0.8, 0.9, 0.91, 1];
const LABEL_INK = "rgb(21, 25, 29)";
const LABEL_PAPER = "rgb(244, 246, 248)";

const SECTIONS = ["Sunrise", "Day", "Sunset", "Night"];

export const SkyBlock = () => {
  const { scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotion();

  // Transform scroll progress to gradient values for background
  const bgGradient = useTransform(scrollYProgress, STOPS, [
    "linear-gradient(rgb(0, 144, 245), rgb(230, 214, 221), rgb(234, 176, 69))",
    "linear-gradient(rgb(30, 84, 200), rgb(91, 143, 230), rgb(189, 216, 254))",
    "linear-gradient(rgb(46, 70, 112), rgb(205, 177, 175), rgb(204, 126, 101))",
    "linear-gradient(rgb(6, 22, 31), rgb(0, 73, 104), rgb(75, 148, 161))",
  ]);

  // Transform scroll progress for cloud gradients
  const cloudsGradient = useTransform(scrollYProgress, STOPS, [
    "linear-gradient(rgb(205, 206, 208), rgb(255, 231, 230))",
    "linear-gradient(rgb(255, 255, 255), rgb(248, 248, 255))",
    "linear-gradient(rgb(254, 130, 143), rgb(230, 150, 130))",
    "linear-gradient(rgb(33, 62, 80), rgb(49, 84, 106))",
  ]);

  const labelColor = useTransform(scrollYProgress, LABEL_STOPS, [
    LABEL_INK,
    LABEL_INK,
    LABEL_INK,
    LABEL_INK,
    LABEL_PAPER,
    LABEL_PAPER,
  ]);

  // Stars animations
  const starsOpacity = useTransform(
    scrollYProgress,
    STOPS,
    [0, 0, 0.933_345, 1]
  );
  // The drift is decoration on top of the fade, so reduced motion keeps the
  // stars appearing and drops only the parallax.
  const starsY = useTransform(
    scrollYProgress,
    STOPS,
    [-50, -36.0824, -13.9901, -4.087_33]
  );

  return (
    <>
      <div className="relative z-10 bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Header className="mb-0!" id="sky" />
          <a
            className="link"
            href="https://blode.co"
            rel="noreferrer"
            target="_blank"
          >
            See a real-world example
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>

      <div className="relative z-10 bg-noise">
        {SECTIONS.map((label) => (
          <section
            className="relative flex min-h-[100lvh] items-center justify-center"
            key={label}
          >
            <motion.h2
              className="text-6xl md:text-8xl"
              style={{ color: labelColor }}
            >
              {label}
            </motion.h2>
          </section>
        ))}
      </div>

      {/* Fixed sky. Everything below here is decoration for the sections above,
          so none of it takes pointer events or reaches the accessibility tree. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: bgGradient }}
      />

      <div aria-hidden className="pointer-events-none fixed inset-0">
        <ShootingStars />

        {/* One cloud PNG used as a mask over a second gradient, so the clouds
            recolour with the sky instead of needing four cloud images. */}
        <motion.div
          className="absolute inset-0"
          style={{
            mask: 'url("/experiments/footer-clouds.png") center/cover no-repeat',
            WebkitMask:
              'url("/experiments/footer-clouds.png") center/cover no-repeat',
            background: cloudsGradient,
          }}
        />

        <motion.div
          className="absolute inset-0 -bottom-120 bg-repeat"
          style={{
            backgroundImage: 'url("/experiments/footer-stars.png")',
            opacity: starsOpacity,
            y: reducedMotion ? 0 : starsY,
          }}
        />
      </div>
    </>
  );
};
