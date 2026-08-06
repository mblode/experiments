"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { observer } from "mobx-react-lite";
import { useMediaQuery } from "usehooks-ts";

import { cn } from "@/lib/utils";

import type { BlockData } from "./block";
import { CardInner } from "./card-inner";
import { useStore } from "./stores/store";

interface ContentCardProps {
  block: BlockData;
}

/** Movement within the screen: the cards reflowing around the dragged one. */
const REFLOW_TRANSITION = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
};

export const ContentCard = observer(({ block }: ContentCardProps) => {
  const store = useStore();

  const isSettling = store.settlingBlockId === block.id;
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false,
  });

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: block.id,
      transition: reduced ? null : REFLOW_TRANSITION,
    });

  const isActiveInStore = store.activeBlockId === block.id;
  // Use store state for placeholder visibility to coordinate with our drop
  // animation: isDragging from dnd-kit resets immediately, but we want to wait
  // for the settle to land.
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
          "group flex w-full cursor-grab rounded-xl border p-4 text-left duration-150 ease-out",
          "transition-[border-color,background-color] motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          "active:cursor-grabbing",
          showPlaceholder
            ? "z-0 border-border/70 bg-muted shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]"
            : "z-10 border-border bg-card hover:border-foreground/20"
        )}
        data-settling-target={isSettling ? block.id : undefined}
        data-sortable-item
        ref={setNodeRef}
        style={style}
        type="button"
      >
        <div className={cn("min-w-0 flex-1", showPlaceholder && "opacity-0")}>
          <CardInner block={block} />
        </div>
      </button>
    </div>
  );
});

ContentCard.displayName = "ContentCard";
