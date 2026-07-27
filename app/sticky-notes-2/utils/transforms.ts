import type { CSSProperties } from "react";

import type { FoldGeometry, PageTransforms, Point2D } from "../types";

// ============================================================================
// 3D Support Detection
// ============================================================================

/**
 * Detect if browser supports 3D transforms
 */
function has3dSupport(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return (
    "WebKitCSSMatrix" in window ||
    "MozPerspective" in document.body.style ||
    "perspective" in document.body.style
  );
}

const has3d = has3dSupport();

// ============================================================================
// Transform String Generators (ported from turn.js lines 156-165)
// ============================================================================

/**
 * Generate CSS translate transform string
 * Uses translate3d for hardware acceleration when available
 */
export function translate(x: number, y: number, use3d = true): string {
  return has3d && use3d
    ? ` translate3d(${x}px, ${y}px, 0px) `
    : ` translate(${x}px, ${y}px) `;
}

/**
 * Generate CSS rotate transform string
 */
export function rotate(degrees: number): string {
  return ` rotate(${degrees}deg) `;
}

// ============================================================================
// Gradient Generation (simplified from turn.js gradient function)
// ============================================================================

interface GradientStop {
  position: number; // 0 to 1
  color: string;
}

/**
 * Generate CSS linear gradient for shadow effects
 */
export function createGradient(
  p0: Point2D,
  p1: Point2D,
  stops: GradientStop[]
): string {
  // Calculate angle from points
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const angle = Math.atan2(dy, dx);
  const angleDeg = (angle * 180) / Math.PI;

  // Build color stops string
  const colorStops = stops
    .map((stop) => `${stop.color} ${stop.position * 100}%`)
    .join(", ");

  return `linear-gradient(${angleDeg}deg, ${colorStops})`;
}

/**
 * Generate front gradient (shadow on the fold)
 * Based on turn.js lines 1603-1618
 */
export function createFrontGradient(
  geometry: FoldGeometry,
  width: number,
  height: number
): CSSProperties {
  const { gradientOpacity, gradientSize, gradientStartV, alpha } = geometry;
  const A90 = Math.PI / 2;

  // For BR corner: left = false, top = false
  // Start point: (0, 100) - bottom-left
  const p0: Point2D = { x: 0, y: 100 };

  // End point calculation
  const p1: Point2D = {
    x: ((gradientSize * Math.sin(A90 - alpha)) / height) * 100,
    y: 100 - ((gradientSize * Math.cos(A90 - alpha)) / width) * 100,
  };

  const stops: GradientStop[] = [
    { position: gradientStartV, color: "rgba(0,0,0,0)" },
    {
      position: (1 - gradientStartV) * 0.8 + gradientStartV,
      color: `rgba(0,0,0,${0.2 * gradientOpacity})`,
    },
    { position: 1, color: `rgba(255,255,255,${0.2 * gradientOpacity})` },
  ];

  return {
    position: "absolute",
    inset: 0,
    background: createGradient(p0, p1, stops),
    pointerEvents: "none",
  };
}

/**
 * Generate back gradient (shadow on revealed page)
 * Based on turn.js lines 1620-1631
 */
export function createBackGradient(
  geometry: FoldGeometry,
  width: number,
  height: number
): CSSProperties {
  const { gradientOpacity, gradientSize, alpha } = geometry;

  // For BR corner: left = false, top = false
  // Start point: (100, 100) - bottom-right
  const p0: Point2D = { x: 100, y: 100 };

  // End point calculation
  const p1: Point2D = {
    x: 100 - ((gradientSize * Math.sin(alpha)) / width) * 100,
    y: 100 - ((gradientSize * Math.cos(alpha)) / height) * 100,
  };

  const stops: GradientStop[] = [
    { position: 0.8, color: "rgba(0,0,0,0)" },
    { position: 1, color: `rgba(0,0,0,${0.3 * gradientOpacity})` },
  ];

  return {
    position: "absolute",
    inset: 0,
    background: createGradient(p0, p1, stops),
    pointerEvents: "none",
  };
}

// ============================================================================
// Page Transform Generation
// ============================================================================

/**
 * Generate all CSS transforms for the flip animation
 * Based on turn.js _fold function, BR corner case (lines 1665-1672)
 *
 * DOM Structure (from turn.js):
 * container (relative positioning)
 * ├── nextPage (z-index: 1, static, revealed underneath)
 * ├── wrapper (overflow: hidden, contains current page, counter-rotates)
 * │   └── currentPage (transforms: rotate + translate)
 * │       └── frontGradient
 * └── fwrapper (fold wrapper, counter-rotates)
 *     └── fpage container (positioned, rotated)
 *         └── fpage (double-rotated)
 *             └── folding content (90° rotated + translated)
 *             └── backGradient
 *
 * Key transforms from turn.js BR corner (lines 1665-1672):
 * - Wrapper: translate(-tr.x + mvW - aliasingFk, -tr.y + mvH) + rotate(-a)
 * - CurrentPage: rotate(a) + translate(tr.x + aliasingFk, tr.y)
 * - FWrapper: translate(-tr.x + mv.x + mvW, -tr.y + mv.y + mvH) + rotate(-a)
 * - FPage.parent(): rotate(a) + translate(tr.x + df.x - mv.x, tr.y + df.y - mv.y)
 * - FPage: rotate(90 - a * 2)
 * - Folding: rotate(90) + translate(0, -height)
 */
