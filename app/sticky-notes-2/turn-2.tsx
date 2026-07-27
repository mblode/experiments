"use client";

import type { HTMLAttributes } from "react";
import { Children, useMemo } from "react";

import { useFlipbook } from "./hooks/use-flipbook";
import type { FlipbookProps } from "./types";
import { calculateWrapperHeight } from "./utils/geometry";

// ============================================================================
// Flipbook Component
// ============================================================================

/**
 * React Flipbook component with page-flip animation
 * Ported from turn.js jQuery library
 *
 * Features:
 * - Single page display mode
 * - Bottom-right corner flip
 * - Gradient shadows for depth
 * - Touch and mouse support
 * - Smooth requestAnimationFrame animations
 *
 * DOM Structure (matching turn.js):
 * container
 * ├── nextPage (z-index: 1, revealed underneath)
 * ├── wrapper (clips current page, counter-rotates)
 * │   └── currentPage (rotates + translates)
 * │       └── frontGradient
 * └── foldWrapper (fwrapper, counter-rotates)
 *     └── foldPageContainer (fpage.parent())
 *         └── foldPage (fpage, double-rotated)
 *             └── folding (90° rotated next page content)
 *                 └── next page content
 *             └── backGradient
 */
export function Flipbook({
  width,
  height,
  duration = 600,
  cornerSize = 100,
  gradients = true,
  children,
  onPageChange,
  className,
}: FlipbookProps) {
  type FlipbookHandlers = Pick<
    HTMLAttributes<HTMLDivElement>,
    "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerLeave"
  >;

  // Convert children to array
  const pages = useMemo(() => Children.toArray(children), [children]);

  // Main flipbook hook
  const {
    containerRef,
    currentPage,
    flipState,
    foldGeometry,
    pageTransforms,
    nextPage: _nextPage,
    previousPage: _previousPage,
    goToPage: _goToPage,
    _handlers,
  } = useFlipbook({
    totalPages: pages.length,
    width,
    height,
    duration,
    cornerSize,
    gradients,
    onPageChange,
  }) as ReturnType<typeof useFlipbook> & { _handlers: FlipbookHandlers };

  // Calculate wrapper height for fold element
  const _wrapperHeight = useMemo(
    () => calculateWrapperHeight(width, height),
    [width, height]
  );

  // Check if we can show the flip animation
  const showFlipAnimation =
    flipState.isFlipping && foldGeometry && pageTransforms;
  const hasNextPage = currentPage < pages.length - 1;

  return (
    <div
      className={className}
      ref={containerRef}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        perspective: "2000px",
        touchAction: "none", // Prevent browser gestures
        userSelect: "none",
      }}
      {..._handlers}
    >
      {/* Layer 1: Next page (revealed underneath during flip) */}
      {hasNextPage && (
        <div
          className="flipbook-page flipbook-page-next"
          style={{
            position: "absolute",
            inset: 0,
            width,
            height,
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {pages[currentPage + 1]}
        </div>
      )}

      {/* Layer 2: Wrapper (clips current page during fold, counter-rotates) */}
      <div
        className="flipbook-wrapper"
        style={
          showFlipAnimation
            ? pageTransforms.wrapper
            : {
                position: "absolute",
                inset: 0,
                width,
                height,
                zIndex: 2,
                overflow: "hidden",
              }
        }
      >
        {/* Current page (inside wrapper, transforms applied during flip) */}
        <div
          className="flipbook-page flipbook-page-current"
          style={
            showFlipAnimation
              ? {
                  ...pageTransforms.currentPage,
                  overflow: "hidden",
                }
              : {
                  position: "absolute",
                  inset: 0,
                  width,
                  height,
                  overflow: "hidden",
                }
          }
        >
          {pages[currentPage]}

          {/* Front gradient (shadow on the fold) */}
          {showFlipAnimation && gradients && (
            <div
              className="flipbook-gradient-front"
              style={pageTransforms.frontGradient}
            />
          )}
        </div>
      </div>

      {/* Layer 3: Fold wrapper (fwrapper - during animation only) */}
      {showFlipAnimation && hasNextPage && (
        <div
          className="flipbook-fold-wrapper"
          style={pageTransforms.foldWrapper}
        >
          {/* Fold page container (fpage.parent()) */}
          <div
            className="flipbook-fold-page-container"
            style={pageTransforms.foldPageContainer}
          >
            {/* Fold page (fpage - double rotation) */}
            <div className="flipbook-fold-page" style={pageTransforms.foldPage}>
              {/* Folding content (90° rotated next page) */}
              <div className="flipbook-folding" style={pageTransforms.folding}>
                {pages[currentPage + 1]}
              </div>

              {/* Back gradient (shadow on revealed page) */}
              {gradients && (
                <div
                  className="flipbook-gradient-back"
                  style={pageTransforms.backGradient}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Corner hint indicator */}
      {hasNextPage && !flipState.isFlipping && (
        <div
          className="flipbook-corner-hint"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: cornerSize,
            height: cornerSize,
            cursor: "pointer",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
