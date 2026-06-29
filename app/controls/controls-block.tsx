"use client";
import { Check } from "lucide-react";
import { motion, type Transition } from "motion/react";
import { useMemo, useState } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Color {
  hue: number;
  saturation: number;
  lightness: number;
  oklch: string;
}

interface SaturationLevel {
  sat: number;
  lightness: number;
  hue: number;
}

type GapPresetKey = "tight" | "cozy" | "roomy";

interface ControlDimensions {
  outerSize: number;
  padding: number;
  markerSize: number;
  innerSize: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_SIZE = 4;
const COLORS_PER_ROW = 4;
const TOTAL_COLORS = 16;
const HUE_STEP = 360 / TOTAL_COLORS;

const GAP_PRESETS: Record<GapPresetKey, string> = {
  tight: "var(--demo-gap-tight)",
  cozy: "var(--demo-gap-cozy)",
  roomy: "var(--demo-gap-roomy)",
};

const GAP_PRESET_KEYS: readonly GapPresetKey[] = ["tight", "cozy", "roomy"];
const CORNER_RADIUS_VALUES = [
  "var(--border-radius-fluid-0)",
  "var(--border-radius-fluid-16)",
  "var(--border-radius-fluid-32)",
  "var(--border-radius-fluid-48)",
  "var(--border-radius-fluid-64)",
] as const;

const SPRING_CONFIG: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 55,
};

// Control dimensions are now defined via CSS variables in globals.css
// These constants are kept for reference and backward compatibility
const _CONTROL_DIMENSIONS: ControlDimensions = {
  outerSize: 205,
  padding: 16,
  markerSize: 24,
  innerSize: 205 - 2 * 16,
};

const ANIMATION_STEP_DURATION = 150;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateColorPalette = (saturation: number): Color[] => {
  const colors: Color[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < COLORS_PER_ROW; col++) {
      const hue = (row * COLORS_PER_ROW + col) * HUE_STEP;
      colors.push({
        hue,
        saturation,
        lightness: 0.65,
        oklch: `oklch(0.65 ${saturation} ${hue})`,
      });
    }
  }
  return colors;
};

const generateSaturationLevels = (hue: number): SaturationLevel[] => [
  { sat: 0.25, lightness: 0.58, hue },
  { sat: 0.2, lightness: 0.6, hue },
  { sat: 0.15, lightness: 0.62, hue },
  { sat: 0.1, lightness: 0.65, hue },
  { sat: 0.05, lightness: 0.68, hue },
];

const createOklchColor = (
  lightness: number,
  saturation: number,
  hue: number
): string => `oklch(${lightness} ${saturation} ${hue})`;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to manage color and saturation state with wrap-around animation
 */
const useColorState = () => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [saturationIndex, setSaturationIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const saturationLevels = useMemo(() => {
    const hue = selectedColorIndex * HUE_STEP;
    return generateSaturationLevels(hue);
  }, [selectedColorIndex]);

  const selectedSaturation = saturationLevels[saturationIndex].sat;
  const colorPalette = useMemo(
    () => generateColorPalette(selectedSaturation),
    [selectedSaturation]
  );
  const selectedColor = colorPalette[selectedColorIndex];

  const accentColor = createOklchColor(
    saturationLevels[saturationIndex].lightness,
    saturationLevels[saturationIndex].sat,
    selectedColor.hue
  );

  const handleSaturationClick = () => {
    if (isAnimating) {
      return;
    }

    const maxIndex = saturationLevels.length - 1;
    if (saturationIndex === maxIndex) {
      setIsAnimating(true);
      const animationSteps = Array.from(
        { length: maxIndex },
        (_, i) => maxIndex - 1 - i
      );
      animationSteps.forEach((step, index) => {
        setTimeout(
          () => {
            setSaturationIndex(step);
            if (step === 0) {
              setIsAnimating(false);
            }
          },
          (index + 1) * ANIMATION_STEP_DURATION
        );
      });
    } else {
      setSaturationIndex((prev) => prev + 1);
    }
  };

  return {
    selectedColorIndex,
    setSelectedColorIndex,
    saturationIndex,
    saturationLevels,
    colorPalette,
    selectedColor,
    accentColor,
    handleSaturationClick,
  };
};

/**
 * Hook to manage gap and corner radius state
 */
