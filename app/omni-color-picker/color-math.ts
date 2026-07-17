import { formatHex } from "culori";

export const HUES = 18;
export const SHADES = 12;

const TAU = Math.PI * 2;
const HUE_STEP = 360 / HUES;

const LIGHTNESS_MID = 0.56;
const LIGHTNESS_RANGE = 0.4;
/** Poles keep a slight tint, so the lightest shade is a pale wash, not pure white. */
const CHROMA_BASE = 0.02;
const CHROMA_RANGE = 0.15;

export const wrap = (value: number, range: number) =>
  ((value % range) + range) % range;

export const cellHue = (h: number) => wrap(h * HUE_STEP, 360);

/**
 * The shade axis is cyclic and seamless: lightness follows a cosine
 * (s=0 lightest → s=SHADES/2 darkest → back), so an infinite vertical
 * drag never hits a white/black seam.
 */
export const shadeLightness = (s: number) =>
  LIGHTNESS_MID + LIGHTNESS_RANGE * Math.cos((TAU * s) / SHADES);

/** Chroma peaks at mid-lightness and thins out toward both poles. */
export const shadeChroma = (s: number) =>
  CHROMA_BASE +
  CHROMA_RANGE * (1 - Math.abs(Math.cos((TAU * s) / SHADES)) ** 1.5);

const okl = (l: number, c: number, h: number) =>
  `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`;

export const cellColor = (h: number, s: number) =>
  okl(shadeLightness(s), shadeChroma(s), cellHue(h));

/**
 * The core drawn inside dots on the selected row — a fully saturated take on
 * the column's hue, independent of shade. Against a pale shade the dot reads
 * as a white ring around a bright core; against a dark shade, a black ring.
 */
export const vividColor = (h: number) => okl(0.62, 0.16, cellHue(h));

const CORE_FADE_FLOOR = 0.55;
const CORE_FADE_CEIL = 0.8;

/**
 * Cores only earn their place at the white and black ends of the shade cycle,
 * where the dot itself has no hue left to show. Through the vivid middle of
 * the cycle the dot already carries the colour, so the core fades out.
 */
export const corePresence = (s: number) => {
  const towardPole = Math.abs(Math.cos((TAU * s) / SHADES));
  const t = (towardPole - CORE_FADE_FLOOR) / (CORE_FADE_CEIL - CORE_FADE_FLOOR);
  return Math.min(Math.max(t, 0), 1);
};

export const cellHex = (h: number, s: number) =>
  formatHex({
    mode: "oklch",
    l: shadeLightness(s),
    c: shadeChroma(s),
    h: cellHue(h),
  });

export interface DemoTheme {
  bg: string;
  fg: string;
  muted: string;
  card: string;
  border: string;
  accent: string;
  accentFg: string;
}

const LIGHT_BG_THRESHOLD = 0.72;

/** Accepts fractional (h, s) so the theme blends continuously mid-drag. */
export const cellTheme = (h: number, s: number): DemoTheme => {
  const hue = cellHue(h);
  const l = shadeLightness(s);
  const c = shadeChroma(s);
  const isLight = l > LIGHT_BG_THRESHOLD;

  const cardL = l + (1 - l) * (isLight ? 0.8 : 0.16);
  const accentIsVivid = isLight;

  return {
    bg: okl(l, c, hue),
    fg: isLight ? okl(0.24, Math.min(c, 0.05), hue) : okl(0.985, 0.006, hue),
    muted: isLight ? okl(0.5, Math.min(c, 0.03), hue) : okl(0.82, 0.03, hue),
    card: okl(cardL, c * (isLight ? 0.3 : 0.85), hue),
    border: isLight
      ? okl(0.9, Math.min(c, 0.02), hue)
      : okl(l + 0.14, c * 0.7, hue),
    accent: accentIsVivid ? okl(0.62, 0.21, hue) : okl(0.93, 0.045, hue),
    accentFg: accentIsVivid ? okl(0.99, 0.005, hue) : okl(0.28, 0.06, hue),
  };
};

/*
 * Fish-eye lens geometry in fixed design coordinates. The panel is square, so
 * the lens is radially symmetric: both axes reuse the arctangent fit measured
 * off the source recording's horizontal axis (dot centres at 115, 203, 268 and
 * 313px from centre, gaps 115 → 88 → 63 → 45). An arctangent fits these to
 * within a couple of px; a spherical R·sin(θu) folds back before the edge.
 */
export const PANEL_WIDTH = 685;
export const PANEL_HEIGHT = PANEL_WIDTH;
export const DOT_MAX = 78;

const LENS_X = { amplitude: 316.7, k: 0.38 };
const LENS_Y = LENS_X;

/** px per cell at the centre of the lens — the 1:1 rate for dragging. */
export const CELL_SPACING_X = LENS_X.amplitude * LENS_X.k;
export const CELL_SPACING_Y = LENS_Y.amplitude * LENS_Y.k;

/** Stay clear of the asymptote, where tan() blows up. */
const MAX_LENS_ANGLE = (Math.PI / 2) * 0.98;

const project = (u: number, { amplitude, k }: typeof LENS_X) =>
  amplitude * Math.atan(k * u);

const unproject = (px: number, { amplitude, k }: typeof LENS_X) =>
  Math.tan(
    Math.min(Math.max(px / amplitude, -MAX_LENS_ANGLE), MAX_LENS_ANGLE)
  ) / k;

/** Lens projection: cell offset → px from panel centre. */
export const projectX = (u: number) => project(u, LENS_X);
export const projectY = (v: number) => project(v, LENS_Y);

/** Inverse projection: px from panel centre → cell offset. */
export const unprojectX = (px: number) => unproject(px, LENS_X);
export const unprojectY = (py: number) => unproject(py, LENS_Y);

/*
 * Measured dot diameters fall off as 78, 59, 28, 10 across cells 0-3, roughly a
 * Gaussian. Sigma is pulled in slightly tighter than the raw fit, and the fade
 * window sits inside the panel edge (~4.8 cells), so dots fade out before they
 * shrink to specks crowding the edge.
 */
const FALLOFF_SIGMA = 1.8;
const FADE_START = 2.6;
const FADE_END = 3.6;

export const dotScale = (d: number) => Math.exp(-((d / FALLOFF_SIGMA) ** 2));

/** Dots keep full colour until they're off the panel; size does the work. */
export const dotOpacity = (d: number) =>
  Math.min(Math.max((FADE_END - d) / (FADE_END - FADE_START), 0), 1);
