import path from "node:path";

import type { Page } from "playwright";

import { blocks } from "../lib/blocks.ts";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
export const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public");

const DEFAULT_SETTLE_MS = 2500;
const IDLE_TIMEOUT_MS = 10_000;

// WebGL/texture/tile-heavy demos need longer to finish loading
export const SETTLE_OVERRIDES: Record<string, number> = {
  album: 5000,
  dither: 5000,
  "document-shadow": 5000,
  lighting: 5000,
  moon: 5000,
  sky: 5000,
};

// Demos whose interesting UI only appears after interaction. Each triggers the
// demo's characteristic state so the screenshot shows more than a lone button.
export const PREPARE: Record<string, (page: Page) => Promise<void>> = {
  "animated-button": (page) =>
    page.getByRole("button", { name: "Follow" }).click(),
  "dynamic-island": (page) =>
    page.getByRole("button", { name: "Timer" }).click(),
  // Progress rail and chapter markers only appear once scrolled past a threshold
  markers: (page) =>
    page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.6 })),
  "password-strength": (page) =>
    page.locator("#password").fill("Str0ng!Pass22"),
  sheet: (page) =>
    page.getByRole("button", { name: "Open multi-stage sheet" }).click(),
  // Label is rendered as per-character spans (StaggeredText), so match the
  // sole button directly rather than by accessible name.
  "timed-undo": (page) => page.locator("button").first().click(),
};

// Small single-element demos that otherwise sit in the top-left corner with a
// lot of empty space — center them in the frame so they read as intentional.
export const CENTER = new Set([
  "animated-button",
  "staggered-fade",
  "timed-undo",
]);

export const CENTER_CSS = `
  .min-h-screen{display:flex!important;align-items:center!important;justify-content:center!important;min-height:100vh!important}
  .min-h-screen > .mx-auto{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important}
`;

/**
 * Every visible block, narrowed by an optional ONLY=slug1,slug2 (handy when
 * tuning one demo rather than regenerating the whole set).
 */
export const targetSlugs = (): string[] => {
  const only = process.env.ONLY?.split(",").map((s) => s.trim());

  return Object.entries(blocks)
    .filter(([, block]) => !block.hidden)
    .map(([slug]) => slug)
    .filter((slug) => !only || only.includes(slug));
};

export const requireServer = async (): Promise<void> => {
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(
      `Cannot reach ${BASE_URL} — start the server first (npm run build && npm run start).`
    );
    process.exit(1);
  }
};

/**
 * Load a demo on its own and wait for it to stop moving for reasons that
 * aren't the demo: `?hideHeader` drops the title/description/back-arrow, then
 * fonts and images have to land before anything is worth capturing.
 */
export const openBlock = async (page: Page, slug: string): Promise<void> => {
  await page.goto(`${BASE_URL}/${slug}?hideHeader=1`, { waitUntil: "load" });
  if (CENTER.has(slug)) {
    await page.addStyleTag({ content: CENTER_CSS });
  }
  // Best-effort: some demos stream assets forever and never go network-idle
  await page
    .waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT_MS })
    .catch(() => undefined);
  await page
    .waitForFunction(
      () =>
        document.fonts.status === "loaded" &&
        Array.from(document.images).every((img) => img.complete),
      { timeout: IDLE_TIMEOUT_MS }
    )
    .catch(() => undefined);
};

export const settle = (page: Page, slug: string): Promise<void> =>
  page.waitForTimeout(SETTLE_OVERRIDES[slug] ?? DEFAULT_SETTLE_MS);
