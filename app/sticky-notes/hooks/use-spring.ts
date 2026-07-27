"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { SPRING_DAMPING, SPRING_MASS, SPRING_STIFFNESS } from "../constants";

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface SpringState {
  value: number;
  velocity: number;
  isSettled: boolean;
}

const DEFAULT_CONFIG: SpringConfig = {
  stiffness: SPRING_STIFFNESS,
  damping: SPRING_DAMPING,
  mass: SPRING_MASS,
};

// Threshold for considering the spring settled
const SETTLE_THRESHOLD = 0.001;
const VELOCITY_THRESHOLD = 0.001;

/**
 * Spring physics hook for smooth animations within Three.js context.
 * Uses the spring equation: F = -k * x - c * v
 * where k = stiffness, c = damping, x = displacement, v = velocity
 */
export function useSpring(
  target: number,
  config: Partial<SpringConfig> = {},
  onSettle?: () => void
): SpringState {
  const { stiffness, damping, mass } = { ...DEFAULT_CONFIG, ...config };

  const stateRef = useRef<SpringState>({
    value: target,
    velocity: 0,
    isSettled: true,
  });

  const targetRef = useRef(target);
  const onSettleRef = useRef(onSettle);
  onSettleRef.current = onSettle;

  // Update target when it changes
  if (targetRef.current !== target) {
    targetRef.current = target;
    stateRef.current.isSettled = false;
  }

  useFrame((_, delta) => {
    const state = stateRef.current;
    const currentTarget = targetRef.current;

    // Skip if already settled
    if (state.isSettled) {
      return;
    }

    // Clamp delta to avoid instability with large time steps
    const dt = Math.min(delta, 0.064);

    // Spring physics calculation
    const displacement = state.value - currentTarget;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * state.velocity;
    const acceleration = (springForce + dampingForce) / mass;

    // Update velocity and position
    state.velocity += acceleration * dt;
    state.value += state.velocity * dt;

    // Check if settled
    const isSettled =
      Math.abs(displacement) < SETTLE_THRESHOLD &&
      Math.abs(state.velocity) < VELOCITY_THRESHOLD;

    if (isSettled) {
      state.value = currentTarget;
      state.velocity = 0;
      state.isSettled = true;
      onSettleRef.current?.();
    }
  });

  return stateRef.current;
}

/**
 * Standalone spring step function for manual animation control.
 * Returns the next state without requiring useFrame.
 */
export function springStep(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  deltaTime: number
): SpringState {
  const { stiffness, damping, mass } = config;

  const displacement = current - target;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * velocity;
  const acceleration = (springForce + dampingForce) / mass;

  const newVelocity = velocity + acceleration * deltaTime;
  const newValue = current + newVelocity * deltaTime;

  const isSettled =
    Math.abs(newValue - target) < SETTLE_THRESHOLD &&
    Math.abs(newVelocity) < VELOCITY_THRESHOLD;

  return {
    value: isSettled ? target : newValue,
    velocity: isSettled ? 0 : newVelocity,
    isSettled,
  };
}
