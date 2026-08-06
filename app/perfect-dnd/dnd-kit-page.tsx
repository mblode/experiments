"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { ContentCard } from "./content-card";
import { DragSwingOverlay } from "./drag-swing-overlay";
import { SettlingOverlay } from "./settling-overlay";
import { useStore } from "./stores/store";

export const EditorPage = observer(() => {
  const store = useStore();
  const pageId = store.pageId;

  const sortedBlocks = store.blocksData
    .filter((block) => block.pageId === pageId)
    .sort((a, b) => a.order - b.order);

  // MouseSensor + TouchSensor (not PointerSensor) per dnd-kit best practices
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Hold to drag - distinguishes scroll from drag on iOS
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    store.startDrag(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      store.clearDropTarget();
      return;
    }

    const activeIndex = sortedBlocks.findIndex((b) => b.id === active.id);
    const overIndex = sortedBlocks.findIndex((b) => b.id === over.id);
    const position = activeIndex < overIndex ? "below" : "above";

    store.setDropTarget(over.id as string, position);
  };

  const activeBlock = store.activeBlockId
    ? sortedBlocks.find((b) => b.id === store.activeBlockId)
    : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedBlocks.findIndex((b) => b.id === active.id);
      const newIndex = sortedBlocks.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(
        sortedBlocks.map((b) => b.id),
        oldIndex,
        newIndex
      );
      store.reorderBlocks(pageId, newOrder);
    }

    // Clear drop target but keep activeBlockId until animation completes
    store.clearDropTarget();
  };

  const handleDragCancel = () => {
    store.clearDropTarget();
    store.endDrag();
  };

  // Stable: SettlingOverlay keys its animation off this, so a re-render mid
  // settle would otherwise restart the spring from the top.
  const handleSettlingComplete = useCallback(() => {
    store.endDrag();
  }, [store]);

  // Get the settling block data
  const settlingBlock = store.settlingBlockId
    ? sortedBlocks.find((b) => b.id === store.settlingBlockId)
    : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div className="mx-auto mt-8 max-w-lg">
        <SortableContext
          items={sortedBlocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedBlocks.map((block) => (
            <ContentCard block={block} key={block.id} />
          ))}
        </SortableContext>
      </div>

      {/* The drop animation is ours: the card springs out of the angle it was
          released at, which dnd-kit's own drop animation cannot express. */}
      <DragOverlay dropAnimation={null}>
        {activeBlock && <DragSwingOverlay block={activeBlock} />}
      </DragOverlay>

      {/* Settling overlay - renders outside dnd-kit's control */}
      {settlingBlock && (
        <SettlingOverlay
          block={settlingBlock}
          onAnimationComplete={handleSettlingComplete}
        />
      )}
    </DndContext>
  );
});

EditorPage.displayName = "EditorPage";
