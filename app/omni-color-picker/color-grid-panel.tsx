"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import {
  animate,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useCallback, useLayoutEffect, useRef } from "react";
import useMeasure from "react-use-measure";

import {
  CELL_SPACING_X,
  CELL_SPACING_Y,
  cellColor,
  corePresence,
  DOT_MAX,
  dotOpacity,
  dotScale,
  HUES,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  projectX,
  projectY,
  SHADES,
  unprojectX,
  unprojectY,
  vividColor,
  wrap,
} from "./color-math";

const WINDOW_X = 5;
const WINDOW_Y = 4;
const CORE_SCALE = 0.36;
/** Cell distance over which a core fades as its row leaves the centre line. */
const CORE_ROW_REACH = 0.5;
const TAP_THRESHOLD_PX = 5;
const MOMENTUM_SECONDS = 0.08;
const MAX_FLING_CELLS = 3;

const SNAP_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOx: number;
  startOy: number;
  moved: boolean;
}

interface Props {
  ox: MotionValue<number>;
  oy: MotionValue<number>;
  center: { h: number; s: number };
}

const EDGE_NUDGES = [
  {
    dh: -1,
    ds: 0,
    label: "Previous hue",
    Icon: ChevronLeft,
    position: "top-1/2 left-3 -translate-y-1/2",
  },
  {
    dh: 1,
    ds: 0,
    label: "Next hue",
    Icon: ChevronRight,
    position: "top-1/2 right-3 -translate-y-1/2",
  },
  {
    dh: 0,
    ds: -1,
    label: "Lighter shade",
    Icon: ChevronUp,
    position: "top-3 left-1/2 -translate-x-1/2",
  },
  {
    dh: 0,
    ds: 1,
    label: "Darker shade",
    Icon: ChevronDown,
    position: "bottom-3 left-1/2 -translate-x-1/2",
  },
];

/* Corners read as crop-mark brackets rather than arrows, drawn from two borders. */
const CORNER_NUDGES = [
  {
    dh: -1,
    ds: -1,
    label: "Previous hue, lighter shade",
    position: "top-3 left-3",
    bracket: "rounded-tl-[2px] border-t-[1.5px] border-l-[1.5px]",
  },
  {
    dh: 1,
    ds: -1,
    label: "Next hue, lighter shade",
    position: "top-3 right-3",
    bracket: "rounded-tr-[2px] border-t-[1.5px] border-r-[1.5px]",
  },
  {
    dh: -1,
    ds: 1,
    label: "Previous hue, darker shade",
    position: "bottom-3 left-3",
    bracket: "rounded-bl-[2px] border-b-[1.5px] border-l-[1.5px]",
  },
  {
    dh: 1,
    ds: 1,
    label: "Next hue, darker shade",
    position: "bottom-3 right-3",
    bracket: "rounded-br-[2px] border-r-[1.5px] border-b-[1.5px]",
  },
];

const NUDGE_BUTTON_CLASS =
  "absolute flex size-9 items-center justify-center rounded-lg bg-white text-neutral-400 shadow-[0_1px_3px_rgb(0_0_0/0.08)] transition-colors hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-blue-500";

