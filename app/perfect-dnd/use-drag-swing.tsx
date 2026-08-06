"use client";

import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useDndMonitor } from "@dnd-kit/core";
import { useCallback, useEffect, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";

import { createSpring, type Spring } from "./spring";
import { useStore } from "./stores/store";

interface DragSwingConfig {
  /** How much velocity affects rotation (deg per px/frame). Default: 0.3 */
  sensitivity?: number;
  /** Maximum rotation in degrees. Default: 12 */
  maxAngle?: number;
  /** Velocity smoothing (0-1, higher = more responsive, lower = heavier feel). Default: 0.15 */
  smoothing?: number;
  /** Spring stiffness for return animation. Default: 200 */
  returnStiffness?: number;
  /** Spring damping for return animation. Default: 22 */
  returnDamping?: number;
}

interface UseDragSwingReturn {
  overlayRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<HTMLDivElement | null>;
  /** Scale the card is held at while dragging. 1 under reduced motion. */
  liftScale: number;
}

/** How far the card is lifted off the list while it is held. */
export const LIFT_SCALE = 1.04;
const LIFT_SHADOW =
  "0 25px 50px -12px rgba(0,0,0,0.15), 0 12px 24px -8px rgba(0,0,0,0.1)";
const NO_SHADOW = "0 0 0 0 rgba(0,0,0,0)";
/** Enter curve — the lift is a user-initiated entrance. */
const LIFT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const LIFT_DURATION = 200;

// Utility functions
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function useDragSwing(config: DragSwingConfig = {}): UseDragSwingReturn {
  const {
    sensitivity = 0.3,
    maxAngle = 30,
    smoothing = 0.15,
    returnStiffness = 250,
    returnDamping = 25,
  } = config;

  const store = useStore();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false,
  });
  const liftScale = reduced ? 1 : LIFT_SCALE;

  const overlayRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  // Spring for rotation animation
  const springRef = useRef<Spring | null>(null);

  // Position tracking for velocity calculation
  const pointerXRef = useRef<number>(0);
  const lastFrameXRef = useRef<number>(0);
  const smoothedVelocityRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Drag state tracking
  const isDraggingRef = useRef<boolean>(false);
  const dragLoopRef = useRef<number | null>(null);

  const stopDragLoop = useCallback(() => {
    isDraggingRef.current = false;
    if (dragLoopRef.current !== null) {
      cancelAnimationFrame(dragLoopRef.current);
      dragLoopRef.current = null;
    }
  }, []);

  // Initialize spring
  useEffect(() => {
    springRef.current = createSpring({
      stiffness: returnStiffness,
      damping: returnDamping,
    });
  }, [returnStiffness, returnDamping]);

  // Write the angle straight onto the element that carries it. Driving a drag
  // through a CSS custom property on a wrapper re-resolves styles for every
  // descendant on every frame.
  const updateRotation = useCallback((value: number) => {
    if (overlayRef.current) {
      overlayRef.current.style.transform = `rotate(${value}deg)`;
    }
  }, []);

  // Continuous physics loop - runs spring simulation every frame
  const runDragLoop = useCallback(() => {
    if (!(isDraggingRef.current && springRef.current)) {
      return;
    }

    // Calculate delta time
    const now = performance.now();
    const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.064);
    lastFrameTimeRef.current = now;

    // Calculate velocity from pointer delta every frame (so idle motion decays)
    const currentX = pointerXRef.current;
    const instantVelocity = currentX - lastFrameXRef.current;
    lastFrameXRef.current = currentX;

    // Smooth the velocity
    smoothedVelocityRef.current = lerp(
      smoothedVelocityRef.current,
      instantVelocity,
      smoothing
    );

    // Dead zone - ignore tiny velocity to prevent jitter during slow movement
    const effectiveVelocity =
      Math.abs(smoothedVelocityRef.current) < 0.3
        ? 0
        : smoothedVelocityRef.current;

    // Map velocity directly to rotation angle
    const targetRotation = clamp(
      -effectiveVelocity * sensitivity,
      -maxAngle,
      maxAngle
    );

    // Just set the target - physics loop handles animation with momentum
    springRef.current.setTarget(targetRotation);

    // Advance spring physics (momentum preserved!)
    springRef.current.tick(dt);

    // Update rotation from spring value
    updateRotation(springRef.current.getValue());

    // Continue loop
    dragLoopRef.current = requestAnimationFrame(runDragLoop);
  }, [maxAngle, sensitivity, smoothing, updateRotation]);

  const startDragLoop = useCallback(() => {
    stopDragLoop();
    pointerXRef.current = 0;
    lastFrameXRef.current = 0;
    smoothedVelocityRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    isDraggingRef.current = true;
    dragLoopRef.current = requestAnimationFrame(runDragLoop);
  }, [runDragLoop, stopDragLoop]);

  // Apply initial scale/shadow and start physics loop on mount
  // (component mounts after drag starts, so handleDragStart won't fire)
  useEffect(() => {
    if (reduced) {
      // No swing and no lift: the card stays locked to the pointer and nothing
      // animates on its own.
      return;
    }

    const cardElement = overlayRef.current?.querySelector(
      "[data-overlay-card]"
    ) as HTMLElement | null;

    // Animate scale on the scale wrapper
    const scaleAnimation = scaleRef.current?.animate(
      [{ transform: "scale(1)" }, { transform: `scale(${LIFT_SCALE})` }],
      { duration: LIFT_DURATION, easing: LIFT_EASING, fill: "forwards" }
    );

    // Animate shadow on the card element
    const shadowAnimation = cardElement?.animate(
      [{ boxShadow: NO_SHADOW }, { boxShadow: LIFT_SHADOW }],
      { duration: LIFT_DURATION, easing: LIFT_EASING, fill: "forwards" }
    );

    startDragLoop();

    return () => {
      stopDragLoop();
      scaleAnimation?.cancel();
      shadowAnimation?.cancel();
    };
  }, [reduced, startDragLoop, stopDragLoop]);

  const handleDragStart = useCallback(
    (_event: DragStartEvent) => {
      if (reduced) {
        return;
      }
      startDragLoop();
    },
    [reduced, startDragLoop]
  );

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    pointerXRef.current = event.delta.x;
  }, []);

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      stopDragLoop();

      // Rotation the card was sitting at the moment the pointer let go, so the
      // settle can spring out of it rather than snapping upright first.
      const currentRotation = reduced
        ? 0
        : (springRef.current?.getValue() ?? 0);

      // Capture the overlay position for the settling animation. We need the
      // actual card element inside the overlay.
      const cardElement = overlayRef.current?.querySelector(
        "[data-overlay-card]"
      ) as HTMLElement | null;
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        // getBoundingClientRect reports the scaled box, so divide the lift back
        // out to get the card's true size.
        const unscaledRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width / liftScale,
          height: rect.height / liftScale,
        };
        store.startSettling(unscaledRect, currentRotation);
      }

      // Reset tracking state
      pointerXRef.current = 0;
      lastFrameXRef.current = 0;
      smoothedVelocityRef.current = 0;
    },
    [store, reduced, liftScale, stopDragLoop]
  );

  useDndMonitor({
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragEnd,
  });

  return { overlayRef, scaleRef, liftScale };
}
