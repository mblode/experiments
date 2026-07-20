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

const slugs = Object.entries(blocks)
  .filter(([, block]) => !block.hidden)
  .map(([slug]) => slug);

const capture = async (
  context: BrowserContext,
  slug: string
): Promise<void> => {
  const page: Page = await context.newPage();
  await page.goto(`${BASE_URL}/${slug}`, { waitUntil: "load" });
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
