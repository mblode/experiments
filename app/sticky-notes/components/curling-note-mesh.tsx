"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import {
  Color,
  DoubleSide,
  PlaneGeometry,
  ShaderMaterial,
  type Texture,
  Vector2,
} from "three";

import {
  CURL_MAX_RADIUS,
  CURL_MIN_RADIUS,
  PEEL_DISTANCE_FACTOR,
  SPRING_DAMPING,
  SPRING_MASS,
  SPRING_STIFFNESS,
} from "../constants";
import { type SpringState, springStep } from "../hooks/use-spring";
import { fragmentShader } from "../shaders/page-curl.frag";
import { vertexShader } from "../shaders/page-curl.vert";
import type { AnimationState, Vec2 } from "../store";
import { paperEase } from "../utils/easing";

interface CurlingNoteMeshProps {
  texture: Texture | null;
  clickPos: Vec2;
  dragPos: Vec2;
  baseColor?: string;
  animationState: AnimationState;
  targetProgress: number;
  onAnimationComplete?: () => void;
}

// Check for reduced motion preference
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Spring config based on motion preference
const springConfig = prefersReducedMotion
  ? { stiffness: 500, damping: 50, mass: 1 } // Near-instant for reduced motion
  : { stiffness: SPRING_STIFFNESS, damping: SPRING_DAMPING, mass: SPRING_MASS };

export function CurlingNoteMesh({
  texture,
  clickPos,
  dragPos,
  baseColor = "#fef08a",
  animationState,
  targetProgress,
  onAnimationComplete,
}: CurlingNoteMeshProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const springRef = useRef<SpringState>({
    value: 0,
    velocity: 0,
    isSettled: true,
  });
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  // Simple plane geometry - all curl logic is in fragment shader
  const geometry = useMemo(() => {
    return new PlaneGeometry(1, 1, 1, 1);
  }, []);

  // Create shader material with uniforms
  const material = useMemo(() => {
    const baseColorVec = new Color(baseColor);

    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uClickPos: { value: new Vector2(clickPos.x, 1 - clickPos.y) },
        uDragPos: { value: new Vector2(dragPos.x, 1 - dragPos.y) },
        uRadius: { value: 0.1 },
        uNoteTexture: { value: texture },
        uBaseColor: { value: baseColorVec },
        uBackColor: { value: baseColorVec.clone() }, // Back matches front for sticky notes
      },
      side: DoubleSide,
      transparent: false,
    });
  }, [texture, baseColor, clickPos.x, clickPos.y, dragPos.x, dragPos.y]);

  // Calculate raw progress from positions
  const calculateRawProgress = useCallback(() => {
    const dx = clickPos.x - dragPos.x;
    const dy = dragPos.y - clickPos.y; // Sign flipped to match shader's Y inversion
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.min(1, distance / PEEL_DISTANCE_FACTOR);
  }, [clickPos, dragPos]);

  // Update uniforms on each frame with spring physics
  useFrame((_, delta) => {
    if (!materialRef.current) {
      return;
    }

    // Update positions
    materialRef.current.uniforms.uClickPos.value.set(
      clickPos.x,
      1 - clickPos.y
    );
    materialRef.current.uniforms.uDragPos.value.set(dragPos.x, 1 - dragPos.y);

    // Update colors dynamically (in case note color changes)
    materialRef.current.uniforms.uBaseColor.value.set(baseColor);
    materialRef.current.uniforms.uBackColor.value.set(baseColor);

    // Determine target based on animation state
    let currentTarget: number;

    if (animationState === "dragging") {
      // During drag, follow the raw progress from mouse position
      currentTarget = calculateRawProgress();
    } else if (animationState === "completing") {
      // Animating to completion
      currentTarget = 1;
    } else if (animationState === "cancelling") {
      // Animating back to start
      currentTarget = 0;
    } else {
      // Idle - use target progress
      currentTarget = targetProgress;
    }

    // Apply spring physics
    const isAnimating =
      animationState === "completing" || animationState === "cancelling";

    if (isAnimating && !springRef.current.isSettled) {
      // Use spring physics for smooth animation
      const nextState = springStep(
        springRef.current.value,
        currentTarget,
        springRef.current.velocity,
        springConfig,
        Math.min(delta, 0.064) // Clamp delta for stability
      );

      springRef.current = nextState;

      // Check if animation just completed
      if (nextState.isSettled) {
        onAnimationCompleteRef.current?.();
      }
    } else if (animationState === "dragging") {
      // During drag, directly follow the target (no spring)
      springRef.current.value = currentTarget;
      springRef.current.velocity = 0;
      springRef.current.isSettled = false; // Ready for animation
    }

    // Calculate radius from spring-animated progress with paper-like easing
    const smoothProgress = springRef.current.value;
    const easedProgress = paperEase(smoothProgress);

    // Radius decreases as progress increases (tighter curl when pulled further)
    const radius =
      CURL_MIN_RADIUS +
      (1 - easedProgress) * (CURL_MAX_RADIUS - CURL_MIN_RADIUS);
    materialRef.current.uniforms.uRadius.value = radius;

    if (texture) {
      materialRef.current.uniforms.uNoteTexture.value = texture;
    }
  });

  return (
    <mesh geometry={geometry}>
      <primitive attach="material" object={material} ref={materialRef} />
    </mesh>
  );
}
