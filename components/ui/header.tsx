"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
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

export const Header = ({ id, className }: Props) => {
  const { previous, next } = getNeighbours(id);
  // `?hideHeader` renders the demo on its own — used for OG screenshots
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(new URLSearchParams(window.location.search).has("hideHeader"));
  }, []);

  if (hidden) {
    // Also drop attribution links and any chrome-only wrapper — an emptied
    // wrapper still renders its padding as a band above the demo.
    return <style>{".link,[data-chrome]{display:none!important}"}</style>;
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
        // The rule and `justify-between` are what stop this reading as another
        // line of the prose above it: previous and next sit at opposite ends,
        // which is the only cue that says which direction each one goes.
        <nav
          aria-label="Other experiments"
          className="mt-6 flex items-center justify-between gap-4 border-border border-t pt-4 text-sm"
          data-chrome
        >
          {previous ? (
            <Link
              className="group inline-flex min-w-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              href={`/${previous}`}
            >
              <ArrowLeft className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
              <span className="truncate">{blocks[previous].name}</span>
            </Link>
          ) : (
            // Placeholder keeps `next` pinned right on the first experiment
            <span />
          )}

          {next && (
            <Link
              className="group inline-flex min-w-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              href={`/${next}`}
            >
              <span className="truncate">{blocks[next].name}</span>
              <ArrowRight className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
};
