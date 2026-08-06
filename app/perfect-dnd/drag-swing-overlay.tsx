"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { BlockData } from "./block";
import { DragOverlayCard } from "./drag-overlay-card";
import { useDragSwing } from "./use-drag-swing";

interface DragSwingOverlayProps {
  block: BlockData;
}

export function DragSwingOverlay({ block }: DragSwingOverlayProps) {
  // The rotation on the inner wrapper is written straight to `transform` by
  // useDragSwing every frame, so nothing is declared for it here.
  const { overlayRef, scaleRef } = useDragSwing({
    sensitivity: 0.5,
    maxAngle: 20,
    smoothing: 0.12,
    returnStiffness: 220,
    returnDamping: 22,
  });

  const measureRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useLayoutEffect(() => {
    if (measureRef.current && !size) {
      const rect = measureRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
  }, [size]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: size?.height,
      }}
    >
      <div
        ref={scaleRef}
        style={{
          position: size ? "absolute" : "relative",
          top: 0,
          left: 0,
          width: "100%",
          transformOrigin: "center center",
        }}
      >
        <div
          ref={overlayRef}
          style={{ width: "100%", transformOrigin: "center center" }}
        >
          <DragOverlayCard block={block} ref={measureRef} />
        </div>
      </div>
    </div>
  );
}
