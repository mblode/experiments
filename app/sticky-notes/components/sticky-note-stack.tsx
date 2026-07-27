"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as THREE from "three";

import {
  EDGE_ZONE_PERCENT,
  MOMENTUM_PROGRESS_MIN,
  MOMENTUM_THRESHOLD,
  NOTE_SIZE,
  PEEL_DISTANCE_FACTOR,
  PEEL_THRESHOLD,
} from "../constants";
import { useSvgToTexture } from "../hooks/use-svg-to-texture";
import { useStickyNotesStore, type Vec2 } from "../store";
import { PageCurlCanvas } from "./page-curl-canvas";
import { StickyNoteComponent, type StickyNoteRef } from "./sticky-note";

export const StickyNoteStack = () => {
  const {
    notes,
    addPathToTopNote,
    isPeeling,
    peelEdge,
    clickPos,
    dragPos,
    animationState,
    targetProgress,
    startPeel,
    updatePeel,
    completePeel,
    cancelPeel,
    setAnimationState,
  } = useStickyNotesStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const topNoteRef = useRef<StickyNoteRef>(null);
  const [noteTexture, setNoteTexture] = useState<THREE.Texture | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Velocity tracking for momentum-based completion
  const lastPosRef = useRef<Vec2>({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<Vec2>({ x: 0, y: 0 });

  const topNote = notes[0];

  const { captureToTexture, disposeTexture } = useSvgToTexture({
    width: NOTE_SIZE,
    height: NOTE_SIZE,
    backgroundColor: topNote?.color || "#fef08a",
  });

  // Convert client coordinates to normalized note-space (0-1)
  const clientToNoteSpace = useCallback(
    (clientX: number, clientY: number): Vec2 | null => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return null;
      }

      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    },
    []
  );

  // Detect which edge the pointer is on and return position
  const detectEdgeAndPos = useCallback(
    (
      clientX: number,
      clientY: number
    ): { edge: "top" | "right" | "bottom" | "left"; pos: Vec2 } | null => {
      const pos = clientToNoteSpace(clientX, clientY);
      if (!pos) {
        return null;
      }

      let edge: "top" | "right" | "bottom" | "left" | null = null;
      if (pos.y < EDGE_ZONE_PERCENT) {
        edge = "top";
      } else if (pos.x > 1 - EDGE_ZONE_PERCENT) {
        edge = "right";
      } else if (pos.y > 1 - EDGE_ZONE_PERCENT) {
        edge = "bottom";
      } else if (pos.x < EDGE_ZONE_PERCENT) {
        edge = "left";
      }

      return edge ? { edge, pos } : null;
    },
    [clientToNoteSpace]
  );

  // Calculate progress from clickPos and dragPos using edge-aware directional distance
  const computeProgress = useCallback((): number => {
    const dx = dragPos.x - clickPos.x;
    const dy = dragPos.y - clickPos.y;

    // Use directional distance based on which edge is being peeled
    let distance = 0;
    switch (peelEdge) {
      case "right":
        distance = -dx; // Pulling left from right edge
        break;
      case "left":
        distance = dx; // Pulling right from left edge
        break;
      case "top":
        distance = dy; // Pulling down from top edge
        break;
      case "bottom":
        distance = -dy; // Pulling up from bottom edge
        break;
      default:
        // Fallback to diagonal for safety
        distance = Math.sqrt(dx * dx + dy * dy);
    }

    return Math.min(1, Math.max(0, distance / PEEL_DISTANCE_FACTOR));
  }, [clickPos, dragPos, peelEdge]);

  // Track if we're in a drag
  const isDraggingRef = useRef(false);

  // Handle peel start
  const handlePeelStart = useCallback(
    async (edge: "top" | "right" | "bottom" | "left", pos: Vec2) => {
      // Capture SVG to texture
      const svgElement = topNoteRef.current?.getSvgElement();
      if (svgElement) {
        const texture = await captureToTexture(svgElement);
        setNoteTexture(texture);
      }

      startPeel(edge, pos);
    },
    [captureToTexture, startPeel]
  );

  // Handle pointer events on container
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPeeling) {
        return;
      }

      const detection = detectEdgeAndPos(e.clientX, e.clientY);
      if (detection) {
        e.preventDefault();
        e.stopPropagation();
        (e.target as Element).setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;

        isDraggingRef.current = true;
        handlePeelStart(detection.edge, detection.pos);
      }
    },
    [isPeeling, detectEdgeAndPos, handlePeelStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!(isDraggingRef.current && isPeeling)) {
        return;
      }

      const pos = clientToNoteSpace(e.clientX, e.clientY);
      if (pos) {
        // Track velocity for momentum-based completion
        const now = performance.now();
        const dt = (now - lastTimeRef.current) / 1000; // Convert to seconds

        if (dt > 0 && lastTimeRef.current > 0) {
          velocityRef.current = {
            x: (pos.x - lastPosRef.current.x) / dt,
            y: (pos.y - lastPosRef.current.y) / dt,
          };
        }

        lastPosRef.current = pos;
        lastTimeRef.current = now;

        updatePeel(pos);
      }
    },
    [isPeeling, clientToNoteSpace, updatePeel]
  );

  // Calculate edge-specific velocity magnitude
  const getEdgeVelocity = useCallback((): number => {
    const { x: vx, y: vy } = velocityRef.current;

    switch (peelEdge) {
      case "right":
        return -vx; // Pulling left
      case "left":
        return vx; // Pulling right
      case "top":
        return vy; // Pulling down
      case "bottom":
        return -vy; // Pulling up
      default:
        return Math.sqrt(vx * vx + vy * vy);
    }
  }, [peelEdge]);

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      // Release pointer capture
      if (pointerIdRef.current !== null && e?.target) {
        try {
          (e.target as Element).releasePointerCapture(pointerIdRef.current);
        } catch {
          // Ignore if already released
        }
        pointerIdRef.current = null;
      }

      isDraggingRef.current = false;
      const progress = computeProgress();
      const velocity = getEdgeVelocity();

      // Reset velocity tracking
      velocityRef.current = { x: 0, y: 0 };
      lastTimeRef.current = 0;

      // Determine if we should complete based on progress OR momentum
      // Complete if: progress >= 0.5 OR (progress >= 0.3 AND velocity > threshold)
      const shouldComplete =
        progress >= PEEL_THRESHOLD ||
        (progress >= MOMENTUM_PROGRESS_MIN && velocity > MOMENTUM_THRESHOLD);

      if (shouldComplete) {
        // Trigger completion animation
        setAnimationState("completing", 1);
      } else {
        // Trigger cancel animation
        setAnimationState("cancelling", 0);
      }
    },
    [computeProgress, getEdgeVelocity, setAnimationState]
  );

  // Handle animation completion from spring physics
  const handleAnimationComplete = useCallback(() => {
    if (animationState === "completing") {
      completePeel();
    } else if (animationState === "cancelling") {
      cancelPeel();
    }

    // Clean up texture
    disposeTexture();
    setNoteTexture(null);
  }, [animationState, completePeel, cancelPeel, disposeTexture]);

  // Clean up texture on unmount
  useEffect(() => {
    return () => {
      disposeTexture();
    };
  }, [disposeTexture]);

  return (
    <div
      className="relative flex items-center justify-center"
      onPointerDown={handlePointerDown}
      onPointerLeave={() => handlePointerUp()}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={containerRef}
      style={{
        width: NOTE_SIZE,
        height: NOTE_SIZE + 40,
      }}
    >
      {/* Render notes from bottom to top */}
      {[...notes].reverse().map((note, reversedIndex) => {
        const actualIndex = notes.length - 1 - reversedIndex;
        const isTop = actualIndex === 0;

        return (
          <StickyNoteComponent
            index={actualIndex}
            isPeeling={isTop && isPeeling && noteTexture !== null}
            isTopNote={isTop}
            key={note.id}
            note={note}
            onAddPath={addPathToTopNote}
            ref={isTop ? topNoteRef : undefined}
          />
        );
      })}

      {/* WebGL page curl overlay */}
      <PageCurlCanvas
        animationState={animationState}
        baseColor={topNote?.color || "#fef08a"}
        clickPos={clickPos}
        dragPos={dragPos}
        isActive={isPeeling}
        noteSize={NOTE_SIZE}
        onAnimationComplete={handleAnimationComplete}
        targetProgress={targetProgress}
        texture={noteTexture}
      />
    </div>
  );
};
