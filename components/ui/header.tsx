"use client";

import { ArrowLeft } from "lucide-react";
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

      {(previous || next) && (
        // data-chrome so `?hideHeader` drops this too, via the style above.
        <nav
          aria-label="Other experiments"
          className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground text-sm"
          data-chrome
        >
          {previous && (
            <Link className="hover:text-foreground" href={`/${previous}`}>
              &larr; {blocks[previous].name}
            </Link>
          )}
          {next && (
            <Link className="hover:text-foreground" href={`/${next}`}>
              {blocks[next].name} &rarr;
            </Link>
          )}
        </nav>
      )}
    </div>
  );
};
