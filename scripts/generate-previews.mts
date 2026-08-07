// oxlint-disable no-await-in-loop -- Capture is a timeline, not a batch: each
// cursor frame, each re-encode and each demo has to finish before the next one
// starts, and the recording measures the wall clock while they do.
import { execFile } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { chromium, type Locator, type Page } from "playwright";

import {
  openBlock,
  PUBLIC_DIR,
  requireServer,
  settle,
  targetSlugs,
} from "./capture-shared.mts";

const run = promisify(execFile);

const OUTPUT_DIR = path.join(PUBLIC_DIR, "previews");
const WORK_DIR = path.join(os.tmpdir(), "experiments-previews");

// Square, matching the card frame on the index. 1024 wide so `max-w-4xl`
// demos still lay out at their intended width rather than collapsing to the
// mobile arrangement; the extra height just gives the fit transform more room
// to centre into.
const FRAME = { width: 1024, height: 1024 };

const OUTPUT_WIDTH = 880;
const OUTPUT_HEIGHT = 880;

// A gallery of thumbnails should not cost more than the pages it links to.
// Demos over budget are re-encoded harder rather than tuned by hand.
const SIZE_BUDGET_KB = 300;
const CRF_START = 30;
const CRF_MAX = 40;
const CRF_STEP = 4;

// Long enough for the longest routine, short enough that nobody waits to see
// the loop close. Routines that run past it are cut, so keep them under it.
const MAX_CLIP_MS = 9500;

/**
 * Playwright drives real pointer events but renders no cursor, so without this
 * every clip looks like the UI operating itself. A fixed arrow that follows
 * `mousemove` turns the same recording into someone demonstrating the demo.
 *
 * The arrow is macOS's own, traced: white body, black outline, the notch at
 * the tail. Screen recorders draw this rather than a generic triangle because
 * it is the shape a viewer already reads as "a pointer" without looking at it,
 * and a hand-drawn one lands in the uncanny valley beside the real UI. Drawn
 * larger than life at 40px, again as they do — at the size the system draws
 * it, a cursor is four pixels of detail in a downscaled thumbnail.
 *
 * `left`/`top` put the arrow's tip, not its box, on the pointer: the tip sits
 * at (8.2, 4.9) of a 28-unit box drawn at 40px.
 *
 * Mounted on `load` and parented to `<html>`: Next renders `<body>`, so an
 * extra child inserted before hydration is a mismatch React will complain
 * about — and, more visibly, may get blown away when it hydrates.
 */
const CURSOR_SCRIPT = `
(() => {
  let x = 0;
  let y = 0;
  let down = false;
  let root;
  let inner;

  const draw = () => {
    if (!root) return;
    root.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    inner.style.transform = 'scale(' + (down ? 0.82 : 1) + ')';
  };

  addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;
    if (root) root.style.opacity = '1';
    draw();
  }, true);
  addEventListener('mousedown', () => { down = true; draw(); }, true);
  addEventListener('mouseup', () => { down = false; draw(); }, true);

  addEventListener('load', () => {
    root = document.createElement('div');
    root.style.cssText = 'position:fixed;left:-12px;top:-7px;width:40px;height:40px;z-index:2147483647;pointer-events:none;opacity:0;will-change:transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22))';
    inner = document.createElement('div');
    inner.style.cssText = 'width:100%;height:100%;transform-origin:12px 7px;transition:transform .1s cubic-bezier(.22,1,.36,1)';
    inner.innerHTML = '<svg width="40" height="40" viewBox="0 0 28 28"><polygon fill="#fff" points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6"/><polygon fill="#fff" points="17.3,21.6 13.7,23.1 9,12 12.7,10.5"/><rect x="12.5" y="13.6" transform="matrix(0.9221 -0.3871 0.3871 0.9221 -5.7605 6.5909)" width="2" height="8"/><polygon points="9.2,7.3 9.2,18.5 12.2,15.6 12.6,15.5 17.4,15.5"/></svg>';
    root.appendChild(inner);
    document.documentElement.appendChild(root);
    draw();
  });
})();
`;

