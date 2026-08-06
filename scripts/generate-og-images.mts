import { mkdir } from "node:fs/promises";
import path from "node:path";

import { type BrowserContext, chromium, type Page } from "playwright";

import {
  openBlock,
  PREPARE,
  PUBLIC_DIR,
  requireServer,
  settle,
  targetSlugs,
} from "./capture-shared.mts";

const OUTPUT_DIR = path.join(PUBLIC_DIR, "og");

const slugs = targetSlugs();

const capture = async (
  context: BrowserContext,
  slug: string
): Promise<void> => {
  const page: Page = await context.newPage();
  await openBlock(page, slug);
  // Best-effort: a failed interaction shouldn't abort the whole batch
  await PREPARE[slug]?.(page).catch((error: unknown) =>
    console.warn(`  prepare(${slug}) failed: ${String(error).split("\n")[0]}`)
  );
  await settle(page, slug);
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${slug}.png`) });
  await page.close();
  console.log(`✓ ${slug}`);
};

await requireServer();

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
