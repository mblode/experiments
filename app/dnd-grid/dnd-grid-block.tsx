"use client";

import {
  DndGrid,
  type Layout,
  type LayoutItem,
  verticalCompactor,
} from "@dnd-grid/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGridInteractions } from "@/hooks/use-grid-interactions";

import "./styles.css";

const BLOCK_GAP = 16;
const BLOCK_HEIGHT = 24;
const BLOCK_COLUMNS = 4;
const DEFAULT_WIDTH = 480;
const MAX_WIDTH = 643;
/* The board's own padding, on the 8px rhythm. It is the only inset now:
   containerPadding is 0 below, so the grid does not add a second one. */
const BOARD_PADDING = 16;
const DEFAULT_GRID_ROWS = 12;
const DEFAULT_GRID_HEIGHT =
  DEFAULT_GRID_ROWS * BLOCK_HEIGHT + (DEFAULT_GRID_ROWS - 1) * BLOCK_GAP;

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
      className="dnd-grid-demo mx-auto w-full"
      style={{ maxWidth: MAX_WIDTH + BOARD_PADDING * 2 }}
    >
      {/* Recessed board. The blocks read as raised tiles against it, which is
          what the white-on-white default never gave them. */}
      <div className="dnd-grid-board">
        <div ref={containerRef}>
          {containerWidth !== null && containerWidth > 0 ? (
            <DndGrid
              cols={BLOCK_COLUMNS}
              compactor={{ ...verticalCompactor }}
              containerPadding={0}
              gap={margin}
              layout={layout}
              onDrag={handlers.handleDrag}
              onDragEnd={handlers.handleDragStop}
              onDragStart={handlers.handleDragStart}
              onLayoutChange={setLayout}
              onResize={handlers.handleResize}
              onResizeEnd={handleResizeStop}
              onResizeStart={handleResizeStart}
              reducedMotion="system"
              resizeHandles={["ne", "nw", "se", "sw"]}
              rowHeight={BLOCK_HEIGHT * scaleFactor}
              width={containerWidth}
            >
              {layout.map((item: LayoutItem) => {
                // A plain element, not a button: the grid clones this node and
                // owns `role="gridcell"`, `tabIndex` and the arrow-key move and
                // resize handler on it. A nested button would have had its
                // role overwritten and its click do nothing.
                return (
                  <div
                    aria-label={`Block ${item.id}`}
                    className="select-none uppercase"
                    key={item.id}
                    onPointerEnter={() => handlers.handleHover(item.id)}
                    onPointerLeave={() => handlers.handleHover(null)}
                  >
                    {item.id}
                  </div>
                );
              })}
            </DndGrid>
          ) : (
            <div
              className="dnd-grid-skeleton"
              style={{ height: DEFAULT_GRID_HEIGHT }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