// `?preview` already hides the chrome and the attribution footer. This is the
// Next dev overlay, which the app cannot know about.
const FRAME_CSS = `nextjs-portal{display:none!important}`;

/**
 * Every demo is laid out for a full page, so most of them occupy a fraction of
 * a 4:3 thumbnail and read as an empty white box. Measuring what the demo
 * actually draws and scaling to fill the frame fixes that generically, which
 * beats a hand-tuned zoom per demo.
 *
 * A `transform` rather than `zoom`: it magnifies without relaying out, so no
 * demo crosses a breakpoint on the way into the frame. The transform-origin
 * matters as much as the scale — several demos are left-aligned in a
 * full-width column, and scaling those about the column's centre throws them
 * off the left edge entirely.
 *
 * Returns null — leave it alone — for anything canvas-backed, where the demo
 * has already sized itself to the viewport.
 */
const FIT_SCRIPT = (maxScale: number) => `(() => {
  // The layout wrapper, so this sees the demo whichever shape the page uses.
  const root = document.querySelector("body > [data-page]");
  if (!root || root.querySelector('canvas')) return null;
  // A demo that asked for a \`preview.zoom\` has already chosen its framing, and
  // the two do not compose: every measurement below is a client rect the zoom
  // has multiplied, while the transform they produce is applied inside it.
  if (parseFloat(getComputedStyle(document.documentElement).zoom) !== 1) return null;

  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const el of root.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    // A transform makes its subtree the containing block for fixed children,
    // so a demo that pins anything to the viewport has to be left alone.
    if (style.position === 'fixed') return null;
    if (style.visibility === 'hidden' || style.opacity === '0') continue;
    // Only count what actually paints. A transparent full-width wrapper is not
    // part of the picture, and measuring one is what kept short, narrow demos
    // reporting a column-wide union and refusing to scale.
    const paints = el.children.length === 0
      || style.backgroundColor !== 'rgba(0, 0, 0, 0)'
      || style.backgroundImage !== 'none'
      || parseFloat(style.borderTopWidth) > 0
      || parseFloat(style.borderLeftWidth) > 0
      || style.boxShadow !== 'none';
    if (!paints) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    // Full-bleed bands describe the page, not the demo. Width alone is the
    // test: the page wrapper paints a background and spans the viewport, so
    // counting it pinned every measurement at the full frame width.
    if (rect.width >= innerWidth * 0.98) continue;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  if (!Number.isFinite(left)) return null;

  // Capped: the union is measured at rest and several demos grow as they are
  // driven, so a scale that fits the resting state can still overflow.
  const fit = 0.92 * Math.min(innerWidth / (right - left), innerHeight / (bottom - top));
  const scale = Math.min(${maxScale}, Math.max(1, Number(fit.toFixed(3))));

  const box = root.getBoundingClientRect();
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const dx = Math.round(innerWidth / 2 - cx);
  const dy = Math.round(innerHeight / 2 - cy);
  if (scale === 1 && Math.abs(dx) < 8 && Math.abs(dy) < 8) return null;

  return 'transform-origin:' + (cx - box.left) + 'px ' + (cy - box.top) + 'px;'
    + 'transform:translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
})()`;

interface Point {
  x: number;
  y: number;
}
type Target = Locator | Point;

const isLocator = (target: Target): target is Locator =>
  "boundingBox" in target;

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

/**
 * Playwright's `mouse.move(..., { steps })` dispatches every step in the same
 * tick, so it teleports on camera. These helpers interpolate against the wall
 * clock instead, which is the only thing a recording can see.
 */
