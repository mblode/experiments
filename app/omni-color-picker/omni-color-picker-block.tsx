"use client";

import { useMotionValue, useMotionValueEvent } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ColorGridPanel } from "./color-grid-panel";
import { cellHex, cellTheme, HUES, SHADES, wrap } from "./color-math";

const INITIAL_HUE = 12; // 240° blue
const INITIAL_SHADE = 0; // lightest point of the shade cycle
/** Quiet time after the grid stops before the value is worth announcing. */
const SETTLE_MS = 500;

const themeVars = (h: number, s: number) => {
  const t = cellTheme(h, s);
  return {
    "--demo-bg": t.bg,
    "--demo-fg": t.fg,
    "--demo-muted": t.muted,
    "--demo-card": t.card,
    "--demo-border": t.border,
    "--demo-accent": t.accent,
    "--demo-accent-fg": t.accentFg,
  };
};

export const OmniColorPickerBlock = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const ox = useMotionValue(INITIAL_HUE);
  const oy = useMotionValue(INITIAL_SHADE);
  const [center, setCenter] = useState({ h: INITIAL_HUE, s: INITIAL_SHADE });

  // Captured once so React never diffs these vars and clobbers the
  // imperative per-frame writes below.
  const initialVars = useRef(
    themeVars(INITIAL_HUE, INITIAL_SHADE) as React.CSSProperties
  );

  const applyTheme = useCallback(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const vars = themeVars(ox.get(), oy.get());
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(key, value);
    }
    const h = Math.round(ox.get());
    const s = Math.round(oy.get());
    setCenter((prev) => (prev.h === h && prev.s === s ? prev : { h, s }));
  }, [ox, oy]);

  useMotionValueEvent(ox, "change", applyTheme);
  useMotionValueEvent(oy, "change", applyTheme);

  const hex = cellHex(center.h, center.s);

  // Not derivable in render: what makes this announceable is that the grid has
  // stopped moving, and "stopped" is only knowable from the passage of time.
  // A drag crosses cells continuously, so only the value that survives
  // SETTLE_MS is worth putting in front of a screen reader.
  const [settled, setSettled] = useState({ ...center, hex });
  useEffect(() => {
    const id = setTimeout(
      () => setSettled({ ...center, hex: cellHex(center.h, center.s) }),
      SETTLE_MS
    );
    return () => clearTimeout(id);
  }, [center]);

  return (
    <div
      className="flex min-h-screen flex-col items-center gap-10 px-4 py-12 text-(--demo-fg)"
      ref={rootRef}
      style={{ backgroundColor: "var(--demo-bg)", ...initialVars.current }}
    >
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-(--demo-border) bg-(--demo-card) p-6">
        <div className="flex items-center gap-3">
          <Image
            alt="Matt Blode's avatar"
            className="rounded-full"
            height={48}
            src="/experiments/avatar-sm.png"
            width={48}
          />
          <div>
            <p className="font-semibold">Matt Blode</p>
            <p className="text-(--demo-muted) text-sm">AI at Linktree</p>
          </div>
        </div>
        <p className="text-(--demo-muted) text-sm leading-snug">
          This page is a playground for an omni-directional colour picker. Drag
          the sphere of dots below to pick a hue and shade.
        </p>
        <a
          className="rounded-xl bg-(--demo-accent) px-4 py-2.5 text-center font-medium text-(--demo-accent-fg) text-sm transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-(--demo-fg) focus-visible:outline-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          href="https://blode.co"
          rel="noopener noreferrer"
          target="_blank"
        >
          Say hello
        </a>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <ColorGridPanel center={center} ox={ox} oy={oy} />

        {/*
         * A div, not an `output`: `output` maps to role="status", so this
         * would be a live region firing on every cell the grid crosses during
         * a drag — dozens of queued announcements per gesture. The settled
         * value is announced once, below.
         */}
        <div
          aria-hidden="true"
          className="flex items-center gap-2 rounded-full border border-(--demo-border) bg-(--demo-card) py-1.5 pr-4 pl-2 font-mono text-(--demo-muted) text-xs"
        >
          <span
            className="size-4 rounded-full border border-black/10"
            style={{ backgroundColor: "var(--demo-bg)" }}
          />
          {hex} · hue {wrap(center.h, HUES)} / shade {wrap(center.s, SHADES)}
        </div>

        <output aria-live="polite" className="sr-only">
          Background {settled.hex}, hue {wrap(settled.h, HUES) + 1} of {HUES},
          shade {wrap(settled.s, SHADES) + 1} of {SHADES}
        </output>
      </div>
    </div>
  );
};
