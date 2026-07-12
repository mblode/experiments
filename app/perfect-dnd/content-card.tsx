"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { observer } from "mobx-react-lite";

import { cn } from "@/lib/utils";

import type { BlockData } from "./block";
import { CardInner } from "./card-inner";
import { useStore } from "./stores/store";

interface ContentCardProps {
  block: BlockData;
}

export const ContentCard = observer(({ block }: ContentCardProps) => {
  const store = useStore();

  const isSettling = store.settlingBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: _isDragging,
  } = useSortable({ id: block.id });

  const isActiveInStore = store.activeBlockId === block.id;
  // Use store state for placeholder visibility to coordinate with our drop animation
  // isDragging from dnd-kit resets immediately, but we want to wait for animation
  const showPlaceholder = isActiveInStore || isSettling;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="mb-2">
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "group flex w-full cursor-grab rounded-xl border border-border bg-white p-4 text-left transition-shadow",
          {
            "z-0 bg-muted/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]":
              showPlaceholder,
            "z-10": !showPlaceholder,
          }
        )}
        data-settling-target={isSettling ? block.id : undefined}
        data-sortable-item
        ref={setNodeRef}
        style={style}
        type="button"
      >
        <div
          className={cn({
            "opacity-0": showPlaceholder,
          })}
        >
          <CardInner block={block} />
        </div>
      </button>
    </div>
  );
});

ContentCard.displayName = "ContentCard";
