"use client";

import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useDndMonitor } from "@dnd-kit/core";
import { useCallback, useEffect, useRef } from "react";

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
}

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

  // Initialize spring
  useEffect(() => {
    springRef.current = createSpring({
      stiffness: returnStiffness,
      damping: returnDamping,
    });
  }, [returnStiffness, returnDamping]);

  // Update CSS custom property
  const updateRotation = useCallback((value: number) => {
    if (overlayRef.current) {
      overlayRef.current.style.setProperty("--motion-rotate", `${value}deg`);
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

  // Apply initial scale/shadow and start physics loop on mount
  // (component mounts after drag starts, so handleDragStart won't fire)
  useEffect(() => {
    // Initialize drag state and timing
    isDraggingRef.current = true;
    lastFrameTimeRef.current = performance.now();
    pointerXRef.current = 0;
    lastFrameXRef.current = 0;
    smoothedVelocityRef.current = 0;

    const cardElement = overlayRef.current?.querySelector(
      "[data-overlay-card]"
    ) as HTMLElement | null;

    // Animate scale on the scale wrapper
    if (scaleRef.current) {
      scaleRef.current.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.04)" }],
        {
          duration: 200,
          easing: "cubic-bezier(.2, 0, 0, 1)",
          fill: "forwards",
        }
      );
    }

    // Animate shadow on the card element
    if (cardElement) {
      cardElement.animate(
        [
          { boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
          {
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.15), 0 12px 24px -8px rgba(0,0,0,0.1)",
          },
        ],
        {
          duration: 200,
          easing: "cubic-bezier(.2, 0, 0, 1)",
          fill: "forwards",
        }
      );
    }

    // Start the physics loop
    dragLoopRef.current = requestAnimationFrame(runDragLoop);
  }, [runDragLoop]);

  const handleDragStart = useCallback(
    (_event: DragStartEvent) => {
      // Reset tracking state
      pointerXRef.current = 0;
      lastFrameXRef.current = 0;
      smoothedVelocityRef.current = 0;
      isDraggingRef.current = true;

      // Initialize timing and start physics loop
      lastFrameTimeRef.current = performance.now();
      dragLoopRef.current = requestAnimationFrame(runDragLoop);
    },
    [runDragLoop]
  );

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!springRef.current) {
      return;
    }

    pointerXRef.current = event.delta.x;
  }, []);

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      // Stop the drag loop
      isDraggingRef.current = false;
      if (dragLoopRef.current) {
        cancelAnimationFrame(dragLoopRef.current);
        dragLoopRef.current = null;
      }

      if (!springRef.current) {
        return;
      }

      // Get current rotation value from spring
      const currentRotation = springRef.current.getValue();

      // Capture the overlay position for the settling animation
      // We need to find the actual card element inside the overlay
      const cardElement = overlayRef.current?.querySelector(
        "[data-overlay-card]"
      ) as HTMLElement | null;
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        // Compensate for scale(1.04) to get true unscaled dimensions
        // getBoundingClientRect returns scaled dimensions, so divide by scale factor
        const scale = 1.04;
        const unscaledRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width / scale,
          height: rect.height / scale,
        };
        store.startSettling(unscaledRect, currentRotation);
      }

      // Reset tracking state
      pointerXRef.current = 0;
      lastFrameXRef.current = 0;
      smoothedVelocityRef.current = 0;
    },
    [store]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragLoopRef.current) {
        cancelAnimationFrame(dragLoopRef.current);
      }
    };
  }, []);

  useDndMonitor({
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragEnd,
  });

  return { overlayRef, scaleRef };
}
