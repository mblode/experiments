"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

/**
 * The overlays live in `public/shadows`, numbered 001-100 with 067 absent, so
 * the pool is built rather than a plain 1..100 roll that would 404 once in a
 * hundred throws.
 */
const SHADOW_IDS = Array.from({ length: 100 }, (_, index) => index + 1).filter(
  (id) => id !== 67
);

const DOT_POSITIONS: Record<number, string[]> = {
  1: ["center"],
  2: ["top-left", "bottom-right"],
  3: ["top-left", "center", "bottom-right"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: [
    "top-left",
    "top-right",
    "middle-left",
    "middle-right",
    "bottom-left",
    "bottom-right",
  ],
};

const DOT_CLASSES: Record<string, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "middle-left": "top-1/2 left-2 -translate-y-1/2",
  "middle-right": "top-1/2 right-2 -translate-y-1/2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

/** Pick a new entry so every roll visibly changes something. */
function rerollFrom<T>(pool: T[], current: T): T {
  let next = current;
  while (next === current) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next;
}

export const DocumentShadowBlock = () => {
  const [diceValue, setDiceValue] = useState(5);
  const [shadowId, setShadowId] = useState(1);
  const [degree, setDegree] = useState(0);
  const reduced = useReducedMotion() ?? false;

  const rollDice = () => {
    setDegree((previous) => previous + 90);
    setDiceValue((previous) => rerollFrom([1, 2, 3, 4, 5, 6], previous));
    setShadowId((previous) => rerollFrom(SHADOW_IDS, previous));
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#D1D7DC] px-6 py-12">
      {/* Ambient shadow cast over the whole scene */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            animate={{ opacity: 0.2 }}
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={shadowId}
            transition={{ duration: reduced ? 0 : 0.45, ease: "linear" }}
          >
            <Image
              alt=""
              className="object-cover mix-blend-multiply"
              fill
              priority
              sizes="100vw"
              src={`/experiments/shadows/${String(shadowId).padStart(3, "0")}.png`}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Document Card */}
      <div
        className="relative z-10 aspect-[1/1.414] w-full max-w-2xl bg-[#E7EAED] p-8 font-serif sm:p-12"
        style={{
          boxShadow:
            "var(--shadow-elevation-medium), inset -2px 2px 4px rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Dice Button */}
        <button
          className="group -top-4 -right-4 absolute z-[100] flex size-24 cursor-pointer items-center justify-center rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 transition-transform duration-150 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-gray-900 focus-visible:outline-offset-4 motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={rollDice}
          style={{ boxShadow: "var(--shadow-elevation-high)" }}
          type="button"
        >
          <span className="sr-only">Roll the dice for a new shadow</span>

          <div className="relative size-12">
            <motion.div
              animate={{ rotate: reduced ? 0 : degree }}
              aria-hidden="true"
              className="relative z-10 size-12 rounded-xl bg-white"
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              {DOT_POSITIONS[diceValue].map((position) => (
                <span
                  className={`absolute size-2 rounded-full bg-gray-900 ${DOT_CLASSES[position]}`}
                  key={position}
                />
              ))}
            </motion.div>

            <div className="absolute inset-0 size-12 rounded-xl bg-white opacity-0 blur-lg transition-opacity duration-200 ease group-hover:opacity-30" />
          </div>
        </button>

        <p aria-live="polite" className="sr-only">
          Rolled {diceValue}
        </p>

        {/* Sphere with Shadow */}
        <div className="mb-10 flex items-center gap-4">
          <div className="relative size-16">
            <div className="absolute inset-0 z-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-800" />
            <div className="absolute bottom-[-2px] left-3 h-6 w-20 rounded-[50%] bg-gray-900/35 blur-[6px]" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-balance font-bold text-3xl text-gray-900 leading-tight tracking-tight sm:text-4xl">
          The brightest flame casts the darkest shadow
        </h2>

        <p className="mt-6 text-gray-700 leading-relaxed">
          Shadows are a natural and often overlooked part of our daily
          experience. From the long silhouettes cast by trees during sunset to
          the fleeting forms that follow our footsteps, shadows are more than
          just dark shapes—they are the result of light interacting with
          objects. This document explores the nature of shadows, their
          formation, cultural significance, and their applications in science
          and art.
        </p>

        <p className="mt-4 text-gray-700 leading-relaxed">
          A shadow is a dark area or shape produced by an object blocking the
          path of light. When a light source encounters an opaque object, the
          object prevents some of the light from passing through, casting a
          shadow on the surface behind it. The shape and sharpness of a shadow
          depend on several factors:
        </p>

        <p className="mt-6 font-semibold text-gray-900">
          There are three main types of shadows:
        </p>

        <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-700 leading-relaxed marker:font-bold marker:text-gray-900">
          <li>
            <span className="font-bold">Umbra:</span> The darkest part of a
            shadow where all light is blocked.
          </li>
          <li>
            <span className="font-bold">Penumbra:</span> The lighter, outer part
            of a shadow where some light still reaches.
          </li>
          <li>
            <span className="font-bold">Antumbra:</span> A less common type,
            seen during eclipses when the object is smaller than the light
            source.
          </li>
        </ol>
      </div>
    </div>
  );
};
