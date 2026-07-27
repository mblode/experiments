"use client";

import { Canvas } from "@react-three/fiber";
import type * as THREE from "three";

import type { AnimationState, Vec2 } from "../store";
import { CurlingNoteMesh } from "./curling-note-mesh";

interface PageCurlCanvasProps {
  isActive: boolean;
  texture: THREE.Texture | null;
  clickPos: Vec2;
  dragPos: Vec2;
  baseColor: string;
  noteSize: number;
  animationState: AnimationState;
  targetProgress: number;
  onAnimationComplete?: () => void;
}

export function PageCurlCanvas({
  isActive,
  texture,
  clickPos,
  dragPos,
  baseColor,
  noteSize,
  animationState,
  targetProgress,
  onAnimationComplete,
}: PageCurlCanvasProps) {
  // Don't render until we have both active state AND texture with the drawing
  if (!(isActive && texture)) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        width: noteSize,
        height: noteSize,
        zIndex: 100,
      }}
    >
      <Canvas
        camera={{
          zoom: noteSize,
          position: [0, 0, 10],
          near: 0.1,
          far: 100,
        }}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        }}
        orthographic
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <CurlingNoteMesh
          animationState={animationState}
          baseColor={baseColor}
          clickPos={clickPos}
          dragPos={dragPos}
          onAnimationComplete={onAnimationComplete}
          targetProgress={targetProgress}
          texture={texture}
        />
      </Canvas>
    </div>
  );
}