export const ColorGridPanel = ({ ox, oy, center }: Props) => {
  const [measureRef, bounds] = useMeasure();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dotEls = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<DragState | null>(null);
  const reducedMotion = useReducedMotion();

  const scale = bounds.width > 0 ? bounds.width / PANEL_WIDTH : 1;

  const updateDots = useCallback(() => {
    const x = ox.get();
    const y = oy.get();
    const presence = corePresence(y);
    for (const el of dotEls.current.values()) {
      const u = Number(el.dataset.k) - x;
      const v = Number(el.dataset.l) - y;
      const d = Math.hypot(u, v);
      el.style.transform = `translate(${projectX(u)}px, ${projectY(v)}px) scale(${dotScale(d)})`;
      el.style.opacity = String(dotOpacity(d));

      // Cores belong to the selected row, and only near the poles of the shade
      // cycle. Both terms are continuous, so they fade as the grid is dragged.
      const core = el.children[1] as HTMLElement;
      const onRow = Math.max(0, 1 - Math.abs(v) / CORE_ROW_REACH);
      core.style.opacity = String(onRow * presence);
    }
  }, [ox, oy]);

  useMotionValueEvent(ox, "change", updateDots);
  useMotionValueEvent(oy, "change", updateDots);
  useLayoutEffect(updateDots, [updateDots, center]);

  const snapTo = useCallback(
    (targetH: number, targetS: number, velocityX = 0, velocityY = 0) => {
      if (reducedMotion) {
        ox.set(targetH);
        oy.set(targetS);
        return;
      }
      animate(ox, targetH, { ...SNAP_SPRING, velocity: velocityX });
      animate(oy, targetS, { ...SNAP_SPRING, velocity: velocityY });
    },
    [ox, oy, reducedMotion]
  );

  /** Pointer position (design px, relative to panel center). */
  const toPanelPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) {
        return { px: 0, py: 0 };
      }
      return {
        px: (clientX - rect.left) / scale - PANEL_WIDTH / 2,
        py: (clientY - rect.top) / scale - PANEL_HEIGHT / 2,
      };
    },
    [scale]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ox.stop();
    oy.stop();
    surfaceRef.current?.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOx: ox.get(),
      startOy: oy.get(),
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== e.pointerId) {
      return;
    }
    const dx = e.clientX - state.startClientX;
    const dy = e.clientY - state.startClientY;
    if (Math.hypot(dx, dy) > TAP_THRESHOLD_PX) {
      state.moved = true;
    }
    // The grid follows the pointer 1:1 — no easing during direct manipulation.
    ox.set(state.startOx - dx / scale / CELL_SPACING_X);
    oy.set(state.startOy - dy / scale / CELL_SPACING_Y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== e.pointerId) {
      return;
    }
    drag.current = null;

    if (!state.moved) {
      const { px, py } = toPanelPoint(e.clientX, e.clientY);
      snapTo(
        Math.round(unprojectX(px) + ox.get()),
        Math.round(unprojectY(py) + oy.get())
      );
      return;
    }

    // Project momentum, clamp the fling, then spring to the nearest cell.
    const vx = ox.getVelocity();
    const vy = oy.getVelocity();
    const flingX = Math.min(
      Math.max(vx * MOMENTUM_SECONDS, -MAX_FLING_CELLS),
      MAX_FLING_CELLS
    );
    const flingY = Math.min(
      Math.max(vy * MOMENTUM_SECONDS, -MAX_FLING_CELLS),
      MAX_FLING_CELLS
    );
    snapTo(
      Math.round(ox.get() + flingX),
      Math.round(oy.get() + flingY),
      vx,
      vy
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const move = step[e.key];
    if (!move) {
      return;
    }
    e.preventDefault();
    // Keyboard moves are instant — animating repeated key presses feels slow.
    ox.stop();
    oy.stop();
    ox.set(Math.round(ox.get()) + move[0]);
    oy.set(Math.round(oy.get()) + move[1]);
  };

  const dots = [];
  for (let j = -WINDOW_Y; j <= WINDOW_Y; j++) {
    for (let i = -WINDOW_X; i <= WINDOW_X; i++) {
      const k = center.h + i;
      const l = center.s + j;
      const key = `${wrap(k, HUES)}:${wrap(l, SHADES)}`;
      dots.push(
        <div
          className="-ml-10 -mt-10 pointer-events-none absolute top-1/2 left-1/2"
          data-k={k}
          data-l={l}
          key={key}
          ref={(el) => {
            if (el) {
              dotEls.current.set(key, el);
            } else {
              dotEls.current.delete(key);
            }
          }}
          style={{ width: DOT_MAX, height: DOT_MAX }}
        >
          <div
            className="absolute inset-0 rounded-full border border-black/[0.06]"
            style={{ backgroundColor: cellColor(k, l) }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: vividColor(k),
              transform: `scale(${CORE_SCALE})`,
            }}
          />
        </div>
      );
    }
  }

  return (
    <div
      className="relative w-full max-w-[685px]"
      ref={measureRef}
      style={{ aspectRatio: `${PANEL_WIDTH} / ${PANEL_HEIGHT}` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: PANEL_WIDTH,
          height: PANEL_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <div className="absolute inset-0 rounded-3xl border border-black/10 bg-white shadow-black/10 shadow-xl" />

        {/* Dotted texture + crosshair */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(0 0 0 / 0.09) 1.1px, transparent 1.1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "center",
          }}
        />
        <div className="-translate-y-1/2 absolute top-1/2 right-6 left-6 h-px bg-black/5" />
        <div className="-translate-x-1/2 absolute top-6 bottom-6 left-1/2 w-px bg-black/5" />

        <div
          aria-label="Background color grid. Drag to pan, arrow keys to step hue and shade."
          aria-valuemax={SHADES - 1}
          aria-valuemin={0}
          aria-valuenow={wrap(center.s, SHADES)}
          aria-valuetext={`hue ${wrap(center.h, HUES) + 1} of ${HUES}, shade ${wrap(center.s, SHADES) + 1} of ${SHADES}`}
          className="absolute inset-0 cursor-grab touch-none overflow-hidden rounded-3xl focus-visible:outline-2 focus-visible:outline-blue-500 active:cursor-grabbing"
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={surfaceRef}
          role="slider"
          tabIndex={0}
        >
          {dots}
        </div>

        {EDGE_NUDGES.map(({ dh, ds, label, Icon, position }) => (
          <button
            aria-label={label}
            className={`${NUDGE_BUTTON_CLASS} ${position}`}
            key={label}
            onClick={() =>
              snapTo(Math.round(ox.get()) + dh, Math.round(oy.get()) + ds)
            }
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <Icon size={16} />
          </button>
        ))}

        {CORNER_NUDGES.map(({ dh, ds, label, position, bracket }) => (
          <button
            aria-label={label}
            className={`${NUDGE_BUTTON_CLASS} ${position}`}
            key={label}
            onClick={() =>
              snapTo(Math.round(ox.get()) + dh, Math.round(oy.get()) + ds)
            }
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <span className={`size-2.5 border-current ${bracket}`} />
          </button>
        ))}
      </div>
    </div>
  );
};
