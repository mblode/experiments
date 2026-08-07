"use client";

import {
  BeautifulQRCode,
  type BeautifulQRCodeRef,
} from "@beautiful-qr-code/react";
import { Check, Download } from "blode-icons-react";
import { formatHex, oklch } from "culori";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const GRID_SIZE = 4;
const COLORS_PER_ROW = 4;
const CHROMATIC_COLORS = 16;
const HUE_STEP = 360 / CHROMATIC_COLORS;
const OKLCH_REGEX = /oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/;

/**
 * The grid is a colour-only choice, so every swatch needs a name that survives
 * being read aloud. These track the OKLCH hue circle, not the HSL one.
 */
const HUE_NAMES = [
  "Red",
  "Orange",
  "Amber",
  "Gold",
  "Yellow",
  "Lime",
  "Green",
  "Emerald",
  "Teal",
  "Cyan",
  "Sky",
  "Blue",
  "Indigo",
  "Violet",
  "Purple",
  "Magenta",
] as const;

const GRAYSCALE_NAMES = ["Black", "Dark grey", "Light grey", "White"] as const;

const RADIUS_OPTIONS = [
  { value: 0, label: "Square" },
  { value: 0.5, label: "Rounded" },
  { value: 1, label: "Circular" },
] as const;

/** ease-out-quart, and a stagger that finishes inside 300ms. */
const EASE_OUT = "cubic-bezier(.165, .84, .44, 1)";
const EASE_OUT_POINTS = [0.165, 0.84, 0.44, 1] as [
  number,
  number,
  number,
  number,
];
const BAR_STAGGER = 0.04;

const SWATCH_FOCUS =
  "outline-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline";

export function formatOklch(
  lightness: number,
  chroma: number,
  hue: number
): string {
  return `oklch(${lightness} ${chroma} ${hue})`;
}

export function createBackgroundColor(foregroundColor: string): string {
  const { l, c, h } = parseOklch(foregroundColor);

  // If foreground is light (>= 0.8), use a dark background
  if (l >= 0.8) {
    return formatOklch(0.15, c * 0.5, h); // Dark background with subtle hue
  }

  // If foreground is dark, use a light background
  return formatOklch(0.98, c * 0.3, h); // Light background with very subtle hue
}

// Generate color palette with OKLCH colors
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

// Generate saturation levels based on current hue
const generateSaturationLevels = (hue: number): SaturationLevel[] => [
  { sat: 0.25, lightness: 0.58, hue },
  { sat: 0.2, lightness: 0.6, hue },
  { sat: 0.15, lightness: 0.62, hue },
  { sat: 0.1, lightness: 0.65, hue },
  { sat: 0.05, lightness: 0.68, hue },
];

// Grayscale colors
const GRAYSCALE_LIGHTNESS_LEVELS = [0, 0.33, 0.66, 1.0] as const;

const generateGrayscaleRow = (): Color[] => {
  return GRAYSCALE_LIGHTNESS_LEVELS.map((lightness) => ({
    hue: 0,
    saturation: 0,
    lightness,
    oklch: `oklch(${lightness} 0 0)`,
  }));
};

// Helper to parse OKLCH string
const parseOklch = (
  oklchString: string
): { l: number; c: number; h: number } => {
  const match = oklchString.match(OKLCH_REGEX);
  if (!match) {
    return { l: 0.65, c: 0.2, h: 0 };
  }
  return {
    l: Number.parseFloat(match[1]),
    c: Number.parseFloat(match[2]),
    h: Number.parseFloat(match[3]),
  };
};

// Helper to convert OKLCH to hex for QR code
export function oklchToHex(l: number, c: number, h: number): string {
  try {
    const color = oklch({ l, c, h, mode: "oklch" });
    return formatHex(color) || "#000000";
  } catch {
    return "#000000";
  }
}

