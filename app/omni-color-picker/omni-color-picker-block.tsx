"use client";

import { useMotionValue, useMotionValueEvent } from "motion/react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { ColorGridPanel } from "./color-grid-panel";
import { cellHex, cellTheme, HUES, SHADES, wrap } from "./color-math";

const INITIAL_HUE = 12; // 240° blue
const INITIAL_SHADE = 0; // lightest point of the shade cycle

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
            src="/avatar-sm.png"
            width={48}
          />
          <div>
            <p className="font-semibold">Matt Blode</p>
            <p className="text-(--demo-muted) text-sm">
              Product engineer, Melbourne
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm leading-snug">
          <p>
            Two startups, two exits. Forbes 30 Under 30. Now on AI at Linktree.
          </p>
          <p className="text-(--demo-muted)">
            This page is a playground for an omni-directional colour picker.
            Drag the sphere of dots below to pick a hue and shade.
          </p>
        </div>
        <a
          className="rounded-xl bg-(--demo-accent) px-4 py-2.5 text-center font-medium text-(--demo-accent-fg) text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          href="https://matthewblode.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Say hello
        </a>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <ColorGridPanel center={center} ox={ox} oy={oy} />
        <output
          aria-live="polite"
          className="flex items-center gap-2 rounded-full border border-(--demo-border) bg-(--demo-card) py-1.5 pr-4 pl-2 font-mono text-(--demo-muted) text-xs"
        >
          <span
            className="size-4 rounded-full border border-black/10"
            style={{ backgroundColor: "var(--demo-bg)" }}
          />
          {hex} · hue {wrap(center.h, HUES)} / shade {wrap(center.s, SHADES)}
        </output>
      </div>
    </div>
  );
};
