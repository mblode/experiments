"use client";

import { makeAutoObservable } from "mobx";
import { isHydrated, makePersistable } from "mobx-persist-store";
import { createContext, useContext, useEffect, useLayoutEffect } from "react";

import type { BlockData, DropPosition } from "../block";

// Mock data for demo
const MOCK_BLOCKS: BlockData[] = [
  {
    id: "block-1",
    title: "My Portfolio",
    type: "link",
    url: "https://portfolio.com",
    visible: true,
    order: 0,
    pageId: "page-1",
  },
  {
    id: "block-2",
    title: "About Me",
    type: "header",
    visible: true,
    order: 1,
    pageId: "page-1",
  },
  {
    id: "block-3",
    title: "Twitter",
    type: "link",
    url: "https://twitter.com",
    visible: true,
    order: 2,
    pageId: "page-1",
  },
  {
    id: "block-4",
    title: "Instagram",
    type: "link",
    url: "https://instagram.com",
    visible: false,
    order: 3,
    pageId: "page-1",
  },
  {
    id: "block-5",
    title: "Contact",
    type: "text",
    visible: true,
    order: 4,
    pageId: "page-1",
  },
];

export class Store {
  blocksData: BlockData[] = MOCK_BLOCKS;

  // Drag state
  activeBlockId: string | null = null;
  settlingBlockId: string | null = null;
  overBlockId: string | null = null;
  dropPosition: DropPosition = null;

  // Drop animation state - position captured when drag ends
  dropAnimationRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null = null;
  dropAnimationRotation = 0;

  // Editor state
  pageId = "page-1";

  constructor() {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get isHydrated() {
    return isHydrated(this);
  }

  reorderBlocks(pageId: string, newOrder: string[]) {
    this.blocksData = this.blocksData.map((block) => {
      if (block.pageId !== pageId) {
        return block;
      }
      const newIndex = newOrder.indexOf(block.id);
      if (newIndex === -1) {
        return block;
      }
      return { ...block, order: newIndex };
    });
  }

  toggleVisibility(blockId: string) {
    this.blocksData = this.blocksData.map((block) =>
      block.id === blockId ? { ...block, visible: !block.visible } : block
    );
  }

  setDropTarget(overBlockId: string | null, position: DropPosition) {
    this.overBlockId = overBlockId;
    this.dropPosition = position;
  }

  clearDropTarget() {
    this.overBlockId = null;
    this.dropPosition = null;
  }

  startDrag(blockId: string) {
    this.activeBlockId = blockId;
    this.dropAnimationRect = null;
  }

  // Called when drag ends - start the settling phase
  startSettling(
    rect: { top: number; left: number; width: number; height: number },
    rotation: number
  ) {
    this.settlingBlockId = this.activeBlockId;
    this.dropAnimationRect = rect;
    this.dropAnimationRotation = rotation;
    this.activeBlockId = null;
    this.clearDropTarget();
  }

  // Called when drop animation completes
  endDrag() {
    this.activeBlockId = null;
    this.settlingBlockId = null;
    this.dropAnimationRect = null;
    this.dropAnimationRotation = 0;
  }
}

// Singleton instance
const store = new Store();

// Context
export const StoreContext = createContext<Store>(store);

// Hook
export function useStore(): Store {
  return useContext(StoreContext);
}

// Persist after mount so the first client render matches SSR mock data.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Provider
export function StoreProvider({ children }: React.PropsWithChildren) {
  useIsomorphicLayoutEffect(() => {
    void makePersistable(store, {
      name: "perfect-dnd-store",
      properties: ["blocksData"],
      storage: window.localStorage,
    });
  }, []);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