export function generatePageTransforms(
  geometry: FoldGeometry,
  width: number,
  height: number,
  wrapperHeight: number,
  showGradients: boolean
): PageTransforms {
  const { angle, translate: tr, movement: mv, df } = geometry;
  const a = angle;

  // mvW, mvH - adjustment for wrapper size difference (turn.js line 1568-1569)
  // For BR corner: origin is [0, 100] meaning x=0%, y=100%
  const mvW = ((width - wrapperHeight) * 0) / 100; // x origin = 0%
  const mvH = ((height - wrapperHeight) * 100) / 100; // y origin = 100%

  // Anti-aliasing fix (turn.js line 1576)
  // For BR corner (left = false): aliasingFk = 1 (or 0 if angle is exactly 90/-90)
  const aliasingFk = a !== 90 && a !== -90 ? 1 : 0;

  // Container style - positioning context
  const container: CSSProperties = {
    position: "relative",
    width,
    height,
    overflow: "hidden",
  };

  // Wrapper - clips and counter-rotates (turn.js line 1585-1588)
  // This wrapper contains the current page and provides the clipping effect
  const wrapper: CSSProperties = {
    position: "absolute",
    left: 0,
    bottom: 0,
    width,
    height,
    overflow: "hidden",
    transform: `${translate(-tr.x + mvW - aliasingFk, -tr.y + mvH)}${rotate(-a)}`,
    transformOrigin: "0% 100%",
    zIndex: 2,
  };

  // Current page - sits INSIDE wrapper (turn.js line 1580-1582, 1668)
  // Position array [0, 1, 1, 0] = { left: auto, top: 0, right: 0, bottom: auto }
  // Transform: rotate(a) + translate(tr.x + aliasingFk, tr.y)
  const currentPage: CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    left: "auto",
    bottom: "auto",
    width,
    height,
    transform: `${rotate(a)}${translate(tr.x + aliasingFk, tr.y)}`,
    transformOrigin: "0% 100%",
  };

  // Fold wrapper - counter-rotates (turn.js line 1590-1594)
  const foldWrapper: CSSProperties = {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: wrapperHeight,
    height: wrapperHeight,
    overflow: "hidden",
    transform: `${translate(-tr.x + mv.x + mvW, -tr.y + mv.y + mvH)}${rotate(-a)}`,
    transformOrigin: "0% 100%",
    zIndex: 3,
  };

  // Fold page container - fpage.parent() (turn.js line 1595-1601)
  // For BR corner pattern [0, 1, 1, 0]: left: 0, top: auto, right: auto, bottom: 0
  const foldPageContainer: CSSProperties = {
    position: "absolute",
    top: "auto",
    right: "auto",
    left: 0,
    bottom: 0,
    width,
    height,
    overflow: "visible",
    transform: `${rotate(a)}${translate(tr.x + df.x - mv.x, tr.y + df.y - mv.y)}`,
    transformOrigin: "0% 100%",
  };

  // Fold page - fpage (turn.js line 1669)
  const foldPage: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: height, // Note: swapped dimensions for rotation
    height: width,
    transform: rotate(90 - a * 2),
    transformOrigin: "0% 0%",
  };

  // Folding content - the next page rotated 90° (turn.js line 1670)
  const folding: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    transform: `${rotate(90)}${translate(0, -height)}`,
    transformOrigin: "0% 0%",
  };

  // Gradients
  const frontGradient: CSSProperties = showGradients
    ? createFrontGradient(geometry, width, height)
    : { display: "none" };

  const backGradient: CSSProperties = showGradients
    ? createBackGradient(geometry, width, height)
    : { display: "none" };

  return {
    container,
    wrapper,
    currentPage,
    foldWrapper,
    foldPageContainer,
    foldPage,
    folding,
    frontGradient,
    backGradient,
  };
}

// ============================================================================
// Folding Page Transform
// ============================================================================

/**
 * Generate transform for the folding page element
 * Based on turn.js line 1670: folding.transform(rotate(90) + translate(0, -height, ac), "0% 0%")
 */
export function generateFoldingTransform(height: number): CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transform: `${rotate(90)}${translate(0, -height)}`,
    transformOrigin: "0% 0%",
  };
}