export function QRCodeBlock() {
  const reduceMotion = useReducedMotion();
  const [url, setUrl] = useState("https://example.com");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [rememberedSaturationIndex, setRememberedSaturationIndex] = useState(2); // Start at middle saturation
  const [radius, setRadius] = useState<0 | 0.5 | 1>(1);

  // Ref for QR code component to access download methods
  const qrRef = useRef<BeautifulQRCodeRef>(null);

  // Generate color palette based on remembered saturation index
  const selectedSaturation = useMemo(() => {
    // Get a reference hue from selected color index (use default if grayscale)
    const isGrayscale = selectedColorIndex >= CHROMATIC_COLORS;
    const tempHue = isGrayscale ? 0 : selectedColorIndex * HUE_STEP;
    const levels = generateSaturationLevels(tempHue);
    return levels[rememberedSaturationIndex].sat;
  }, [rememberedSaturationIndex, selectedColorIndex]);

  const colorPalette = useMemo(
    () => [
      ...generateColorPalette(selectedSaturation),
      ...generateGrayscaleRow(),
    ],
    [selectedSaturation]
  );

  const selectedColor = colorPalette[selectedColorIndex];

  // Get current color's OKLCH values from the dynamic palette
  const currentOklch = useMemo(() => {
    return selectedColor
      ? parseOklch(selectedColor.oklch)
      : { l: 0.65, c: 0.15, h: 0 };
  }, [selectedColor]);

  const saturationLevels = useMemo(
    () => generateSaturationLevels(currentOklch.h),
    [currentOklch.h]
  );

  const saturationIndex = rememberedSaturationIndex;

  // Safety check - don't render QR if color is undefined
  const hasValidColor = selectedColor?.oklch && selectedColor.oklch.length > 0;

  const handleColorSelect = useCallback((index: number) => {
    setSelectedColorIndex(index);
  }, []);

  // Cycle through saturation levels, wrapping back to 0. The bars that
  // reappear on the wrap stagger themselves in as they mount, so there is no
  // "is it mid-animation" flag shadowing the index.
  const handleSaturationClick = useCallback(() => {
    setRememberedSaturationIndex((prev) =>
      prev === saturationLevels.length - 1 ? 0 : prev + 1
    );
  }, [saturationLevels.length]);

  // Download handlers
  const handleDownloadPNG = useCallback(() => {
    qrRef.current?.download({ name: "qr-code", extension: "png" });
  }, []);

  const handleDownloadSVG = useCallback(() => {
    qrRef.current?.download({ name: "qr-code", extension: "svg" });
  }, []);

  // Ensure URL is valid for QR code rendering
  const validUrl = url.trim() || "https://example.com";

  // Convert OKLCH to hex for the QR code
  const qrColor = useMemo(() => {
    if (!hasValidColor) {
      return "#000000";
    }
    const { l, c, h } = parseOklch(selectedColor.oklch);
    return oklchToHex(l, c, h);
  }, [hasValidColor, selectedColor]);

  // Generate contrasting background color
  const backgroundColor = useMemo(() => {
    if (!hasValidColor) {
      return "#ffffff";
    }
    const bgOklch = createBackgroundColor(selectedColor.oklch);
    const { l, c, h } = parseOklch(bgOklch);
    return oklchToHex(l, c, h);
  }, [hasValidColor, selectedColor]);

  return (
    <div className="grid gap-1 p-1 lg:grid-cols-2">
      {/* Left: QR Preview */}
      <div
        className="relative flex items-center justify-center rounded-3xl p-12"
        style={{ background: backgroundColor }}
      >
        <div className="relative flex aspect-square w-full max-w-[200px] items-center justify-center lg:max-w-[280px]">
          {hasValidColor ? (
            <BeautifulQRCode
              backgroundColor={backgroundColor}
              className="flex aspect-square w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full"
              data={validUrl}
              foregroundColor={qrColor}
              hasLogo={!!imageUrl}
              logoUrl={imageUrl || undefined}
              padding={5}
              radius={radius}
              ref={qrRef}
            />
          ) : (
            <p className="flex aspect-square w-full max-w-sm items-center justify-center text-muted-foreground">
              Enter data to generate QR code
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center justify-center rounded-3xl bg-muted px-4 py-10 lg:px-8">
        <div className="mx-auto w-full max-w-[600px] space-y-1">
          {/* URL Input */}
          <Field
            className="min-h-12 gap-0 rounded-full bg-card"
            orientation="horizontal"
          >
            <FieldLabel className="w-32 shrink-0 cursor-pointer py-2 pr-3 pl-6">
              URL
            </FieldLabel>
            <Input
              className="h-12 rounded-full border-0 bg-transparent! focus-visible:ring-0"
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              value={url}
            />
          </Field>

          {/* Image URL Input */}
          <Field
            className="min-h-12 gap-0 rounded-full bg-card"
            orientation="horizontal"
          >
            <FieldLabel className="w-32 shrink-0 cursor-pointer py-2 pr-3 pl-6">
              Image URL
            </FieldLabel>
            <Input
              className="h-12 rounded-full border-0 bg-transparent! focus-visible:ring-0"
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              value={imageUrl}
            />
          </Field>

          {/* Hue and Saturation Picker */}
          <div className="flex flex-row flex-wrap items-start justify-between gap-2 rounded-3xl bg-card p-2">
            <Label className="px-4 py-3">Hue and saturation</Label>

            <div className="flex size-full min-w-[264px] gap-2 sm:max-w-[264px]">
              {/* Color grid */}
              <div
                aria-label="Foreground colour"
                className="flex min-w-0 flex-1 flex-col gap-2"
                role="group"
              >
                {[0, 1, 2, 3].map((row) => {
                  const selectedRow = Math.floor(selectedColorIndex / 4);
                  const selectedCol = selectedColorIndex % 4;
                  const isSelectedRow = row === selectedRow;
                  const rowHeight = isSelectedRow ? 72 : 36;

                  return (
                    <div
                      className="flex gap-2"
                      key={row}
                      style={{
                        height: rowHeight,
                        // A deliberate size tween: the row growing is how the
                        // selected swatch reads without relying on its colour.
                        transition: reduceMotion
                          ? "none"
                          : `height 0.3s ${EASE_OUT}`,
                      }}
                    >
                      {[0, 1, 2, 3].map((col) => {
                        const index = row * 4 + col;
                        const color = colorPalette[index];
                        const isSelected = selectedColorIndex === index;
                        const isSelectedCol = col === selectedCol;

                        const widthFraction = isSelectedCol ? 2 : 1;
                        const totalFractions = 5;
                        const widthPercent =
                          (widthFraction / totalFractions) * 100;

                        return (
                          <button
                            aria-label={HUE_NAMES[index]}
                            aria-pressed={isSelected}
                            className={`relative cursor-pointer overflow-hidden active:scale-95 motion-reduce:active:scale-100 ${SWATCH_FOCUS}`}
                            key={index}
                            onClick={() => handleColorSelect(index)}
                            style={{
                              backgroundColor: color.oklch,
                              borderRadius: 20,
                              border: "none",
                              height: "100%",
                              width: `${widthPercent}%`,
                              transition: reduceMotion
                                ? "none"
                                : `width 0.3s ${EASE_OUT}, transform 0.15s ${EASE_OUT}`,
                            }}
                            type="button"
                          >
                            {isSelected && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Check
                                  aria-hidden="true"
                                  className="relative z-10 size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                                  strokeWidth={4}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Grayscale row */}
                {(() => {
                  const selectedRow = Math.floor(
                    selectedColorIndex / COLORS_PER_ROW
                  );
                  const selectedCol = selectedColorIndex % COLORS_PER_ROW;
                  const grayscaleRow = GRID_SIZE;
                  const isSelectedRow = selectedRow === grayscaleRow;
                  const rowHeight = isSelectedRow ? 72 : 36;

                  return (
                    <div
                      className="flex gap-2"
                      style={{
                        height: rowHeight,
                        transition: reduceMotion
                          ? "none"
                          : `height 0.3s ${EASE_OUT}`,
                      }}
                    >
                      {generateGrayscaleRow().map((color, col) => {
                        const grayscaleIndex = CHROMATIC_COLORS + col;
                        const isSelected =
                          selectedColorIndex === grayscaleIndex;
                        const isSelectedCol = col === selectedCol;

                        const widthFraction = isSelectedCol ? 2 : 1;
                        const totalFractions = 5;
                        const widthPercent =
                          (widthFraction / totalFractions) * 100;

                        const isWhite = color.lightness >= 0.95;
                        const boxShadow = isWhite
                          ? "inset 0 0 0 1px rgba(0, 0, 0, 0.1)"
                          : "none";

                        return (
                          <button
                            aria-label={GRAYSCALE_NAMES[col]}
                            aria-pressed={isSelected}
                            className={`relative cursor-pointer overflow-hidden active:scale-95 motion-reduce:active:scale-100 ${SWATCH_FOCUS}`}
                            key={grayscaleIndex}
                            onClick={() => handleColorSelect(grayscaleIndex)}
                            style={{
                              backgroundColor: color.oklch,
                              borderRadius: 20,
                              boxShadow,
                              height: "100%",
                              width: `${widthPercent}%`,
                              transition: reduceMotion
                                ? "none"
                                : `width 0.3s ${EASE_OUT}, transform 0.15s ${EASE_OUT}`,
                            }}
                            type="button"
                          >
                            {isSelected && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Check
                                  className={`relative z-10 size-4 ${
                                    color.lightness < 0.5
                                      ? "text-white"
                                      : "text-black"
                                  }`}
                                  strokeWidth={4}
                                />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Saturation selector */}
              <button
                aria-label={`Saturation, level ${
                  saturationLevels.length - saturationIndex
                } of ${saturationLevels.length}. Activate to cycle.`}
                className={`cursor-pointer bg-secondary p-2 transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:active:scale-100 ${SWATCH_FOCUS}`}
                onClick={handleSaturationClick}
                style={{
                  borderRadius: 20,
                  width: 64,
                }}
                type="button"
              >
                <div className="flex h-full flex-col justify-end gap-2">
                  {/* initial={false} so the stack only cascades in when the
                      cycle wraps, never unprompted on first paint. */}
                  <AnimatePresence initial={false}>
                    {saturationLevels.map((level, index) => {
                      if (index < saturationIndex) {
                        return null;
                      }

                      // Bottom bar lands first, the stack fills upward.
                      const fromBottom = saturationLevels.length - 1 - index;
                      const levelKey = `${level.hue}-${level.sat}-${level.lightness}`;

                      return (
                        <motion.div
                          animate={{ scaleY: 1, opacity: 1 }}
                          className="relative origin-bottom"
                          initial={
                            reduceMotion
                              ? { opacity: 0 }
                              : { scaleY: 0, opacity: 0 }
                          }
                          key={levelKey}
                          style={{
                            backgroundColor: `oklch(${level.lightness} ${level.sat} ${level.hue})`,
                            borderRadius: 12,
                            height: 40,
                            border: "none",
                          }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.15,
                            ease: EASE_OUT_POINTS,
                            delay: reduceMotion ? 0 : fromBottom * BAR_STAGGER,
                          }}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </button>
            </div>
          </div>

          {/* Corner Radius */}
          <div className="flex min-h-12 w-full flex-row rounded-3xl bg-card">
            <Label className="w-32 shrink-0 py-3 pr-3 pl-6">Corners</Label>

            <div
              aria-label="Corners"
              className="flex w-full flex-row items-center justify-end"
              role="group"
            >
              {RADIUS_OPTIONS.map(({ value, label }) => {
                const SIZE = 40;
                const isSelected = radius === value;
                const isWhite =
                  hasValidColor && selectedColor.lightness >= 0.95;
                const boxShadow = isWhite
                  ? "inset 0 0 0 1px rgba(0, 0, 0, 0.1)"
                  : "none";
                const colorOklch = hasValidColor
                  ? selectedColor.oklch
                  : "oklch(0 0 0)";

                return (
                  <button
                    aria-label={label}
                    aria-pressed={isSelected}
                    className={`cursor-pointer rounded-full py-2 pr-2 ${SWATCH_FOCUS}`}
                    key={value}
                    onClick={() => setRadius(value)}
                    type="button"
                  >
                    <span
                      className="relative block transition-transform duration-200 ease-out active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 [@media(hover:hover)]:hover:scale-105"
                      style={{
                        borderRadius: (value * SIZE) / 2,
                        background: colorOklch,
                        boxShadow,
                        width: SIZE,
                        height: SIZE,
                      }}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check
                            aria-hidden="true"
                            className={`relative z-10 size-4 ${
                              hasValidColor && selectedColor.lightness < 0.7
                                ? "text-white"
                                : "text-black"
                            }`}
                            strokeWidth={4}
                          />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex min-h-12 w-full flex-row rounded-3xl bg-card">
            <Label className="w-32 shrink-0 py-3 pr-3 pl-6">Download</Label>

            <div className="flex w-full flex-row items-center justify-end gap-2 pr-2">
              <button
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 transition-[background-color,transform] duration-200 ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 [@media(hover:hover)]:hover:bg-secondary/70 ${SWATCH_FOCUS}`}
                aria-label="Download SVG"
                onClick={handleDownloadSVG}
                type="button"
              >
                <Download aria-hidden="true" className="size-4" />
                <span className="font-medium text-sm">SVG</span>
              </button>

              <button
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 transition-[background-color,transform] duration-200 ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 [@media(hover:hover)]:hover:bg-secondary/70 ${SWATCH_FOCUS}`}
                aria-label="Download PNG"
                onClick={handleDownloadPNG}
                type="button"
              >
                <Download aria-hidden="true" className="size-4" />
                <span className="font-medium text-sm">PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
