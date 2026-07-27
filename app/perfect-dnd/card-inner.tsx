"use client";

import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

import type { BlockData } from "./block";

interface CardInnerProps {
  block: BlockData;
  actions?: ReactNode;
}

export function CardInner({ block, actions }: CardInnerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-900">{block.title}</div>
        {block.type === "link" && block.url && (
          <div className="truncate text-slate-500 text-sm">{block.url}</div>
        )}
      </div>
      {actions}
    </div>
  );
}
