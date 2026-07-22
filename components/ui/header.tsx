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

export const Header = ({ id, className }: Props) => {
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
    </div>
  );
};
