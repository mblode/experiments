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
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
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

// Apple scroll-momentum falloff for Motion's inertia generator: the value
// decays as target - power*velocity·e^(-t/τ), the same exponential curve Apple
// ships in Designing Fluid Interfaces. power scales throw distance (kept high
// for a macOS-trackpad-style reach); timeConstant scales how long it keeps
// gliding (kept shorter so it decelerates to rest quickly).
const FLING_POWER = 0.9;
const FLING_TIME_CONSTANT = 500;

/**
 * Snapping is soft (ωn≈9.5) and overshoots on purpose (ζ≈0.65). Both halves
 * matter: dropping stiffness alone just delays a dead stop, and dropping
 * damping alone speeds the approach up rather than slowing it. Measured in the
 * browser, the cell arrives at ~310ms (vs ~265ms critically damped), swings
 * ~7% of a cell past it — about 5px on screen at the default panel width — at
 * ~435ms, and is home by ~700ms. A landing with weight, rather than a cut.
 */
const SNAP_SPRING = { type: "spring", stiffness: 90, damping: 12.3 } as const;
/**
 * Keyboard stepping stays tight (ζ≈0.81, ~1% overshoot) and quicker than the
 * snap spring. Arrow keys repeat, and a bounce per press reads as lag; the
 * momentum that lets held keys accelerate comes from handing the live velocity
 * to each step, not from under-damping.
 */
const KEY_SPRING = { type: "spring", stiffness: 260, damping: 26 } as const;
/**
 * Release speed (cells/sec) below which there's no throw left to feel, so the
 * snap spring lands the cell instead of inertia — the exponential coast eases
 * in asymptotically and can never bump. Kept low: the overshoot is a fraction
 * of the distance travelled, so handing the spring a real throw would scale a
 * tasteful 8px bump up into a wobble.
 */
const SNAP_MAX_VELOCITY = 1;

const KEY_VECTORS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};
/** Cadence at which held keys advance a cell; the spring smooths between them. */
const KEY_STEP_MS = 90;

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOx: number;
  startOy: number;
  moved: boolean;
  // Recent (time, value) samples for measuring release velocity ourselves —
  // MotionValue.getVelocity() is frame-timed and reads ~0 at pointer-up.
  samples: { t: number; x: number; y: number }[];
}

/** Window over which release velocity is averaged, in ms. */
const VELOCITY_WINDOW_MS = 100;

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

/*
 * `before:-inset-1` grows the hit area from the 36px visual to the 44px WCAG
 * 2.5.5 target without changing how the button looks.
 */
const NUDGE_BUTTON_CLASS =
  "absolute flex size-9 items-center justify-center rounded-xl bg-white/80 text-neutral-400 shadow-[0_1px_3px_rgb(0_0_0/0.08)] backdrop-blur-md transition-colors before:absolute before:-inset-1 before:content-[''] hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-blue-500";

