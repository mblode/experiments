"use client";

import { useCallback, useRef, useState } from "react";

import type {
  Point2D,
  UseCornerDetectionOptions,
  UseCornerDetectionReturn,
} from "../types";
import { point2D } from "../utils/geometry";

// Quick flip threshold in milliseconds (from turn.js line 1059)
const QUICK_FLIP_THRESHOLD = 200;

/**
 * Hook for detecting pointer interaction with the bottom-right corner
 * Ported from turn.js _cornerActivated, _eventStart, _eventMove, _eventEnd
 */
export function useCornerDetection({
  containerRef,
  cornerSize,
  width,
  height,
  enabled,
  onCornerActivated,
  onPointerMove,
  onPointerRelease,
  onPointerLeave,
}: UseCornerDetectionOptions): UseCornerDetectionReturn {
  const [isInCorner, setIsInCorner] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [pointerPosition, setPointerPosition] = useState<Point2D | null>(null);

  // Track press start time for quick flip detection
  const pressTimeRef = useRef<number>(0);

  /**
   * Get pointer position relative to container
   */
  const getPointerPosition = useCallback(
    (e: React.PointerEvent): Point2D | null => {
      if (!containerRef.current) {
        return null;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left);
      const y = Math.max(0, e.clientY - rect.top);

      return point2D(x, y);
    },
    [containerRef]
  );

  /**
   * Check if position is in the bottom-right corner zone
   * Ported from turn.js _cornerActivated (lines 1238-1267)
   * Simplified for BR corner only
   */
  const isInCornerZone = useCallback(
    (pos: Point2D): boolean => {
      // Check bounds
      if (pos.x <= 0 || pos.y <= 0 || pos.x >= width || pos.y >= height) {
        return false;
      }

      // Check if in bottom zone (y >= height - cornerSize)
      const inBottomZone = pos.y >= height - cornerSize;

      // Check if in right zone (x >= width - cornerSize)
      const inRightZone = pos.x >= width - cornerSize;

      // BR corner: must be in both bottom AND right zones
      return inBottomZone && inRightZone;
    },
    [width, height, cornerSize]
  );

  /**
   * Handle pointer down event
   * Ported from turn.js _eventStart (lines 1853-1864)
   */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) {
        return;
      }

      const pos = getPointerPosition(e);
      if (!pos) {
        return;
      }

      if (isInCornerZone(pos)) {
        // Capture pointer for tracking outside container
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

        setIsPressed(true);
        setIsInCorner(true);
        setPointerPosition(pos);
        pressTimeRef.current = Date.now();

        onCornerActivated?.(pos);

        // Prevent default to avoid text selection during drag
        e.preventDefault();
      }
    },
    [enabled, getPointerPosition, isInCornerZone, onCornerActivated]
  );

  /**
   * Handle pointer move event
   * Ported from turn.js _eventMove (lines 1866-1894)
   */
  const onPointerMoveHandler = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) {
        return;
      }

      const pos = getPointerPosition(e);
      if (!pos) {
        return;
      }

      if (isPressed) {
        // Dragging - update position
        setPointerPosition(pos);
        onPointerMove?.(pos);
      } else {
        // Hover detection - show fold preview when hovering corner
        const inCorner = isInCornerZone(pos);

        if (inCorner !== isInCorner) {
          setIsInCorner(inCorner);

          if (inCorner) {
            // Show corner fold preview at corner origin
            const origin = point2D(
              width - cornerSize / 2,
              height - cornerSize / 2
            );
            setPointerPosition(origin);
            onCornerActivated?.(origin);
          } else {
            setPointerPosition(null);
            onPointerLeave?.();
          }
        }
      }
    },
    [
      enabled,
      getPointerPosition,
      isInCornerZone,
      isPressed,
      isInCorner,
      width,
      height,
      cornerSize,
      onPointerMove,
      onCornerActivated,
      onPointerLeave,
    ]
  );

  /**
   * Handle pointer up event
   * Ported from turn.js _eventEnd (lines 1897-1908) and _released (lines 1052-1068)
   */
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!(enabled && isPressed)) {
        return;
      }

      // Release pointer capture
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

      const pos = getPointerPosition(e);
      const releaseTime = Date.now();
      const pressDuration = releaseTime - pressTimeRef.current;

      // Quick flip detection (from turn.js lines 1059-1061)
      // If press duration < 200ms OR pointer moved past either edge (left or right)
      const wasQuickFlip =
        pressDuration < QUICK_FLIP_THRESHOLD ||
        Boolean(pos && (pos.x < 0 || pos.x > width));

      setIsPressed(false);
      setIsInCorner(false);
      setPointerPosition(null);

      if (pos) {
        onPointerRelease?.(pos, wasQuickFlip);
      }
    },
    [enabled, isPressed, getPointerPosition, onPointerRelease, width]
  );

  /**
   * Handle pointer leave event
   */
  const onPointerLeaveHandler = useCallback(
    (_e: React.PointerEvent) => {
      if (!enabled) {
        return;
      }

      // Only handle hover leave, not drag leave
      if (!isPressed) {
        setIsInCorner(false);
        setPointerPosition(null);
        onPointerLeave?.();
      }
    },
    [enabled, isPressed, onPointerLeave]
  );

  return {
    isInCorner,
    pointerPosition,
    isPressed,
    handlers: {
      onPointerDown,
      onPointerMove: onPointerMoveHandler,
      onPointerUp,
      onPointerLeave: onPointerLeaveHandler,
    },
  };
}
