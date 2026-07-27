import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";

import { Asteroid } from "./components/asteroid";
import { Explosions } from "./components/explosion";
import type { Asteroid as AsteroidType } from "./game";
import { useGame } from "./game";

const MAX_ASTEROIDS = 30;
const SPAWN_INTERVAL_START = 1.2; // Starting spawn interval (seconds)
const SPAWN_INTERVAL_MIN = 0.3; // Minimum spawn interval at high scores
const SPAWN_DISTANCE_MIN = 60; // Spawn ahead of camera
const SPAWN_DISTANCE_MAX = 150;
const REMOVE_DISTANCE = 200; // Remove when far from camera (any direction)
const MIN_SPAWN_SAFETY = 15; // Minimum distance from camera when spawning

// Difficulty scaling constants
const SPAWN_RATE_SCALE = 2000; // Score points to reduce spawn interval
const VELOCITY_SCALE = 500; // Score points to increase asteroid velocity

// Helper function to create asteroid properties (avoids code duplication)
function createAsteroidProperties(
  id: number,
  score = 0
): Omit<AsteroidType, "position"> {
  // Random linear velocity with scaling based on score
  const dirX = (Math.random() - 0.5) * 2;
  const dirY = (Math.random() - 0.5) * 2;
  const dirZ = (Math.random() - 0.5) * 2;
  const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

  // Scale max velocity with score: starts at 10.5, increases by 1 per 500 points
  const baseMaxVelocity = 10;
  const velocityBonus = Math.max(0, score) / VELOCITY_SCALE;
  const maxVelocity = baseMaxVelocity + velocityBonus;
  const speed = 0.5 + Math.random() * maxVelocity; // 0.5 to (10.5 + bonus) units/sec

  const velocityX = (dirX / length) * speed;
  const velocityY = (dirY / length) * speed;
  const velocityZ = (dirZ / length) * speed;

  // Varied asteroid sizes
  const radius = 2 + Math.random() * 6; // 2-8 units

  // Very bright colors
  const gray = Math.floor(Math.random() * 10 + 245)
    .toString(16)
    .padStart(2, "0"); // 245-255

  const roughness = Math.random() * 0.4 + 0.3; // 0.3-0.7

  return {
    id,
    radius,
    color: `#${gray}${gray}${gray}`,
    roughness,
    velocity: [velocityX, velocityY, velocityZ],
    rotation: [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ],
    rotationSpeed: [
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
    ],
    shapeSeed: Math.random() * 10_000,
  };
}