const makeCursor = (page: Page) => {
  const FRAME_MS = 20;
  let at: Point = { x: FRAME.width / 2, y: FRAME.height + 40 };

  const pointOf = async (target: Target): Promise<Point> => {
    if (!isLocator(target)) {
      return target;
    }
    const box = await target.boundingBox();
    if (!box) {
      throw new Error("target has no bounding box");
    }
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  const travel = async (to: Point, ms: number): Promise<void> => {
    const from = at;
    const frames = Math.max(2, Math.round(ms / FRAME_MS));
    for (let i = 1; i <= frames; i++) {
      const t = easeInOut(i / frames);
      await page.mouse.move(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t
      );
      await page.waitForTimeout(FRAME_MS);
    }
    at = to;
  };

  const wait = (ms: number) => page.waitForTimeout(ms);

  const to = async (target: Target, ms = 560): Promise<void> => {
    await travel(await pointOf(target), ms);
  };

  const click = async (target: Target, ms = 560): Promise<void> => {
    await to(target, ms);
    await wait(160);
    if (isLocator(target)) {
      // Move the drawn cursor there, then let Playwright do the clicking. A
      // raw mouse.down at computed coordinates has no actionability check, so
      // anything that shifts between measuring and pressing lands the click on
      // nothing and the rest of the routine waits for a state that never comes.
      await target.click({ delay: 110 });
      return;
    }
    await page.mouse.down();
    await wait(110);
    await page.mouse.up();
  };

  const drag = async (
    from: Target,
    toTarget: Target,
    ms = 900
  ): Promise<void> => {
    await to(from);
    await wait(200);
    await page.mouse.down();
    await wait(220);
    await travel(await pointOf(toTarget), ms);
    await wait(220);
    await page.mouse.up();
  };

  const scrollTo = (y: number, ms: number): Promise<void> =>
    page.evaluate(
      ([target, duration]) =>
        new Promise<void>((resolve) => {
          const from = window.scrollY;
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const t = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
            window.scrollTo(0, from + (target - from) * t);
            if (p < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(step);
        }),
      [y, ms]
    );

  const type = async (target: Target, text: string): Promise<void> => {
    await click(target);
    await wait(200);
    await page.keyboard.type(text, { delay: 95 });
  };

  return { click, drag, scrollTo, to, type, wait };
};

type Cursor = ReturnType<typeof makeCursor>;
type Routine = (cursor: Cursor, page: Page) => Promise<void>;

/**
 * One routine per demo, ~5-8s each. Two rules: show the thing the demo is
 * about, and finish in the state you started in — the clip loops, and a seam
 * between two unrelated frames is the one flaw a viewer always notices.
 *
 * Demos with no entry are recorded as-is, which is right for the ones that
 * animate on their own (staggered-fade, album, lighting) and for the handful
 * that are static and only ever needed a poster.
 */
const CHOREOGRAPH: Record<string, Routine> = {
  album: async (cursor, page) => {
    const cover = page.locator("button").first();
    await cursor.click(cover);
    await cursor.wait(2300);
    await cursor.click(cover);
    await cursor.wait(2000);
  },

  "animated-button": async (cursor, page) => {
    const button = page.locator("button").first();
    await cursor.click(button);
    await cursor.wait(2000);
    await cursor.click(button);
    await cursor.wait(1600);
  },

  "card-stack": async (cursor, page) => {
    const stack = page.locator("button").first();
    await cursor.click(stack);
    await cursor.wait(2200);
    await cursor.click(stack);
    await cursor.wait(1700);
  },

  controls: async (cursor, page) => {
    await cursor.click(page.getByRole("button", { name: "Sky", exact: true }));
    await cursor.wait(1200);
    await cursor.click(page.getByRole("button", { name: /^Corner radius:/ }));
    await cursor.wait(1100);
    await cursor.click(page.getByRole("button", { name: "Red", exact: true }));
    await cursor.wait(1400);
  },

  // A first-person shooter reduced to one pass: fly, track a rock, fire.
  dither: async (cursor) => {
    await cursor.to({ x: 660, y: 300 }, 900);
    await cursor.click({ x: 660, y: 300 }, 200);
    await cursor.wait(500);
    await cursor.to({ x: 380, y: 470 }, 900);
    await cursor.click({ x: 380, y: 470 }, 200);
    await cursor.wait(600);
    await cursor.to({ x: 640, y: 520 }, 800);
    await cursor.click({ x: 640, y: 520 }, 200);
    await cursor.wait(700);
    await cursor.to({ x: 512, y: 384 }, 800);
    await cursor.wait(700);
  },

  "dnd-grid": async (cursor, page) => {
    const block = page.getByRole("gridcell", { name: "Block b" });
    const target = page.getByRole("gridcell", { name: "Block e" });
    await cursor.drag(block, target, 1100);
    await cursor.wait(1600);
    await cursor.drag(
      page.getByRole("gridcell", { name: "Block b" }),
      page.getByRole("gridcell", { name: "Block c" }),
      1100
    );
    await cursor.wait(1500);
  },

  "document-shadow": async (cursor, page) => {
    const dice = page.getByRole("button", {
      name: "Roll the dice for a new shadow",
    });
    await cursor.click(dice);
    await cursor.wait(1800);
    await cursor.click(dice, 200);
    await cursor.wait(2000);
  },

  "dynamic-island": async (cursor, page) => {
    const button = (name: string) => page.getByRole("button", { name });
    await cursor.click(button("Timer"));
    await cursor.wait(1600);
    await cursor.click(button("Listening"));
    await cursor.wait(1800);
    await cursor.click(button("Idle"));
    await cursor.wait(1300);
  },

  expand: async (cursor, page) => {
    const card = page.locator("button[aria-expanded]").first();
    await cursor.click(card);
    await cursor.wait(2300);
    await cursor.click(card);
    await cursor.wait(1700);
  },

  faq: async (cursor, page) => {
    const first = page.getByRole("button", { name: "Is it accessible?" });
    const second = page.getByRole("button", { name: "Is it fun?" });
    await cursor.click(first);
    await cursor.wait(1800);
    await cursor.click(second);
    await cursor.wait(1900);
    await cursor.click(second);
    await cursor.wait(1400);
  },

  "ios-cards": async (cursor, page) => {
    await cursor.click(page.getByRole("button").first());
    await cursor.wait(2500);
    // The expanded item's backdrop closes on click, anywhere
    await cursor.click({ x: 80, y: 700 }, 700);
    await cursor.wait(1600);
  },

  // Every layer is driven by pointer position, so the routine is the pointer.
  lighting: async (cursor) => {
    await cursor.to({ x: 740, y: 220 }, 500);
    await cursor.wait(350);
    await cursor.to({ x: 250, y: 500 }, 600);
    await cursor.wait(350);
    await cursor.to({ x: 800, y: 610 }, 600);
    await cursor.wait(350);
    await cursor.to({ x: 512, y: 300 }, 500);
    await cursor.wait(700);
  },

  // A shorter travel than the demo deserves: a full-page text scroll changes
  // every pixel in the frame, and h264 spends a preview's whole byte budget on
  // reflowing body copy long before the progress rail becomes the subject.
  markers: async (cursor) => {
    await cursor.wait(600);
    await cursor.scrollTo(680, 2600);
    await cursor.wait(700);
    await cursor.scrollTo(0, 2300);
    await cursor.wait(500);
  },

  // The terminator sweeping across real craters is the whole demo, and it only
  // moves when the time scrubber does. Scrubbed by key rather than by drag:
  // the scene is heavy enough that a per-frame pointer path costs seconds of
  // clip to travel the same distance one keypress covers.
  moon: async (cursor, page) => {
    const slider = page.locator("#time-travel-input");
    await cursor.click(slider);
    await cursor.wait(500);
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("ArrowRight", { delay: 60 });
    }
    await cursor.wait(1200);
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("ArrowLeft", { delay: 60 });
    }
    await cursor.wait(1000);
  },

  // The lens fills the lower half of the frame and the old path was dragging
  // above it, so the clip was a cursor gliding over a grid that never moved.
  // Diagonally, and across three cells: one axis is hue and the other shade,
  // and a pan that crosses both is the only one that recolours the page.
  // Symmetric, because the release is slow enough to snap rather than fling,
  // so the same distance back lands on the cell it started from.
  "omni-color-picker": async (cursor) => {
    // Both ends inside the lens (254-846 by 457-1049): the return drag presses
    // where the first one released, and a release past the edge presses on
    // nothing, which left the clip ending on a colour it never started from.
    const centre = { x: 550, y: 753 };
    const out = { x: 800, y: 615 };
    await cursor.drag(centre, out, 1300);
    await cursor.wait(900);
    await cursor.drag(out, centre, 1300);
    await cursor.wait(800);
  },

  "password-strength": async (cursor, page) => {
    const input = page.locator("#password");
    await cursor.type(input, "Str0ng!Pass22");
    await cursor.wait(1000);
    await cursor.click(page.locator("button").first());
    await cursor.wait(1600);
    await input.fill("");
    await cursor.wait(1200);
  },

  "perfect-dnd": async (cursor, page) => {
    const item = page.getByRole("button", { name: "About Me" });
    const lower = page.getByRole("button", { name: "Contact" });
    await cursor.drag(item, lower, 1300);
    await cursor.wait(1500);
    await cursor.drag(
      page.getByRole("button", { name: "About Me" }),
      page.getByRole("button", { name: "My Portfolio" }),
      1300
    );
    await cursor.wait(1400);
  },

  preview: async (cursor, page) => {
    const row = page.locator("button[aria-expanded]").first();
    await cursor.click(row);
    await cursor.wait(2500);
    await cursor.click(row);
    await cursor.wait(1800);
  },

  "qr-code": async (cursor, page) => {
    await cursor.click(
      page.getByRole("button", { name: "Indigo", exact: true })
    );
    await cursor.wait(1500);
    await cursor.click(
      page.getByRole("button", { name: "Green", exact: true })
    );
    await cursor.wait(1500);
    await cursor.click(page.getByRole("button", { name: "Red", exact: true }));
    await cursor.wait(1600);
  },

  sheet: async (cursor, page) => {
    await cursor.click(
      page.getByRole("button", { name: "Open multi-stage sheet" })
    );
    await cursor.wait(1300);
    await cursor.click(
      page.getByRole("button", { name: "View Recovery Phrase" })
    );
    await cursor.wait(2000);
    await cursor.click(page.getByRole("button", { name: "Close" }));
    await cursor.wait(1400);
  },

  // The whole demo is the Shuffle theme button, and `?hideHeader` drops it
  // along with the rest of the page chrome — without putting it back, the clip
  // is six cards scrolling past on one colour scheme.
  "shuffle-theme": async (cursor, page) => {
    await page.addStyleTag({
      content: "div[data-chrome]{display:block!important}",
    });
    const shuffle = page.getByRole("button", { name: "Shuffle theme" });
    await cursor.click(shuffle);
    await cursor.wait(1600);
    await cursor.click(shuffle, 200);
    await cursor.wait(1600);
    await cursor.click(shuffle, 200);
    await cursor.wait(1800);
  },

  sky: async (cursor) => {
    await cursor.wait(500);
    await cursor.scrollTo(2400, 3200);
    await cursor.wait(700);
    await cursor.scrollTo(0, 2800);
    await cursor.wait(400);
  },

  status: async (cursor, page) => {
    const trigger = page.locator("button").first();
    await cursor.click(trigger);
    await cursor.wait(1100);
    // By accessible name, not nth(): the options gained real labels in the
    // accessibility pass, and a positional selector broke the moment the
    // popover markup moved.
    await cursor.click(page.getByRole("button", { name: "On holiday" }));
    await cursor.wait(2200);
    await cursor.click(trigger);
    await cursor.wait(1600);
  },

  // Category toggle is a tablist, not a row of buttons
  table: async (cursor, page) => {
    const button = (name: string) => page.getByRole("tab", { name });
    await cursor.click(button("SaaS startups"));
    await cursor.wait(1700);
    await cursor.click(button("Investors"));
    await cursor.wait(1700);
    await cursor.click(button("Scale-ups"));
    await cursor.wait(1600);
  },

  tabs: async (cursor, page) => {
    const tab = (name: string) => page.getByRole("tab", { name }).first();
    await cursor.click(tab("Balances"));
    await cursor.wait(1400);
    await cursor.click(tab("Billing"));
    await cursor.wait(1400);
    await cursor.click(tab("Payments"));
    await cursor.wait(1500);
  },

  // "idle" renders the pending view, so finishing on Pending closes the loop.
  toast: async (cursor, page) => {
    await cursor.wait(700);
    await cursor.click(page.getByRole("button", { name: "Error" }));
    await cursor.wait(1900);
    await cursor.click(page.getByRole("button", { name: "Success" }));
    await cursor.wait(1900);
    await cursor.click(page.getByRole("button", { name: "Pending" }));
    await cursor.wait(1700);
  },

  "timed-undo": async (cursor, page) => {
    const button = page.locator("button").first();
    await cursor.click(button);
    await cursor.wait(3200);
    await cursor.click(button, 200);
    await cursor.wait(1800);
  },
};

