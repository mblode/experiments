"use client";

import { GripVertical } from "blode-icons-react";
import type { ReactNode } from "react";

import type { BlockData } from "./block";

interface CardInnerProps {
  block: BlockData;
  actions?: ReactNode;
}

export function CardInner({ block, actions }: CardInnerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <GripVertical aria-hidden className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate font-medium text-foreground">
            {block.title}
          </span>
          {/* The mock data marks one block hidden. Without this it rendered
              identically to the visible ones and the flag read as a lie. */}
          {!block.visible && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
              Hidden
            </span>
          )}
        </div>
        {block.type === "link" && block.url && (
          <div className="truncate text-muted-foreground text-sm">
            {block.url}
          </div>
        )}
      </div>
      {actions}
    </div>
  );
}