export default function Scene() {
  const { camera } = useThree();
  const { asteroids, setAsteroids, isPlaying, isGameOver, score } = useGame();

  const nextIdRef = useRef(0);
  const spawnAccumulator = useRef(0);
  const asteroidsRef = useRef<AsteroidType[]>([]);
  const initializedRef = useRef(false);

  // Generate static background stars once as a point cloud
  const starGeometry = useMemo(() => {
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 100; // Fixed radius for all stars

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions, sizes };
  }, []);

  const starsRef = useRef<THREE.Points>(null);

  // Initialize asteroids on mount and when game restarts
  useEffect(() => {
    if ((!isPlaying || isGameOver) && initializedRef.current) {
      // Game ended, reset
      initializedRef.current = false;
      asteroidsRef.current = [];
      setAsteroids([]);
      return;
    }

    if (!isPlaying || isGameOver || initializedRef.current) {
      return;
    }

    // Reset for new game
    nextIdRef.current = 0;
    spawnAccumulator.current = 0;
    initializedRef.current = true;

    // Start with some initial asteroids
    const initialAsteroids: AsteroidType[] = [];
    const numInitial = 10;
    const startPos = camera.position;

    for (let i = 0; i < numInitial; i++) {
      // Spawn in front of camera in a wide spread
      const spreadX = (Math.random() - 0.5) * 80;
      const spreadY = (Math.random() - 0.5) * 60;
      const distance =
        SPAWN_DISTANCE_MIN +
        Math.random() * (SPAWN_DISTANCE_MAX - SPAWN_DISTANCE_MIN);

      const x = startPos.x + spreadX;
      const y = startPos.y + spreadY;
      const z = startPos.z - distance; // Negative Z is forward in Three.js

      // Check minimum safety distance
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      const dz = z - startPos.z;
      const distFromCamera = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distFromCamera < MIN_SPAWN_SAFETY) {
        i--; // Retry this iteration
        continue;
      }

      // Create asteroid with helper function
      initialAsteroids.push({
        ...createAsteroidProperties(nextIdRef.current++, 0), // Start at score 0
        position: [x, y, z],
      });
    }

    asteroidsRef.current = initialAsteroids;
    setAsteroids(initialAsteroids);
  }, [isPlaying, isGameOver, setAsteroids, camera]);

  // Handle external asteroid removals (e.g., from shooting) without overwriting positions
  useEffect(() => {
    const stateIds = new Set(asteroids.map((a) => a.id));
    const refIds = new Set(asteroidsRef.current.map((a) => a.id));

    // Only remove asteroids from ref that are no longer in state
    // Don't touch positions of remaining asteroids
    const removed = Array.from(refIds).filter((id) => !stateIds.has(id));
    if (removed.length > 0) {
      asteroidsRef.current = asteroidsRef.current.filter((a) =>
        stateIds.has(a.id)
      );
    }
  }, [asteroids]);

  // Update asteroid positions and spawn new ones
  useFrame((_, delta) => {
    if (!(isPlaying && initializedRef.current)) {
      return;
    }

    let needsStateUpdate = false;
    const currentCameraPos = camera.position;

    // Update positions - positions are stored in ref and read directly during render
    // No need to update React state for position changes - only for add/remove
    asteroidsRef.current = asteroidsRef.current.map((asteroid) => ({
      ...asteroid,
      position: [
        asteroid.position[0] + asteroid.velocity[0] * delta,
        asteroid.position[1] + asteroid.velocity[1] * delta,
        asteroid.position[2] + asteroid.velocity[2] * delta,
      ] as [number, number, number],
      rotation: [
        asteroid.rotation[0] + asteroid.rotationSpeed[0] * delta,
        asteroid.rotation[1] + asteroid.rotationSpeed[1] * delta,
        asteroid.rotation[2] + asteroid.rotationSpeed[2] * delta,
      ] as [number, number, number],
    }));

    // Remove asteroids that are too far from camera (any direction)
    const beforeCount = asteroidsRef.current.length;
    asteroidsRef.current = asteroidsRef.current.filter((asteroid) => {
      const dx = asteroid.position[0] - currentCameraPos.x;
      const dy = asteroid.position[1] - currentCameraPos.y;
      const dz = asteroid.position[2] - currentCameraPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance < REMOVE_DISTANCE;
    });
    if (asteroidsRef.current.length !== beforeCount) {
      needsStateUpdate = true;
    }

    // Calculate dynamic spawn interval based on score (gets faster over time)
    // Formula: spawnInterval = max(0.3, 1.2 - score/2000)
    const currentSpawnInterval = Math.max(
      SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_START - Math.max(0, score) / SPAWN_RATE_SCALE
    );

    // Spawn new asteroids using accumulated time
    spawnAccumulator.current += delta;

    if (
      spawnAccumulator.current >= currentSpawnInterval &&
      asteroidsRef.current.length < MAX_ASTEROIDS
    ) {
      spawnAccumulator.current = 0;
      needsStateUpdate = true;

      const numToSpawn = Math.min(
        Math.floor(Math.random() * 2) + 1,
        MAX_ASTEROIDS - asteroidsRef.current.length
      );

      for (let i = 0; i < numToSpawn; i++) {
        const spreadX = (Math.random() - 0.5) * 100;
        const spreadY = (Math.random() - 0.5) * 80;
        const distance =
          SPAWN_DISTANCE_MIN +
          Math.random() * (SPAWN_DISTANCE_MAX - SPAWN_DISTANCE_MIN);

        const x = currentCameraPos.x + spreadX;
        const y = currentCameraPos.y + spreadY;
        const z = currentCameraPos.z - distance;

        // Check minimum safety distance
        const dx = x - currentCameraPos.x;
        const dy = y - currentCameraPos.y;
        const dz = z - currentCameraPos.z;
        const distFromCamera = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distFromCamera < MIN_SPAWN_SAFETY) {
          i--; // Retry this iteration
          continue;
        }

        // Create asteroid with helper function (pass current score for difficulty scaling)
        asteroidsRef.current.push({
          ...createAsteroidProperties(nextIdRef.current++, score),
          position: [x, y, z],
        });
      }
    }

    // Only update React state when asteroids added/removed
    if (needsStateUpdate) {
      setAsteroids([...asteroidsRef.current]);
    }

    // Update star position to follow camera (skybox effect - infinite distance)
    if (starsRef.current) {
      starsRef.current.position.copy(camera.position);
    }
  });

  return (
    <>
      {/* Background stars - skybox at infinite distance */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            args={[starGeometry.positions, 3]}
            attach="attributes-position"
          />
          <bufferAttribute
            args={[starGeometry.sizes, 1]}
            attach="attributes-size"
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={1.5}
          sizeAttenuation={false}
          transparent={false}
        />
      </points>

      {/* Dynamic asteroids - render from ref for real-time position updates */}
      {asteroidsRef.current.map((asteroid) => (
        <Asteroid asteroid={asteroid} key={asteroid.id} />
      ))}

      {/* Explosion effects */}
      <Explosions />
    </>
  );
}
