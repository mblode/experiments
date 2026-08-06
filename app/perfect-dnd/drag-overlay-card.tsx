"use client";

import type { RefObject } from "react";

import type { BlockData } from "./block";
import { CardInner } from "./card-inner";

interface DragOverlayCardProps {
  block: BlockData;
  ref?: RefObject<HTMLDivElement | null>;
}

export function DragOverlayCard({ block, ref }: DragOverlayCardProps) {
  return (
    // The lift shadow is animated imperatively by useDragSwing, so there is no
    // resting shadow and nothing to transition here.
    <div
      className="cursor-grabbing rounded-xl border border-border bg-card p-4"
      data-overlay-card
      ref={ref}
    >
      <CardInner block={block} />
    </div>
  );
}
