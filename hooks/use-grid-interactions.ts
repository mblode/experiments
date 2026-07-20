import type { GridDragEvent, GridResizeEvent } from "@dnd-grid/react";
import { useCallback, useState } from "react";

export interface ResizeState {
  id: string;
  w: number;
  h: number;
}

export interface GridInteractionsHandlers {
  handleDragStart: (event: GridDragEvent) => void;
  handleDrag: (event: GridDragEvent) => void;
  handleDragStop: (event: GridDragEvent) => void;
  handleResizeStart: (event: GridResizeEvent) => void;
  handleResize: (event: GridResizeEvent) => void;
  handleResizeStop: (event: GridResizeEvent) => void;
  handleSelect: (id: string) => void;
  handleHover: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
}

export interface UseGridInteractionsOptions {
  onDragStart?: (id: string) => void;
  onDragStop?: (id: string) => void;
  onResizeStart?: (id: string) => void;
  onResizeStop?: (id: string) => void;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function useGridInteractions(
  options: UseGridInteractionsOptions = {}
): GridInteractionsHandlers {
  const [, setHoveredId] = useState<string | null>(null);
  const [, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const handleDragStart = useCallback(
    ({ previousItem }: GridDragEvent) => {
      const id = previousItem?.id ?? null;
      setHoveredId(id);
      setDragId(id);
      if (id) {
        options.onDragStart?.(id);
      }
    },
    [options]
  );

  const handleDrag = useCallback((_event: GridDragEvent) => {
    // Can be extended for edge scroll or other drag-time behaviors
  }, []);

  const handleDragStop = useCallback(
    ({ item }: GridDragEvent) => {
      setDragId(null);
      if (item?.id) {
        options.onDragStop?.(item.id);
      }
    },
    [options]
  );

  const handleResizeStart = useCallback(
    ({ item }: GridResizeEvent) => {
      const id = item?.id ?? null;
      setHoveredId(id);
      setSelectedId(id);
      if (item) {
        setResizeState({ id: item.id, w: item.w, h: item.h });
        options.onResizeStart?.(item.id);
      }
    },
    [options]
  );

  const handleResize = useCallback(({ item }: GridResizeEvent) => {
    if (item) {
      setResizeState({ id: item.id, w: item.w, h: item.h });
    }
  }, []);

  const handleResizeStop = useCallback(
    ({ item }: GridResizeEvent) => {
      setResizeState(null);
      if (item?.id) {
        options.onResizeStop?.(item.id);
      }
    },
    [options]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      options.onSelect?.(id);
    },
    [options]
  );

  const handleHover = useCallback(
    (id: string | null) => {
      // Don't update hover during drag or resize operations
      if (!(resizeState || dragId)) {
        setHoveredId(id);
        options.onHover?.(id);
      }
    },
    [resizeState, dragId, options]
  );

  return {
    handleDragStart,
    handleDrag,
    handleDragStop,
    handleResizeStart,
    handleResize,
    handleResizeStop,
    handleSelect,
    handleHover,
    setHoveredId,
    setSelectedId,
  };
}
