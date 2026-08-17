"use client";

import { ArrowLeft, GithubIcon } from "blode-icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { blocks } from "@/lib/blocks";
import { cn } from "@/lib/utils";

interface Props {
  id: keyof typeof blocks;
  className?: string;
}

// The route directory is the slug, so the source of an experiment is always one
// folder away from its URL.
const SOURCE_ROOT = "https://github.com/mblode/experiments/tree/main/app";

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

        {/* Same mark, same corner as the index: the icon that means "source"
            on the gallery means the same thing here, scoped to this demo. */}
        <a
          aria-label={`View ${blocks[id].name} source on GitHub`}
          className="-m-2 mb-2 ml-auto rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          href={`${SOURCE_ROOT}/${id}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GithubIcon aria-hidden className="size-5" />
        </a>
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

      {blocks[id].credit && (
        // Under the prose, crediting the demo's origin. `.link` so
        // `?hideHeader` and `?preview` still drop it.
        <p className="mt-4">
          <a
            className="link"
            href={blocks[id].credit.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {blocks[id].credit.text}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}
    </div>
  );
};
