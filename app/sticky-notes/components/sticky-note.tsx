"use client";

import { getStroke } from "perfect-freehand";
import type React from "react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { getSvgPathFromStroke } from "@/lib/utils";

import { NOTE_SIZE } from "../constants";
import type { PathData, Point, StickyNote as StickyNoteType } from "../store";

interface StickyNoteProps {
  note: StickyNoteType;
  isTopNote: boolean;
  index: number;
  onAddPath: (path: PathData) => void;
  isPeeling?: boolean;
}

export interface StickyNoteRef {
  getSvgElement: () => SVGSVGElement | null;
}

export const StickyNoteComponent = forwardRef<StickyNoteRef, StickyNoteProps>(
  ({ note, isTopNote, index, onAddPath, isPeeling = false }, ref) => {
    const [currentPath, setCurrentPath] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const currentBrushSize = 8;

    // Expose SVG element to parent
    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
    }));

    const getPointFromEvent = useCallback((e: React.PointerEvent): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) {
        return { x: 0, y: 0 };
      }

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5,
      };
    }, []);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        if (!isTopNote || isPeeling) {
          return;
        }

        e.preventDefault();
        const target = e.target as Element;
        target.setPointerCapture(e.pointerId);

        const point = getPointFromEvent(e);
        setCurrentPath([point]);
        setIsDrawing(true);
      },
      [isTopNote, isPeeling, getPointFromEvent]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!(isDrawing && isTopNote) || isPeeling) {
          return;
        }

        const point = getPointFromEvent(e);
        setCurrentPath((prev) => [...prev, point]);
      },
      [isDrawing, isTopNote, isPeeling, getPointFromEvent]
    );

    const handlePointerUp = useCallback(() => {
      if (!isDrawing || currentPath.length < 2) {
        setIsDrawing(false);
        setCurrentPath([]);
        return;
      }

      onAddPath({
        points: currentPath,
        color: "#000",
        size: currentBrushSize,
      });
      setCurrentPath([]);
      setIsDrawing(false);
    }, [isDrawing, currentPath, onAddPath]);

    const renderPath = (pathData: PathData, pathIndex: number) => {
      if (pathData.points.length < 2) {
        return null;
      }

      const stroke = getStroke(
        pathData.points.map((p) => [p.x, p.y, p.pressure || 0.5]),
        {
          size: pathData.size,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        }
      );

      const pathD = getSvgPathFromStroke(stroke);

      return (
        <path
          d={pathD}
          fill={pathData.color}
          key={pathIndex}
          style={{ pointerEvents: "none" }}
        />
      );
    };

    const renderCurrentPath = () => {
      if (currentPath.length < 2) {
        return null;
      }

      const stroke = getStroke(
        currentPath.map((p) => [p.x, p.y, p.pressure || 0.5]),
        {
          size: currentBrushSize,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        }
      );

      const pathD = getSvgPathFromStroke(stroke);

      return <path d={pathD} fill="#000" style={{ pointerEvents: "none" }} />;
    };

    // Calculate stacking offset - bottom notes peek out slightly
    const stackOffset = index * 1.5;

    // Hide top note when peeling (WebGL canvas takes over)
    const visibility = isTopNote && isPeeling ? "hidden" : "visible";

    return (
      <div
        className="absolute"
        style={{
          width: NOTE_SIZE,
          height: NOTE_SIZE,
          backgroundColor: note.color,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 4,
          transform: `translateY(${stackOffset}px)`,
          zIndex: 25 - index,
          boxShadow:
            index === 24
              ? "0 4px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)"
              : "none",
          cursor: isTopNote && !isPeeling ? "crosshair" : "default",
          visibility,
        }}
      >
        <svg
          aria-label={`Sticky note ${note.id}`}
          className="touch-none"
          height={NOTE_SIZE}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={svgRef}
          style={{ touchAction: "none" }}
          viewBox={`0 0 ${NOTE_SIZE} ${NOTE_SIZE}`}
          width={NOTE_SIZE}
        >
          <title>{`Sticky note ${note.id}`}</title>
          {/* Background rect for texture capture */}
          <rect fill={note.color} height={NOTE_SIZE} width={NOTE_SIZE} />
          {note.paths.map(renderPath)}
          {isTopNote && renderCurrentPath()}
        </svg>
      </div>
    );
  }
);

StickyNoteComponent.displayName = "StickyNoteComponent";
