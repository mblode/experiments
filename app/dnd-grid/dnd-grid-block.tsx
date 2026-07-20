"use client";

import {
  DndGrid,
  type Layout,
  type LayoutItem,
  verticalCompactor,
} from "@dnd-grid/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGridInteractions } from "@/hooks/use-grid-interactions";

export const BLOCK_GAP = 16;
export const BLOCK_HEIGHT = 24;
export const BLOCK_COLUMNS = 4;
export const DEFAULT_WIDTH = 480;
export const MAX_WIDTH = 643;
const DEFAULT_GRID_ROWS = 12;
const DEFAULT_GRID_HEIGHT =
  DEFAULT_GRID_ROWS * BLOCK_HEIGHT +
  (DEFAULT_GRID_ROWS - 1) * BLOCK_GAP +
  BLOCK_GAP * 2;

const initialLayout: Layout = [
  { id: "a", x: 0, y: 0, w: 2, h: 6 },
  { id: "b", x: 2, y: 0, w: 1, h: 3 },
  { id: "c", x: 3, y: 0, w: 1, h: 3 },
  { id: "d", x: 2, y: 3, w: 2, h: 4 },
  { id: "e", x: 0, y: 6, w: 1, h: 4 },
  { id: "f", x: 1, y: 6, w: 1, h: 4 },
  { id: "g", x: 2, y: 7, w: 2, h: 3 },
  { id: "h", x: 0, y: 10, w: 4, h: 2 },
];

export const DndGridBlock = () => {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const handlers = useGridInteractions();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  // Prevent ResizeObserver feedback loops while grid items are being resized.
  const isResizingRef = useRef(false);
  const pendingWidthRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);

  const commitContainerWidth = useCallback((nextWidth: number) => {
    setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = Math.round(entry.contentRect.width);
        pendingWidthRef.current = nextWidth;

        if (isResizingRef.current) {
          continue;
        }

        if (resizeRafRef.current !== null) {
          cancelAnimationFrame(resizeRafRef.current);
        }
        resizeRafRef.current = requestAnimationFrame(() => {
          resizeRafRef.current = null;
          if (pendingWidthRef.current === null) {
            return;
          }
          commitContainerWidth(pendingWidthRef.current);
        });
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [commitContainerWidth]);

  const scaleFactor = useMemo(() => {
    const width = containerWidth ?? DEFAULT_WIDTH;
    return Math.min(width, MAX_WIDTH) / DEFAULT_WIDTH;
  }, [containerWidth]);

  const margin = BLOCK_GAP * scaleFactor;
  const handleResizeStart: typeof handlers.handleResizeStart = useCallback(
    (...args) => {
      isResizingRef.current = true;
      handlers.handleResizeStart(...args);
    },
    [handlers]
  );
  const handleResizeStop: typeof handlers.handleResizeStop = useCallback(
    (...args) => {
      handlers.handleResizeStop(...args);
      isResizingRef.current = false;
      if (pendingWidthRef.current !== null) {
        commitContainerWidth(pendingWidthRef.current);
      }
    },
    [handlers, commitContainerWidth]
  );

  return (
    <div
      className="mx-auto w-full"
      ref={containerRef}
      style={{ maxWidth: MAX_WIDTH }}
    >
      {containerWidth !== null && containerWidth > 0 ? (
        <DndGrid
          cols={BLOCK_COLUMNS}
          compactor={{ ...verticalCompactor }}
          layout={layout}
          gap={margin}
          onDrag={handlers.handleDrag}
          onDragStart={handlers.handleDragStart}
          onDragEnd={handlers.handleDragStop}
          onLayoutChange={setLayout}
          onResize={handlers.handleResize}
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeStop}
          resizeHandles={["ne", "nw", "se", "sw"]}
          rowHeight={BLOCK_HEIGHT * scaleFactor}
          width={containerWidth}
        >
          {layout.map((item: LayoutItem) => {
            return (
              <button
                aria-label={`Block ${item.id}`}
                className="select-none p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                key={item.id}
                onClick={() => handlers.handleSelect(item.id)}
                onPointerEnter={() => handlers.handleHover(item.id)}
                onPointerLeave={() => handlers.handleHover(null)}
                type="button"
              >
                {item.id}
              </button>
            );
          })}
        </DndGrid>
      ) : (
        <div
          className="w-full rounded-3xl border border-border/60 bg-muted/40"
          style={{ height: DEFAULT_GRID_HEIGHT }}
        />
      )}
    </div>
  );
};
