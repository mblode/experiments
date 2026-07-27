"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
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

  const _dropAnimation: DropAnimation = {
    duration: 350,
    easing: "cubic-bezier(0.22, 1.5, 0.36, 1)",
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0" } },
    }),
  };

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

  const handleSettlingComplete = () => {
    store.endDrag();
  };

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
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">
          <div className="mx-auto">
            <div className="flex gap-4 p-4">
              <div className="min-w-0 flex-1 overflow-auto">
                <div className="mx-auto max-w-lg py-2">
                  <SortableContext
                    items={sortedBlocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedBlocks.map((block) => (
                      <ContentCard block={block} key={block.id} />
                    ))}
                  </SortableContext>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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