const useLayoutState = () => {
  const [gapPresetIndex, setGapPresetIndex] = useState(1);
  const [cornerRadius, setCornerRadius] = useState<
    (typeof CORNER_RADIUS_VALUES)[number]
  >(CORNER_RADIUS_VALUES[2]);
  const [isCornerHovered, setIsCornerHovered] = useState(false);
  const [isCenterHovered, setIsCenterHovered] = useState(false);

  const gap = GAP_PRESETS[GAP_PRESET_KEYS[gapPresetIndex]];

  const cycleGap = () => {
    setGapPresetIndex((prev) => (prev + 1) % GAP_PRESET_KEYS.length);
  };

  const cycleCornerRadius = () => {
    const currentIndex = CORNER_RADIUS_VALUES.indexOf(cornerRadius);
    const nextIndex = (currentIndex + 1) % CORNER_RADIUS_VALUES.length;
    setCornerRadius(CORNER_RADIUS_VALUES[nextIndex]);
  };

  return {
    gap,
    cornerRadius,
    isCornerHovered,
    setIsCornerHovered,
    isCenterHovered,
    setIsCenterHovered,
    cycleGap,
    cycleCornerRadius,
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ControlsBlock = () => {
  const colorState = useColorState();
  const layoutState = useLayoutState();

  const { accentColor, selectedColor } = colorState;
  const { gap, cornerRadius } = layoutState;

  // Dynamic background colors for new cards
  const darkCardBg = createOklchColor(
    0.35,
    selectedColor.saturation,
    selectedColor.hue
  );
  const lightCardBg = createOklchColor(
    0.85,
    selectedColor.saturation,
    selectedColor.hue
  );

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-start gap-8 p-4 pb-32 sm:p-6 md:gap-12 md:p-8 md:pb-24"
      style={{
        background:
          "linear-gradient(to bottom, rgb(220, 200, 200), rgb(240, 210, 210), rgb(200, 180, 190))",
        position: "relative",
      }}
    >
      {/* Vignette overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Demo Preview Area - 2x2 Grid */}
      <div
        className="relative z-10 grid w-full max-w-5xl grid-cols-1 lg:grid-cols-2"
        style={{ gap }}
      >
        {/* Profile Card */}
        <motion.div
          className="bg-white p-6"
          layout
          style={{
            borderRadius: cornerRadius,
          }}
          transition={SPRING_CONFIG}
        >
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-start justify-between">
              <motion.div
                className="h-20 w-20 overflow-hidden rounded-full"
                style={{ borderRadius: `calc(${cornerRadius} * 1.5)` }}
                transition={SPRING_CONFIG}
              >
                <div className="h-full w-full bg-gradient-to-br from-orange-400 to-pink-400" />
              </motion.div>

              <motion.div
                style={{ color: accentColor }}
                transition={SPRING_CONFIG}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <svg
                  fill="currentColor"
                  height="28"
                  viewBox="0 0 24 24"
                  width="28"
                >
                  <title>Social icon</title>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </motion.div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-2xl text-gray-900">John Smith</h2>
              <p className="text-gray-600">@johnsmith</p>
            </div>

            <div className="flex-1" />

            <motion.div
              className="flex gap-6 bg-gray-50 px-6 py-4"
              style={{
                borderRadius: `max(calc(${cornerRadius} - var(--spacing-fluid-6)), 0px)`,
              }}
              transition={SPRING_CONFIG}
            >
              <div>
                <span className="font-semibold text-gray-900">1.3k</span>
                <span className="ml-1 text-gray-600">Following</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">12.7k</span>
                <span className="ml-1 text-gray-600">Followers</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          className="flex flex-col justify-between p-6 text-white"
          layout
          style={{
            backgroundColor: accentColor,
            borderRadius: cornerRadius,
          }}
          transition={SPRING_CONFIG}
        >
          <div className="flex h-full flex-col gap-6">
            <h2 className="font-bold text-3xl leading-tight sm:text-4xl">
              Hey, I'm John Smith.
              <br />
              I'm a design engineer based in Atlanta. Building something new.
            </h2>
          </div>

          <motion.button
            className="w-full py-4 font-semibold text-lg transition-colors"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: `max(calc(${cornerRadius} - var(--spacing-fluid-6)), 0px)`,
              backdropFilter: "blur(10px)",
            }}
            transition={SPRING_CONFIG}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Say hello
          </motion.button>
        </motion.div>

        {/* Stats Card - Dark Background */}
        <motion.div
          className="p-6 text-white"
          layout
          style={{
            backgroundColor: darkCardBg,
            borderRadius: cornerRadius,
          }}
          transition={SPRING_CONFIG}
        >
          <div className="flex h-full flex-col gap-6">
            <h2 className="font-bold text-2xl">Activity & Stats</h2>

            <div className="flex flex-1 flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Projects Completed</span>
                <span className="font-bold text-3xl">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Code Contributions</span>
                <span className="font-bold text-3xl">2.4k</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Active Streak</span>
                <span className="font-bold text-3xl">120d</span>
              </div>
            </div>

            <motion.div
              className="bg-white/10 px-6 py-4"
              style={{
                borderRadius: `max(calc(${cornerRadius} - var(--spacing-fluid-6)), 0px)`,
                backdropFilter: "blur(10px)",
              }}
              transition={SPRING_CONFIG}
            >
              <p className="text-sm text-white/80">
                Most active in TypeScript, React, and Next.js
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Featured Project Card - Light Background */}
        <motion.div
          className="p-6"
          layout
          style={{
            backgroundColor: lightCardBg,
            borderRadius: cornerRadius,
            color: "#1a1a1a",
          }}
          transition={SPRING_CONFIG}
        >
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-start justify-between">
              <h2 className="font-bold text-2xl">Featured Project</h2>
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10"
                style={{ borderRadius: cornerRadius }}
                whileHover={{ scale: 1.1 }}
              >
                <svg
                  fill="none"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                >
                  <title>External link</title>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
              </motion.div>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <h3 className="font-semibold text-xl">Design System Pro</h3>
              <p className="text-black/70">
                A comprehensive design system with 100+ components, built with
                React and TypeScript. Features dynamic theming and full
                accessibility support.
              </p>
            </div>

            <motion.div
              className="flex flex-wrap gap-2"
              style={{ fontSize: "14px" }}
            >
              {["React", "TypeScript", "Tailwind"].map((tech) => (
                <span
                  className="rounded-full bg-black/10 px-3 py-1 font-medium"
                  key={tech}
                  style={{
                    borderRadius: `max(calc(${cornerRadius} - var(--spacing-fluid-4)), var(--spacing-fluid-2))`,
                  }}
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div
        className="fixed left-1/2 z-50 w-full -translate-x-1/2"
        style={{
          bottom: "var(--control-bottom-spacing)",
          paddingLeft: "var(--spacing-fluid-4)",
          paddingRight: "var(--spacing-fluid-4)",
          maxWidth: "var(--control-container-max-width)",
        }}
      >
        <div
          className="border border-white bg-white/30 p-fluid-4 shadow-2xl backdrop-blur-xl"
          style={{ borderRadius: "var(--border-radius-fluid-50)" }}
        >
          <div className="flex flex-row gap-fluid-6">
            {/* Hue & Saturation Control */}
            <motion.div
              className="flex flex-1 flex-col items-center gap-2"
              layout
            >
              <div
                className="w-full bg-white p-fluid-4 shadow-lg"
                style={{ borderRadius: "var(--border-radius-fluid-34)" }}
              >
                <div className="flex h-full gap-fluid-4">
                  {/* Mixed-shape color grid */}
                  <div className="flex min-w-0 flex-1 flex-col gap-fluid-2">
                    {[0, 1, 2, 3].map((row) => {
                      const selectedRow = Math.floor(
                        colorState.selectedColorIndex / 4
                      );
                      const selectedCol = colorState.selectedColorIndex % 4;
                      const isSelectedRow = row === selectedRow;
                      const rowHeight = isSelectedRow
                        ? "var(--color-row-height-expanded)"
                        : "var(--color-row-height)";

                      return (
                        <motion.div
                          animate={{
                            height: rowHeight,
                          }}
                          className="flex gap-fluid-3"
                          initial={false}
                          key={row}
                          transition={SPRING_CONFIG}
                        >
                          {[0, 1, 2, 3].map((col) => {
                            const index = row * 4 + col;
                            const color = colorState.colorPalette[index];
                            const isSelected =
                              colorState.selectedColorIndex === index;
                            const isSelectedCol = col === selectedCol;

                            // Calculate width based on selection
                            // Total fractions: 1 + 1 + 1 + 2 = 5 when a column is selected
                            // Selected column gets 2 fractions, others get 1 fraction each
                            const widthFraction = isSelectedCol ? 2 : 1;
                            const totalFractions = 5;
                            const widthPercent =
                              (widthFraction / totalFractions) * 100;

                            return (
                              <motion.button
                                aria-label={`Hue ${color.hue}`}
                                className="relative cursor-pointer touch-manipulation overflow-hidden"
                                key={color.hue}
                                onClick={() =>
                                  colorState.setSelectedColorIndex(index)
                                }
                                style={{
                                  backgroundColor: color.oklch,
                                  borderRadius: "var(--color-cell-radius)",
                                  border: "none",
                                  height: "100%",
                                  width: `${widthPercent}%`,
                                  transition:
                                    "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {isSelected && (
                                  <motion.div className="absolute inset-0 flex items-center justify-center">
                                    <Check
                                      className="relative z-10 text-white"
                                      strokeWidth={3.5}
                                      style={{
                                        width: "var(--icon-size-fluid-8)",
                                        height: "var(--icon-size-fluid-8)",
                                      }}
                                    />
                                  </motion.div>
                                )}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Dynamic saturation selector */}
                  <motion.div
                    aria-label="Cycle saturation levels"
                    className="cursor-pointer touch-manipulation border-2 border-gray-300 p-fluid-3"
                    onClick={colorState.handleSaturationClick}
                    style={{
                      borderRadius: "var(--color-cell-radius)",
                      width: "var(--saturation-width)",
                    }}
                    transition={SPRING_CONFIG}
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex h-full flex-col justify-end gap-fluid-2">
                      {colorState.saturationLevels.map((level, index) => {
                        if (index < colorState.saturationIndex) {
                          return null;
                        }

                        return (
                          <motion.div
                            className="pointer-events-none relative"
                            key={`${level.sat}-${level.lightness}`}
                            style={{
                              backgroundColor: `oklch(${level.lightness} ${level.sat} ${level.hue})`,
                              borderRadius: "var(--saturation-radius)",
                              height: "var(--saturation-level-height)",
                              border: "none",
                            }}
                            transition={SPRING_CONFIG}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>
              <p
                className="font-semibold text-base text-white"
                style={{
                  letterSpacing: "0.02em",
                }}
              >
                Hue & Saturation
              </p>
            </motion.div>

            {/* Gap & Corners Control */}
            <motion.div className="flex flex-col items-center gap-2" layout>
              <div
                className="w-full bg-white p-fluid-4 shadow-lg"
                style={{ borderRadius: "var(--border-radius-fluid-34)" }}
              >
                <div
                  className="relative border-2 border-gray-300 bg-gray-50"
                  style={{
                    width: "var(--control-outer-size)",
                    height: "var(--control-outer-size)",
                    borderRadius: "var(--color-cell-radius)",
                    margin: "0 auto",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ padding: "var(--control-padding)" }}
                  >
                    {/* Corner shape outlines */}
                    <div
                      className="pointer-events-none absolute border-4 border-gray-300"
                      style={{
                        top: 0,
                        left: 0,
                        borderLeft: "none",
                        borderTop: "none",
                        width: `calc(50% - ${layoutState.gap} / 2)`,
                        height: `calc(50% - ${layoutState.gap} / 2)`,
                        borderBottomRightRadius: layoutState.cornerRadius,
                        transition:
                          "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-right-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute border-4 border-gray-300"
                      style={{
                        top: 0,
                        right: 0,
                        borderRight: "none",
                        borderTop: "none",
                        width: `calc(50% - ${layoutState.gap} / 2)`,
                        height: `calc(50% - ${layoutState.gap} / 2)`,
                        borderBottomLeftRadius: layoutState.cornerRadius,
                        transition:
                          "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-left-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute border-4 border-gray-300"
                      style={{
                        bottom: 0,
                        left: 0,
                        borderLeft: "none",
                        borderBottom: "none",
                        width: `calc(50% - ${layoutState.gap} / 2)`,
                        height: `calc(50% - ${layoutState.gap} / 2)`,
                        borderTopRightRadius: layoutState.cornerRadius,
                        transition:
                          "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-top-right-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute border-4 border-gray-300"
                      style={{
                        bottom: 0,
                        right: 0,
                        borderRight: "none",
                        borderBottom: "none",
                        width: `calc(50% - ${layoutState.gap} / 2)`,
                        height: `calc(50% - ${layoutState.gap} / 2)`,
                        borderTopLeftRadius: layoutState.cornerRadius,
                        transition:
                          "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-top-left-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />

                    {/* Markers */}
                    {[
                      {
                        top: `calc(25% - ${layoutState.gap} / 4)`,
                        left: `calc(25% - ${layoutState.gap} / 4)`,
                        transform: "translate(-50%, -50%)",
                      },
                      {
                        top: `calc(25% - ${layoutState.gap} / 4)`,
                        right: `calc(25% - ${layoutState.gap} / 4)`,
                        transform: "translate(50%, -50%)",
                      },
                      {
                        bottom: `calc(25% - ${layoutState.gap} / 4)`,
                        left: `calc(25% - ${layoutState.gap} / 4)`,
                        transform: "translate(-50%, 50%)",
                      },
                      {
                        bottom: `calc(25% - ${layoutState.gap} / 4)`,
                        right: `calc(25% - ${layoutState.gap} / 4)`,
                        transform: "translate(50%, 50%)",
                      },
                    ].map((position, _idx) => (
                      <motion.button
                        aria-label="Corner radius control"
                        className="absolute cursor-pointer touch-manipulation"
                        key={`corner-${position.top ?? position.bottom}-${position.left ?? position.right}`}
                        onClick={layoutState.cycleCornerRadius}
                        onHoverEnd={() => layoutState.setIsCornerHovered(false)}
                        onHoverStart={() =>
                          layoutState.setIsCornerHovered(true)
                        }
                        style={{
                          ...position,
                          width: "calc(var(--control-marker-size) * 2)",
                          height: "calc(var(--control-marker-size) * 2)",
                          transition:
                            "top 0.4s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1), right 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {layoutState.isCornerHovered && (
                          <motion.div
                            animate={{ opacity: 1, scale: 1 }}
                            className="-translate-1/2 absolute rounded-full"
                            exit={{ opacity: 0, scale: 0.8 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            style={{
                              border: `var(--control-marker-border-width) solid ${accentColor}`,
                              width: "var(--control-marker-size)",
                              height: "var(--control-marker-size)",
                              top: "50%",
                              left: "50%",
                            }}
                            transition={SPRING_CONFIG}
                          />
                        )}
                        <div
                          className="-translate-1/2 absolute rounded-full"
                          style={{
                            backgroundColor: accentColor,
                            width: "var(--control-marker-dot-size)",
                            height: "var(--control-marker-dot-size)",
                            top: "50%",
                            left: "50%",
                          }}
                        />
                      </motion.button>
                    ))}

                    {/* Center marker */}
                    <motion.button
                      aria-label="Gap control"
                      className="-translate-1/2 absolute z-10 cursor-pointer touch-manipulation"
                      onClick={layoutState.cycleGap}
                      onHoverEnd={() => layoutState.setIsCenterHovered(false)}
                      onHoverStart={() => layoutState.setIsCenterHovered(true)}
                      style={{
                        top: "50%",
                        left: "50%",
                        width: "calc(var(--control-marker-size) * 2)",
                        height: "calc(var(--control-marker-size) * 2)",
                      }}
                      transition={SPRING_CONFIG}
                      whileTap={{ scale: 0.9 }}
                    >
                      {layoutState.isCenterHovered && (
                        <motion.div
                          animate={{ opacity: 1, scale: 1 }}
                          className="-translate-1/2 absolute rounded-full"
                          exit={{ opacity: 0, scale: 0.8 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          style={{
                            border: `var(--control-marker-border-width) solid ${accentColor}`,
                            width: "var(--control-marker-size)",
                            height: "var(--control-marker-size)",
                            top: "50%",
                            left: "50%",
                          }}
                          transition={SPRING_CONFIG}
                        />
                      )}
                      <div
                        className="-translate-1/2 absolute rounded-full"
                        style={{
                          backgroundColor: accentColor,
                          width: "var(--control-marker-dot-size)",
                          height: "var(--control-marker-dot-size)",
                          top: "50%",
                          left: "50%",
                        }}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
              <p
                className="font-semibold text-base text-white"
                style={{
                  letterSpacing: "0.02em",
                }}
              >
                Gap & Corners
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
