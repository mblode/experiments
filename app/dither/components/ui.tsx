import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { cn } from "@/lib/utils";

import { speedMultiplierAtScore, useGame } from "../game";

/** How long the opening instructions hold before they fade away. */
const INSTRUCTIONS_DISPLAY_MS = 4000;
/** Crosshair kick when a shot leaves. Has to land before the next shot 200ms later. */
const SHOT_PULSE_MS = 120;
/** How long the crosshair stays inverted after a hit registers. */
const HIT_FLASH_MS = 150;

/** ease-out-quart: leads hard, settles clean. */
const EASE_OUT_QUART = "cubic-bezier(.165, .84, .44, 1)";

/**
 * The HUD is drawn in the same two colours the dither pass outputs, so the
 * chrome never introduces a tone the shader could not have produced. Ink
 * plates sit behind every readout because white-on-white over a lit asteroid
 * is unreadable, and the crosshair carries an ink outline for the same reason.
 *
 * Tailwind arbitrary values have to be static, so the plates spell the hex as
 * `bg-[#333319]`; this constant covers the box-shadows, which cannot.
 */
const INK = "#333319";

export const UI = () => {
  const { kills, score, isGameOver, startGame, lastShotTime, lastHitTime } =
    useGame();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isTouch, setIsTouch] = useState(false);
  const [isHitFlashing, setIsHitFlashing] = useState(false);

  const crosshairRef = useRef<HTMLDivElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false,
  });

  // Matches the predicate GameControls binds its listeners with, so the
  // instructions can never describe a control scheme that is not bound.
  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => setShowInstructions(false),
      INSTRUCTIONS_DISPLAY_MS
    );
    return () => clearTimeout(timer);
  }, []);

  // Fire feedback runs on the element rather than through state: shots come
  // every 200ms and re-rendering the HUD that often on top of a WebGL frame
  // loop is wasted work. Cancelling on re-run retargets an in-flight pulse.
  useEffect(() => {
    const node = crosshairRef.current;
    if (!(node && lastShotTime) || reducedMotion) {
      return;
    }

    // The `scale` property, not `transform`: the wrapper's centring translate
    // lives on `transform`, and animating that would replace it and throw the
    // crosshair into the corner for the length of the pulse.
    const pulse = node.animate([{ scale: "1.3" }, { scale: "1" }], {
      duration: SHOT_PULSE_MS,
      easing: EASE_OUT_QUART,
    });
    return () => pulse.cancel();
  }, [lastShotTime, reducedMotion]);

  // The hit flash has to decay on a clock, so it is the one piece of timed
  // state here. A kill already re-renders this component (score and kills both
  // change), so this only costs the one extra render that clears it.
  useEffect(() => {
    if (!lastHitTime) {
      return;
    }
    setIsHitFlashing(true);
    const timer = setTimeout(() => setIsHitFlashing(false), HIT_FLASH_MS);
    return () => clearTimeout(timer);
  }, [lastHitTime]);

  // Losing is the one moment the keyboard needs a target, so put it there.
  useEffect(() => {
    if (isGameOver) {
      restartRef.current?.focus();
    }
  }, [isGameOver]);

  const scoreRounded = Math.floor(score);
  const speedMultiplier = speedMultiplierAtScore(score).toFixed(1);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 font-mono text-white">
      {!isGameOver && (
        <>
          {/* Readouts sit along the bottom edge: the page header owns the top
              of the viewport, and at narrow widths a top-left HUD lands on it. */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-lg">
            <p className="rounded-[10px] bg-[#333319] px-3 py-1.5">
              Score {scoreRounded} · {kills} kills
            </p>
            <p className="rounded-[10px] bg-[#333319] px-3 py-1.5">
              Speed {speedMultiplier}×
            </p>
          </div>

          {/* Kept mounted and faded, because the old version unmounted the node
              and the 0.5s fade it declared never ran. */}
          <div
            aria-hidden={!showInstructions}
            className={cn(
              "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 max-w-[90%] rounded-[14px] bg-[#333319] px-6 py-5 text-center text-2xl leading-relaxed transition-opacity duration-300 ease-out motion-reduce:transition-none",
              showInstructions ? "opacity-100" : "opacity-0"
            )}
          >
            {isTouch ? (
              <>
                <p>Touch and drag to aim</p>
                <p>Auto-fires while touching</p>
                <p>Dodge the asteroids</p>
              </>
            ) : (
              <>
                <p>Click to lock the pointer</p>
                <p>Hold the mouse to auto-fire</p>
                <p>Dodge the asteroids</p>
              </>
            )}
          </div>

          {/* Crosshair. One wrapper owns the centring translate so the shot
              pulse can scale without having to restate it every frame. */}
          <div
            aria-hidden
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 grid size-6 place-items-center"
            ref={crosshairRef}
          >
            <span
              className={cn(
                "absolute inset-0 rounded-full border-2 border-white transition-colors duration-150 ease-out motion-reduce:transition-none",
                isHitFlashing && "bg-white"
              )}
              style={{ boxShadow: `0 0 0 1px ${INK}, inset 0 0 0 1px ${INK}` }}
            />
            <span
              className={cn(
                "size-1 rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none",
                isHitFlashing ? "bg-[#333319]" : "bg-white"
              )}
              style={
                isHitFlashing ? undefined : { boxShadow: `0 0 0 1px ${INK}` }
              }
            />
          </div>
        </>
      )}

      {isGameOver && (
        <div
          className="-translate-x-1/2 -translate-y-1/2 fade-in-0 zoom-in-95 absolute top-1/2 left-1/2 flex animate-in flex-col items-center gap-6 rounded-[14px] bg-[#333319] px-10 py-8 text-center duration-200 ease-out motion-reduce:animate-none"
          role="alert"
        >
          <div className="flex flex-col gap-2">
            <p className="font-bold text-5xl md:text-6xl">Game over</p>
            <p className="text-2xl md:text-3xl">
              Score {scoreRounded} · {kills} kills
            </p>
          </div>

          <button
            className={cn(
              "pointer-events-auto rounded-[10px] bg-white px-10 py-3 font-mono font-bold text-[#333319] text-xl",
              "transition-transform duration-100 ease-out motion-reduce:transition-none",
              "hover:scale-[1.03] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
              // An outline rather than a ring, so the indicator survives forced
              // colours instead of disappearing with the box-shadow.
              "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            )}
            onClick={startGame}
            ref={restartRef}
            style={{ touchAction: "manipulation" }}
            type="button"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
};