// Demos with no routine still need long enough on camera to show a cycle
const AMBIENT_MS = 7000;

const DEFAULT_MAX_ZOOM = 3;

/**
 * Ceilings for demos the automatic fit gets wrong, in either direction: some
 * grow several times their resting size as they are driven and need holding
 * back, and some are a single small control that can take far more.
 */
const MAX_ZOOM: Record<string, number> = {
  "animated-button": 3.6,
  // Expanded item is a fixed overlay outside the transformed box
  "ios-cards": 1,
  // Its theme background is a fixed, full-viewport layer; a transform on the
  // page makes that layer's containing block the page, and it stops covering.
  "shuffle-theme": 1,
  // Spreads to roughly three times its resting width
  "card-stack": 1.6,
  dither: 1,
  // Grows downward when a date opens
  expand: 2,
  moon: 1,
  // A 120px row becomes 400px
  preview: 1.5,
  sheet: 1,
  // Gains a countdown chip and a longer label
  "timed-undo": 2.6,
  // The pill grows taller between states
  toast: 2.6,
};

const record = async (
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  slug: string
): Promise<string> => {
  const dir = path.join(WORK_DIR, slug);
  await rm(dir, { force: true, recursive: true });

  // `recordVideo.size` fits the viewport into the frame rather than scaling it
  // up, so the two have to match: a smaller viewport records its surplus as
  // grey padding. Demos that need a smaller screen ask for it with a `zoom` in
  // `lib/blocks.ts`, which `?preview` applies.
  const context = await browser.newContext({
    colorScheme: "light",
    recordVideo: { dir, size: FRAME },
    reducedMotion: "no-preference",
    viewport: FRAME,
  });
  const page = await context.newPage();
  await page.addInitScript(CURSOR_SCRIPT);

  const startedAt = Date.now();
  await openBlock(page, slug, "preview");
  await page.addStyleTag({ content: FRAME_CSS });
  // Short demos otherwise sit against the top edge with half a frame of empty
  // page beneath them. Anything taller than the frame is meant to scroll.
  const fits = await page.evaluate(
    () => document.documentElement.scrollHeight <= window.innerHeight + 32
  );
  if (fits) {
    const fit = await page.evaluate<string | null>(
      FIT_SCRIPT(MAX_ZOOM[slug] ?? DEFAULT_MAX_ZOOM)
    );
    if (fit) {
      // Applied to the element it was measured against. These drifted apart
      // once, and a scale computed from one box and applied to another is
      // wrong everywhere and invisible on the demos that have no such box.
      //
      // Scrolling off, because the scale is scrollable overflow: the demo
      // still fits the frame, but the box it lives in now runs past it, and
      // Playwright scrolls whatever it is about to click into view. That
      // scroll slides the whole demo sideways mid-clip. `clip` and on both
      // elements: `hidden` still scrolls for a script or a `scrollIntoView`,
      // and the viewport takes its overflow from whichever of the two is not
      // `visible`, so clipping one alone just moves the scroll to the other.
      await page.addStyleTag({
        content: `html,body{overflow:clip!important}body > [data-page]{${fit}}`,
      });
    }
  }
  await settle(page, slug);

  const headMs = Date.now() - startedAt;
  const cursor = makeCursor(page);
  const routine = CHOREOGRAPH[slug];
  // Best-effort: a selector that has drifted shouldn't abort the batch, and
  // the still clip it leaves behind is obvious on review.
  await (routine
    ? routine(cursor, page).catch((error: unknown) =>
        console.warn(
          `  choreograph(${slug}) failed: ${String(error).split("\n")[0]}`
        )
      )
    : page.waitForTimeout(AMBIENT_MS));
  const bodyMs = Date.now() - startedAt - headMs;

  const video = page.video();
  await page.close();
  await context.close();
  const source = await video?.path();
  if (!source) {
    throw new Error(`no video recorded for ${slug}`);
  }

  await encode(source, slug, headMs, bodyMs);
  await rm(dir, { force: true, recursive: true });
  return slug;
};

