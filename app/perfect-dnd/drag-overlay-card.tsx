"use client";

import { forwardRef } from "react";

import type { BlockData } from "./block";
import { CardInner } from "./card-inner";

interface DragOverlayCardProps {
  block: BlockData;
}

export const DragOverlayCard = forwardRef<HTMLDivElement, DragOverlayCardProps>(
  ({ block }, ref) => {
    return (
      <div
        className="rounded-xl border border-border bg-white p-4 transition-shadow"
        data-overlay-card
        ref={ref}
        style={{
          cursor: "grabbing",
        }}
      >
        <CardInner block={block} />
      </div>
    );
  }
);

DragOverlayCard.displayName = "DragOverlayCard";
