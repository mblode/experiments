"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type {
  FlipState,
  FoldGeometry,
  PageTransforms,
  Point2D,
  UseFlipbookOptions,
  UseFlipbookReturn,
} from "../types";
import {
  calculateFold,
  calculateWrapperHeight,
  getCornerPosition,
  getFlipEndPosition,
} from "../utils/geometry";
import { generatePageTransforms } from "../utils/transforms";
import { useCornerDetection } from "./use-corner-detection";
import { useFlipAnimation } from "./use-flip-animation";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 600;
const DEFAULT_CORNER_SIZE = 100;

// ============================================================================
// Main Flipbook Hook
// ============================================================================

/**
 * Main orchestrator hook for the flipbook functionality
 * Combines corner detection, fold geometry, and animation
 */
export function useFlipbook({
  totalPages,
  width,
  height,
  initialPage = 0,
  duration = DEFAULT_DURATION,
  cornerSize = DEFAULT_CORNER_SIZE,
  gradients = true,
  onPageChange,
}: UseFlipbookOptions): UseFlipbookReturn {
  // ============================================================================
  // Refs and State
  // ============================================================================

  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [flipState, setFlipState] = useState<FlipState>({
    isFlipping: false,
    isDragging: false,
    progress: 0,
    currentPage: initialPage,
    foldPoint: null,
  });

  // Calculated wrapper height (diagonal for rotation clipping)
  const wrapperHeight = useMemo(
    () => calculateWrapperHeight(width, height),
    [width, height]
  );

  // Animation hook
  const { animate, stop: _stopAnimation, isAnimating } = useFlipAnimation();

  // ============================================================================
  // Fold Geometry Calculation
  // ============================================================================

  const foldGeometry = useMemo<FoldGeometry | null>(() => {
    if (!flipState.foldPoint) {
      return null;
    }
    return calculateFold(flipState.foldPoint, width, height, wrapperHeight);
  }, [flipState.foldPoint, width, height, wrapperHeight]);

  // ============================================================================
  // Page Transforms
  // ============================================================================

  const pageTransforms = useMemo<PageTransforms | null>(() => {
    if (!foldGeometry) {
      return null;
    }
    return generatePageTransforms(
      foldGeometry,
      width,
      height,
      wrapperHeight,
      gradients
    );
  }, [foldGeometry, width, height, wrapperHeight, gradients]);

  // ============================================================================
  // Page Navigation
  // ============================================================================

  /**
   * Complete the page turn (go to next page)
   */
  const completePageTurn = useCallback(() => {
    const nextPage = currentPage + 1;
    if (nextPage >= totalPages) {
      return;
    }

    setCurrentPage(nextPage);
    setFlipState((prev) => ({
      ...prev,
      isFlipping: false,
      isDragging: false,
      progress: 0,
      currentPage: nextPage,
      foldPoint: null,
    }));

    onPageChange?.(nextPage);
  }, [currentPage, totalPages, onPageChange]);

  /**
   * Cancel the page turn (stay on current page)
   */
  const cancelPageTurn = useCallback(() => {
    setFlipState((prev) => ({
      ...prev,
      isFlipping: false,
      isDragging: false,
      progress: 0,
      foldPoint: null,
    }));
  }, []);

  /**
   * Navigate to next page with animation
   */
  const nextPage = useCallback(() => {
    if (currentPage >= totalPages - 1) {
      return;
    }
    if (isAnimating) {
      return;
    }

    // Start from corner
    const cornerPos = getCornerPosition(width, height);
    const endPos = getFlipEndPosition(width, height);

    setFlipState((prev) => ({
      ...prev,
      isFlipping: true,
      isDragging: false,
      foldPoint: cornerPos,
    }));

    // Animate the page turn
    animate({
      from: cornerPos,
      to: endPos,
      duration,
      useBezier: true,
      onFrame: (point) => {
        setFlipState((prev) => ({
          ...prev,
          foldPoint: point,
        }));
      },
      onComplete: completePageTurn,
    });
  }, [
    currentPage,
    totalPages,
    width,
    height,
    duration,
    isAnimating,
    animate,
    completePageTurn,
  ]);

  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(() => {
    if (currentPage <= 0) {
      return;
    }

    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    setFlipState((prev) => ({
      ...prev,
      currentPage: prevPage,
    }));
    onPageChange?.(prevPage);
  }, [currentPage, onPageChange]);

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page < 0 || page >= totalPages) {
        return;
      }
      if (page === currentPage) {
        return;
      }

      setCurrentPage(page);
      setFlipState((prev) => ({
        ...prev,
        currentPage: page,
      }));
      onPageChange?.(page);
    },
    [totalPages, currentPage, onPageChange]
  );

  // ============================================================================
  // Corner Detection Callbacks
  // ============================================================================

  /**
   * Handle corner activation (pointer enters corner zone or presses)
   */
  const handleCornerActivated = useCallback(
    (point: Point2D) => {
      if (currentPage >= totalPages - 1) {
        return;
      }
      if (isAnimating) {
        return;
      }

      setFlipState((prev) => ({
        ...prev,
        isFlipping: true,
        isDragging: true,
        foldPoint: point,
      }));
    },
    [currentPage, totalPages, isAnimating]
  );

  /**
   * Handle pointer move during drag
   */
  const handlePointerMove = useCallback(
    (point: Point2D) => {
      if (!flipState.isDragging) {
        return;
      }

      setFlipState((prev) => ({
        ...prev,
        foldPoint: point,
      }));
    },
    [flipState.isDragging]
  );

  /**
   * Handle pointer release
   */
  const handlePointerRelease = useCallback(
    (point: Point2D, wasQuickFlip: boolean) => {
      if (!flipState.isFlipping) {
        return;
      }

      // Determine if we should complete or cancel the flip (turn.js lines 1052-1068)
      // Quick flip: always complete (handled by wasQuickFlip - includes time < 200ms and boundary checks)
      // Otherwise: complete only if dragged past left boundary (100% threshold)
      const shouldComplete = wasQuickFlip || point.x < 0;

      if (shouldComplete && currentPage < totalPages - 1) {
        // Animate to completion
        const endPos = getFlipEndPosition(width, height);

        animate({
          from: point,
          to: endPos,
          duration: duration / 2, // Faster completion
          useBezier: false,
          onFrame: (p) => {
            setFlipState((prev) => ({
              ...prev,
              isDragging: false,
              foldPoint: p,
            }));
          },
          onComplete: completePageTurn,
        });
      } else {
        // Animate back to corner (cancel)
        const cornerPos = getCornerPosition(width, height);

        animate({
          from: point,
          to: cornerPos,
          duration: duration / 2, // Faster cancel
          useBezier: false,
          onFrame: (p) => {
            setFlipState((prev) => ({
              ...prev,
              isDragging: false,
              foldPoint: p,
            }));
          },
          onComplete: cancelPageTurn,
        });
      }
    },
    [
      flipState.isFlipping,
      currentPage,
      totalPages,
      width,
      height,
      duration,
      animate,
      completePageTurn,
      cancelPageTurn,
    ]
  );

  /**
   * Handle pointer leave (hover preview cancel)
   */
  const handlePointerLeave = useCallback(() => {
    if (flipState.isDragging) {
      return; // Don't cancel during drag
    }

    if (flipState.isFlipping && !isAnimating) {
      // Cancel hover preview
      cancelPageTurn();
    }
  }, [flipState.isDragging, flipState.isFlipping, isAnimating, cancelPageTurn]);

  // ============================================================================
  // Corner Detection Hook
  // ============================================================================

  const { handlers } = useCornerDetection({
    containerRef,
    cornerSize,
    width,
    height,
    enabled: currentPage < totalPages - 1,
    onCornerActivated: handleCornerActivated,
    onPointerMove: handlePointerMove,
    onPointerRelease: handlePointerRelease,
    onPointerLeave: handlePointerLeave,
  });

  // ============================================================================
  // Attach handlers to container ref
  // ============================================================================

  // Store handlers for the component to use
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // ============================================================================
  // Return
  // ============================================================================

  return {
    containerRef,
    currentPage,
    flipState,
    foldGeometry,
    pageTransforms,
    nextPage,
    previousPage,
    goToPage,
    // Expose handlers for component to attach
    _handlers: handlers,
  } as UseFlipbookReturn & { _handlers: typeof handlers };
}