const encode = async (
  source: string,
  slug: string,
  headMs: number,
  bodyMs: number
): Promise<void> => {
  const clip = path.join(OUTPUT_DIR, `${slug}.mp4`);
  const poster = path.join(OUTPUT_DIR, `${slug}.jpg`);
  const seconds = Math.min(bodyMs, MAX_CLIP_MS) / 1000;

  // Text-heavy and WebGL demos carry far more detail per frame than a button,
  // so one crf cannot serve both. Step it up until the clip fits the budget
  // rather than maintaining a per-demo table that drifts.
  let kb = 0;
  let crf = CRF_START;
  for (; crf <= CRF_MAX; crf += CRF_STEP) {
    await run("ffmpeg", [
      "-y",
      // Drop the load-and-settle head: the first second of every recording is
      // a blank page and a demo assembling itself, which is not the demo.
      "-ss",
      (headMs / 1000).toFixed(2),
      "-i",
      source,
      "-t",
      seconds.toFixed(2),
      "-vf",
      `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=lanczos,fps=30`,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      clip,
    ]);
    const encoded = await stat(clip);
    kb = Math.round(encoded.size / 1024);
    if (kb <= SIZE_BUDGET_KB) {
      break;
    }
  }

  // Poster is the clip's own first frame, so there is no jump when the video
  // fades in over it. JPEG rather than WebP because Homebrew's ffmpeg ships
  // without libwebp — and `next/image` re-encodes it to WebP/AVIF regardless.
  await run("ffmpeg", [
    "-y",
    "-i",
    clip,
    "-frames:v",
    "1",
    "-q:v",
    "4",
    poster,
  ]);

  const over = kb > SIZE_BUDGET_KB ? ` — over budget at crf ${CRF_MAX}` : "";
  const cut = bodyMs > MAX_CLIP_MS ? " — routine cut short" : "";
  console.log(
    `✓ ${slug} — ${seconds.toFixed(1)}s, ${kb}KB, crf ${Math.min(crf, CRF_MAX)}${over}${cut}`
  );
};

await requireServer();
await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(WORK_DIR, { recursive: true });

const slugs = targetSlugs();
const browser = await chromium.launch();

// Sequential: the routines are timed against the wall clock, and a second
// WebGL demo rendering alongside them would stretch every pause.
for (const slug of slugs) {
  try {
    await record(browser, slug);
  } catch (error: unknown) {
    console.error(`✗ ${slug} — ${String(error).split("\n")[0]}`);
  }
}

await browser.close();
await rm(WORK_DIR, { force: true, recursive: true });
console.log(`Done — ${slugs.length} previews in public/previews/`);
