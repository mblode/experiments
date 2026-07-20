import { mkdir } from "node:fs/promises";
import path from "node:path";

import { type BrowserContext, chromium, type Page } from "playwright";

import { blocks } from "../lib/blocks.ts";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.join(import.meta.dirname, "..", "public", "og");

const DEFAULT_SETTLE_MS = 2500;
const IDLE_TIMEOUT_MS = 10_000;

// WebGL/texture/tile-heavy demos need longer to finish loading
const SETTLE_OVERRIDES: Record<string, number> = {
  album: 5000,
  dither: 5000,
  "document-shadow": 5000,
  lighting: 5000,
  moon: 5000,
  sky: 5000,
};

// Demos whose interesting UI only appears after interaction. Each triggers the
// demo's characteristic state so the screenshot shows more than a lone button.
const PREPARE: Record<string, (page: Page) => Promise<void>> = {
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
const CENTER = new Set(["animated-button", "staggered-fade", "timed-undo"]);

const CENTER_CSS = `
  .min-h-screen{display:flex!important;align-items:center!important;justify-content:center!important;min-height:100vh!important}
  .min-h-screen > .mx-auto{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important}
`;

// Optional ONLY=slug1,slug2 to regenerate a subset (handy when tuning one demo)
const only = process.env.ONLY?.split(",").map((s) => s.trim());

const slugs = Object.entries(blocks)
  .filter(([, block]) => !block.hidden)
  .map(([slug]) => slug)
  .filter((slug) => !only || only.includes(slug));

const capture = async (
  context: BrowserContext,
  slug: string
): Promise<void> => {
  const page: Page = await context.newPage();
  // ?hideHeader drops the title/description/back-arrow so only the demo shows
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
  // Best-effort: a failed interaction shouldn't abort the whole batch
  await PREPARE[slug]?.(page).catch((error: unknown) =>
    console.warn(`  prepare(${slug}) failed: ${String(error).split("\n")[0]}`)
  );
  await page.waitForTimeout(SETTLE_OVERRIDES[slug] ?? DEFAULT_SETTLE_MS);
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${slug}.png`) });
  await page.close();
  console.log(`✓ ${slug}`);
};

try {
  await fetch(BASE_URL);
} catch {
  console.error(
    `Cannot reach ${BASE_URL} — start the server first (npm run build && npm run start).`
  );
  process.exit(1);
}

await mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  deviceScaleFactor: 2,
  viewport: { width: 1200, height: 630 },
});

// Sequential (not Promise.all) so only one page renders at a time — keeps
// memory/CPU bounded and screenshots deterministic across WebGL-heavy demos.
await slugs.reduce<Promise<void>>(
  (previous, slug) => previous.then(() => capture(context, slug)),
  Promise.resolve()
);

await browser.close();
console.log(`Done — ${slugs.length} images in public/og/`);