export const ColorGridPanel = ({ ox, oy, center }: Props) => {
  const [measureRef, bounds] = useMeasure();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dotEls = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<DragState | null>(null);
  // Integer cell every discrete move heads for — arrow keys, nudge buttons and
  // taps alike. Kept ahead of the live value so repeated steps stack instead of
  // re-rounding a value that is still in flight; two fast nudges inside the
  // first frames of a spring would otherwise round back to the same cell and
  // the second would be swallowed. Cleared when a drag takes the value
  // continuous.
  const stepTarget = useRef<{ h: number; s: number } | null>(null);
  // Arrow keys currently held. Driven by a rAF loop rather than OS key-repeat
  // so multiple keys combine (e.g. Down+Left pans diagonally).
  const heldKeys = useRef(new Set<string>());
  const keyRaf = useRef<number | null>(null);
  const lastKeyStep = useRef(0);
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
      stepTarget.current = { h: targetH, s: targetS };
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

  /**
   * A release either coasts or snaps. A real throw keeps the iOS
   * scroll-deceleration momentum; anything gentler hands over to the snap
   * spring so the cell lands with a bump instead of creeping in.
   */
  const releaseAxis = useCallback(
    (value: MotionValue<number>, velocity: number) => {
      // Land on the cell nearest the projected resting point. Pass that cell as
      // the target (not the current value) so Motion doesn't skip an
      // equal-keyframes animation.
      const target = Math.round(value.get() + FLING_POWER * velocity);
      if (Math.abs(velocity) < SNAP_MAX_VELOCITY) {
        animate(value, target, { ...SNAP_SPRING, velocity });
      } else {
        animate(value, target, {
          type: "inertia",
          power: FLING_POWER,
          timeConstant: FLING_TIME_CONSTANT,
          restDelta: 0.001,
          modifyTarget: Math.round,
          velocity,
        });
      }
      return target;
    },
    []
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

  // Push the target ahead of the value; repeated steps stack so the pan
  // accelerates, then springs to rest carrying the velocity it built up.
  const stepKey = useCallback(
    (dh: number, ds: number) => {
      const base = stepTarget.current ?? {
        h: Math.round(ox.get()),
        s: Math.round(oy.get()),
      };
      stepTarget.current = { h: base.h + dh, s: base.s + ds };
      if (dh !== 0) {
        animate(ox, stepTarget.current.h, {
          ...KEY_SPRING,
          velocity: ox.getVelocity(),
        });
      }
      if (ds !== 0) {
        animate(oy, stepTarget.current.s, {
          ...KEY_SPRING,
          velocity: oy.getVelocity(),
        });
      }
    },
    [ox, oy]
  );

  const runKeys = useCallback(
    (time: number) => {
      if (heldKeys.current.size === 0) {
        keyRaf.current = null;
        return;
      }
      if (time - lastKeyStep.current >= KEY_STEP_MS) {
        lastKeyStep.current = time;
        let dh = 0;
        let ds = 0;
        for (const key of heldKeys.current) {
          const vec = KEY_VECTORS[key];
          if (vec) {
            dh += vec[0];
            ds += vec[1];
          }
        }
        // Opposite keys cancel; only step when there's a net direction.
        if (dh !== 0 || ds !== 0) {
          stepKey(dh, ds);
        }
      }
      keyRaf.current = requestAnimationFrame(runKeys);
    },
    [stepKey]
  );

  // Only stops the held-key loop; the pending target outlives it so a button
  // click that steals focus mid-spring still steps from where the grid is going.
  const stopKeys = useCallback(() => {
    heldKeys.current.clear();
    if (keyRaf.current !== null) {
      cancelAnimationFrame(keyRaf.current);
      keyRaf.current = null;
    }
  }, []);

  useEffect(() => stopKeys, [stopKeys]);

  const nudge = useCallback(
    (dh: number, ds: number) => {
      stopKeys();
      const base = stepTarget.current ?? {
        h: Math.round(ox.get()),
        s: Math.round(oy.get()),
      };
      // Hand over the live velocity so a rapid series of clicks reads as one
      // accelerating pan rather than a stack of restarts.
      snapTo(base.h + dh, base.s + ds, ox.getVelocity(), oy.getVelocity());
    },
    [ox, oy, snapTo, stopKeys]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore extra touches: a second finger would rebase the gesture on its own
    // start point and make the grid jump.
    if (drag.current) {
      return;
    }
    ox.stop();
    oy.stop();
    stopKeys();
    // The value goes continuous from here, so any pending discrete target is
    // stale the moment the drag starts.
    stepTarget.current = null;
    surfaceRef.current?.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOx: ox.get(),
      startOy: oy.get(),
      moved: false,
      samples: [{ t: performance.now(), x: ox.get(), y: oy.get() }],
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
    const nextX = state.startOx - dx / scale / CELL_SPACING_X;
    const nextY = state.startOy - dy / scale / CELL_SPACING_Y;
    ox.set(nextX);
    oy.set(nextY);

    const now = performance.now();
    state.samples.push({ t: now, x: nextX, y: nextY });
    while (
      state.samples.length > 2 &&
      now - state.samples[0].t > VELOCITY_WINDOW_MS
    ) {
      state.samples.shift();
    }
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

    if (reducedMotion) {
      ox.set(Math.round(ox.get()));
      oy.set(Math.round(oy.get()));
      return;
    }

    // Release velocity (cells/sec), averaged over the last samples.
    const now = performance.now();
    const oldest = state.samples[0];
    const dt = (now - oldest.t) / 1000;
    const vx = dt > 0 ? (ox.get() - oldest.x) / dt : 0;
    const vy = dt > 0 ? (oy.get() - oldest.y) / dt : 0;

    // Record where the coast lands so a nudge during it steps from the landing
    // cell rather than from a value still in motion.
    stepTarget.current = {
      h: releaseAxis(ox, vx),
      s: releaseAxis(oy, vy),
    };
  };

  // A cancelled gesture (a system edge swipe, say) never reaches pointerup, so
  // without this the grid is left parked between cells until the next touch.
  // There is no meaningful release velocity, so just settle on the nearest one.
  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== e.pointerId) {
      return;
    }
    drag.current = null;
    snapTo(Math.round(ox.get()), Math.round(oy.get()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const vec = KEY_VECTORS[e.key];
    if (!vec) {
      return;
    }
    e.preventDefault();

    if (reducedMotion) {
      // Via snapTo so the pending target stays in step with the value.
      snapTo(Math.round(ox.get()) + vec[0], Math.round(oy.get()) + vec[1]);
      return;
    }

    // Ignore OS auto-repeat; the rAF loop drives our own cadence so held keys
    // combine into diagonals instead of the OS repeating just the last key.
    if (e.repeat) {
      return;
    }
    const wasIdle = heldKeys.current.size === 0;
    heldKeys.current.add(e.key);
    if (wasIdle) {
      stepKey(vec[0], vec[1]); // respond on the initiating press, even a fast tap
      lastKeyStep.current = performance.now();
      keyRaf.current = requestAnimationFrame(runKeys);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    heldKeys.current.delete(e.key);
  };

  const handleBlur = () => {
    stopKeys();
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
      className="relative w-full max-w-md"
      ref={measureRef}
      style={{ aspectRatio: `${PANEL_WIDTH} / ${PANEL_HEIGHT}` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: PANEL_WIDTH,
          height: PANEL_HEIGHT,
          transform: `scale(${scale})`,
          // Hidden until measured so it never flashes at the unscaled 685px size.
          visibility: bounds.width > 0 ? undefined : "hidden",
        }}
      >
        <div className="absolute inset-0 rounded-3xl border border-black/10 bg-white shadow-black/10 shadow-xl" />

        {/* Crosshair */}
        <div className="-translate-y-1/2 absolute top-1/2 right-6 left-6 h-px bg-black/5" />
        <div className="-translate-x-1/2 absolute top-6 bottom-6 left-1/2 w-px bg-black/5" />

        {/*
         * select-none: pointer capture already keeps the drag alive once the
         * pointer leaves the panel, but without this the browser starts a text
         * selection on whatever is underneath — the readout and footer
         * highlight and the cursor turns into an I-beam, so a drag that is in
         * fact still tracking reads as broken.
         */}
        <div
          aria-label="Background color grid. Drag to pan, arrow keys to step hue and shade."
          aria-valuemax={SHADES - 1}
          aria-valuemin={0}
          aria-valuenow={wrap(center.s, SHADES)}
          aria-valuetext={`hue ${wrap(center.h, HUES) + 1} of ${HUES}, shade ${wrap(center.s, SHADES) + 1} of ${SHADES}`}
          className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden rounded-3xl focus-visible:outline-2 focus-visible:outline-blue-500 active:cursor-grabbing"
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={surfaceRef}
          role="slider"
          tabIndex={0}
        >
          {dots}
        </div>
      </div>

      {/*
       * The nudges sit outside the scaled layer: they are chrome, not part of
       * the fish-eye artwork, so they keep their real size instead of shrinking
       * with the panel (at max-w-md the scale is ~0.65, and on a phone ~0.52,
       * which rendered a 36px button at 19px). Held back until the panel is
       * measured so they never paint alone.
       */}
      {bounds.width > 0 &&
        EDGE_NUDGES.map(({ dh, ds, label, Icon, position }) => (
          <button
            aria-label={label}
            className={`${NUDGE_BUTTON_CLASS} ${position}`}
            key={label}
            onClick={() => nudge(dh, ds)}
            type="button"
          >
            <Icon size={16} />
          </button>
        ))}

      {bounds.width > 0 &&
        CORNER_NUDGES.map(({ dh, ds, label, position, bracket }) => (
          <button
            aria-label={label}
            className={`${NUDGE_BUTTON_CLASS} ${position}`}
            key={label}
            onClick={() => nudge(dh, ds)}
            type="button"
          >
            <span className={`size-2.5 border-current ${bracket}`} />
          </button>
        ))}
    </div>
  );
};
