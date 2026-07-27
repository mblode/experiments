"use client";

import { useCallback, useRef, useState } from "react";

import type {
  AnimationConfig,
  Point2D,
  UseFlipAnimationReturn,
} from "../types";
import { bezier, lerp } from "../utils/geometry";

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Circular ease-out easing function (from turn.js animatef)
 * Original: c * Math.sqrt(1 - (t = t / d - 1) * t) + b
 *
 * @param t - Current time (0 to duration)
 * @param b - Beginning value
 * @param c - Change in value (to - from)
 * @param d - Duration
 */
function circularEaseOut(t: number, b: number, c: number, d: number): number {
  const normalizedT = t / d - 1;
  return c * Math.sqrt(1 - normalizedT * normalizedT) + b;
}

/**
 * Normalized easing (0 to 1 input, 0 to 1 output)
 */
function easeOut(progress: number): number {
  return circularEaseOut(progress, 0, 1, 1);
}

// ============================================================================
// Animation Hook
// ============================================================================

/**
 * Hook for requestAnimationFrame-based flip animation
 * Replaces turn.js animatef which uses setInterval
 */
export function useFlipAnimation(): UseFlipAnimationReturn {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const configRef = useRef<AnimationConfig | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Stop any running animation
   */
  const stop = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    configRef.current = null;
    setIsAnimating(false);
  }, []);

  /**
   * Start an animation
   */
  const animate = useCallback(
    (config: AnimationConfig) => {
      // Stop any existing animation
      stop();

      configRef.current = config;
      startTimeRef.current = 0;
      setIsAnimating(true);

      const { from, to, duration, onFrame, onComplete, useBezier } = config;

      /**
       * Animation frame callback
       */
      const tick = (timestamp: number) => {
        // Initialize start time on first frame
        if (startTimeRef.current === 0) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const rawProgress = Math.min(1, elapsed / duration);

        // Apply easing
        const easedProgress = easeOut(rawProgress);

        // Calculate current point
        let currentPoint: Point2D;

        if (useBezier) {
          // Use bezier curve for page turn path (turn.js line 1829)
          // turn.js uses bezier(p1, p1, p4, p4, t) - a degenerate bezier
          // which effectively produces a straight line from p1 to p4
          // but with the bezier math applied for consistent behavior
          const p1 = from;
          const p4 = to;

          currentPoint = bezier(p1, p1, p4, p4, easedProgress);
        } else {
          // Linear interpolation with easing
          currentPoint = lerp(from, to, easedProgress);
        }

        // Call frame callback with current point
        onFrame(currentPoint);

        // Check if animation is complete
        if (rawProgress < 1) {
          // Continue animation
          animationRef.current = requestAnimationFrame(tick);
        } else {
          // Animation complete
          animationRef.current = null;
          configRef.current = null;
          setIsAnimating(false);
          onComplete();
        }
      };

      // Start animation loop
      animationRef.current = requestAnimationFrame(tick);
    },
    [stop]
  );

  return {
    animate,
    stop,
    isAnimating,
  };
}

// ============================================================================
// Utility: Animate with Promise
// ============================================================================

/**
 * Promise-based animation utility
 * Useful for sequential animations
 */
export function animateAsync(
  animateFn: (config: AnimationConfig) => void,
  config: Omit<AnimationConfig, "onComplete">
): Promise<void> {
  return new Promise((resolve) => {
    animateFn({
      ...config,
      onComplete: resolve,
    });
  });
}
