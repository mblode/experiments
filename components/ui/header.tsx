"use client";

import { ArrowLeft, ArrowRight } from "blode-icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { blocks } from "@/lib/blocks";
import { cn } from "@/lib/utils";

interface Props {
  id: keyof typeof blocks;
  className?: string;
}

/**
 * Neighbours in the same order the index lists them, so "previous" and "next"
 * mean what a reader coming from the gallery expects. Hidden blocks are
 * skipped for the same reason they are absent from the index.
 *
 * Deliberately just the two neighbours: every experiment page used to carry a
 * single internal link (the back arrow), which the 28 Jul crawl flagged across
 * 29 pages. Linking every sibling from every page would fix that number by
 * building a 27x27 mesh — worse for crawl budget and useless to a reader.
 */
const getNeighbours = (id: keyof typeof blocks) => {
  const ids = Object.entries(blocks)
    .filter(([, block]) => !block.hidden)
    .reverse()
    .map(([key]) => key);
  const index = ids.indexOf(id as string);

  if (index === -1) {
    return { previous: undefined, next: undefined };
  }

  return { previous: ids[index - 1], next: ids[index + 1] };
};

/**
 * Two capture modes, both driven by a query param so the page decides how it
 * presents itself rather than the capture scripts reaching in with selectors.
 *
 * `?hideHeader` drops the chrome and nothing else. The OG screenshots use it.
 *
 * `?preview` is for the gallery's video clips: chrome gone, the attribution
 * footer gone, and the demo centred in the viewport at the width it records
 * best at. Open any demo with it to see exactly what the recorder sees.
 */
const CHROME_CSS = ".link,[data-chrome]{display:none!important}";

const previewCss = ({
  width,
  zoom,
}: NonNullable<(typeof blocks)[string]["preview"]>) =>
  `${CHROME_CSS}body>footer{display:none!important}` +
  // Zoom rather than a transform: it shrinks the effective viewport, so
  // anything pinned to it or portalled out of the column scales too.
  (zoom ? `html{zoom:${zoom}}` : "") +
  // A column, so children still stretch to full width. A row with
  // `justify-content:center` centres by shrink-wrapping, which collapses every
  // demo to the width of its longest word.
  // Centre the layout wrapper, not the demo's own column. Pages here come in
  // two shapes: most put the header and the demo in one `min-h-screen`
  // column, but six render the demo as a *sibling* of a `data-chrome` header
  // block. Preview hides that block, so a rule aimed at the column centred
  // nothing on those six. The wrapper holds whatever the page rendered.
  //
  // `[data-page]`, not `body>div`: something injects an empty div ahead of the
  // real wrapper, so a positional selector styles that instead and silently
  // does nothing.
  "body>[data-page]{display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:100dvh!important}" +
  // Otherwise the demo's own full-height box fills the wrapper and there is
  // nothing left to centre.
  "div.min-h-screen{min-height:0!important}" +
  (width ? `body>[data-page] .mx-auto{max-width:${width}px!important}` : "");

export const Header = ({ id, className }: Props) => {
  const { previous, next } = getNeighbours(id);
  const [mode, setMode] = useState<"full" | "chrome" | "preview">("full");
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has("preview")) {
      setMode("preview");
    } else if (query.has("hideHeader")) {
      setMode("chrome");
    }
  }, []);

  if (mode !== "full") {
    // An emptied wrapper still renders its padding as a band above the demo,
    // so the chrome is hidden rather than merely unpopulated.
    return (
      <style>
        {mode === "preview" ? previewCss(blocks[id].preview ?? {}) : CHROME_CSS}
      </style>
    );
  }

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center gap-2">
        <Button
          asChild
          className="mb-4 rounded text-current! hover:text-foreground!"
          size="icon"
          variant="ghost"
        >
          <Link href="/">
            <ArrowLeft className="size-4 text-current" />
          </Link>
        </Button>

        <h1 className="mb-4 font-bold text-4xl">{blocks[id].name}</h1>
      </div>

      <p className="text-lg text-muted-foreground">{blocks[id].description}</p>

      {blocks[id].about?.map((paragraph) => (
        <p
          className="mt-4 max-w-[65ch] text-muted-foreground text-sm leading-relaxed"
          key={paragraph.slice(0, 40)}
        >
          {paragraph}
        </p>
      ))}

      {(previous || next) && (
        // data-chrome so `?hideHeader` drops this too, via the style above.
        // A two-column grid, not `justify-between`: with the halves sized to
        // their labels, both links landed somewhere different on every demo,
        // so paging through moved the target out from under the cursor. Fixed
        // halves and a constant Previous/Next eyebrow give the eye something
        // that stays put; only the titles change, which they have to.
        <nav
          aria-label="Other experiments"
          className="mt-6 grid grid-cols-2 gap-4 border-border border-t pt-4"
          data-chrome
        >
          {previous ? (
            <Link
              className="group flex min-w-0 flex-col gap-0.5 rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
              href={`/${previous}`}
            >
              <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <ArrowLeft className="size-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                Previous
              </span>
              <span className="truncate text-muted-foreground transition-colors group-hover:text-foreground">
                {blocks[previous].name}
              </span>
            </Link>
          ) : (
            // Holds the column so `next` stays in its half on the first demo
            <span />
          )}

          {next && (
            <Link
              className="group flex min-w-0 flex-col items-end gap-0.5 rounded-lg text-right text-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
              href={`/${next}`}
            >
              <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                Next
                <ArrowRight className="size-3.5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
              </span>
              <span className="truncate text-muted-foreground transition-colors group-hover:text-foreground">
                {blocks[next].name}
              </span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
};
