import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import { type Object3D, Raycaster, Vector2, Vector3 } from "three";

import { INITIAL_CAMERA_POSITION, useGame } from "../game";

// Movement constants
const BASE_SPEED = 30; // Starting forward speed (units per second)
const SPEED_SCALE_POINTS = 500; // Points needed for each speed tier
const SPEED_SCALE_MULTIPLIER = 1.2; // Speed multiplier per tier (20% increase)
const MAX_SPEED = 150; // Maximum speed cap (units per second)

// Combat constants
const SHOT_COOLDOWN_MS = 200; // Milliseconds between shots

// Collision constants
const ASTEROID_VISUAL_RADIUS_MULTIPLIER = 1.25; // Displacement makes asteroids ~25% larger
const PLAYER_COLLISION_RADIUS = 0.5; // Player collision sphere radius

export const GameControls = () => {
  const { camera, scene, gl } = useThree();
  const {
    isPlaying,
    isGameOver,
    distance: _distance,
    updateDistance,
    endGame,
    startGame,
    asteroids,
    setCameraPosition,
    handleAsteroidDestroyed,
    setLastShotTime,
    updateScore: _updateScore,
    score,
  } = useGame();

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastShotTime = useRef<number>(0);
  const startPosition = useRef<Vector3>(
    new Vector3(...INITIAL_CAMERA_POSITION)
  );
  const isTouching = useRef<boolean>(false);
  const autoFireInterval = useRef<number | null>(null);
  const scoreRef = useRef<number>(score);

  // Keep scoreRef in sync with score
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Extract shoot logic into reusable function
  const shootRaycast = useCallback(() => {
    if (!isPlaying) {
      return;
    }

    const now = Date.now();

    if (now - lastShotTime.current < SHOT_COOLDOWN_MS) {
      return;
    }
    lastShotTime.current = now;
    setLastShotTime(now);

    // Raycasting from camera center
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(0, 0), camera); // Center of screen

    // Find all asteroid meshes by traversing the scene directly
    const asteroidMeshes: Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.type === "Mesh" && obj.userData.asteroidId !== undefined) {
        asteroidMeshes.push(obj);
      }
    });

    if (asteroidMeshes.length === 0) {
      return;
    }

    const intersects = raycaster.intersectObjects(asteroidMeshes, false);

    if (intersects.length > 0) {
      // Hit! Find which asteroid was hit
      const hitMesh = intersects[0].object;
      const hitPosition = intersects[0].point;
      const asteroidId = hitMesh.userData.asteroidId;

      // Calculate current speed multiplier for scoring (use ref for latest value)
      const speedTier = Math.max(0, scoreRef.current) / SPEED_SCALE_POINTS;
      const currentSpeed = Math.min(
        MAX_SPEED,
        BASE_SPEED * SPEED_SCALE_MULTIPLIER ** speedTier
      );
      const speedMultiplier = currentSpeed / BASE_SPEED;

      // Handle asteroid destruction with batched state update
      handleAsteroidDestroyed(
        asteroidId,
        [hitPosition.x, hitPosition.y, hitPosition.z],
        now,
        speedMultiplier
      );
    }
  }, [camera, handleAsteroidDestroyed, isPlaying, scene, setLastShotTime]);

  // Auto-fire management
  const startAutoFire = useCallback(() => {
    if (autoFireInterval.current !== null) {
      return;
    }

    // Fire immediately on touch start
    shootRaycast();

    // Then continue firing at intervals
    autoFireInterval.current = window.setInterval(() => {
      shootRaycast();
    }, SHOT_COOLDOWN_MS);
  }, [shootRaycast]);

  const stopAutoFire = useCallback(() => {
    if (autoFireInterval.current !== null) {
      clearInterval(autoFireInterval.current);
      autoFireInterval.current = null;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow restart with spacebar or Enter when game is over
      if (isGameOver && (e.key === " " || e.key === "Enter")) {
        startGame();
        return;
      }

      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handlePointerDown = () => {
      // Allow restart by clicking anywhere when game is over
      if (isGameOver) {
        startGame();
        return;
      }

      // Desktop: Start auto-fire on mouse down
      isTouching.current = true;
      startAutoFire();
    };

    const handlePointerUp = () => {
      // Desktop: Stop auto-fire on mouse up
      isTouching.current = false;
      stopAutoFire();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isGameOver) {
        return;
      }
      // Prevent pointerdown from also firing
      e.preventDefault();
      isTouching.current = true;
      startAutoFire();
    };

    const handleTouchEnd = () => {
      isTouching.current = false;
      stopAutoFire();
    };

    // Detect if device is mobile/touch
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    if (isMobile) {
      // Mobile: Use touch events for auto-fire
      gl.domElement.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      gl.domElement.addEventListener("touchend", handleTouchEnd);
      gl.domElement.addEventListener("touchcancel", handleTouchEnd);
    } else {
      // Desktop: Use pointer events for auto-fire (hold to shoot)
      gl.domElement.addEventListener("pointerdown", handlePointerDown);
      gl.domElement.addEventListener("pointerup", handlePointerUp);
      gl.domElement.addEventListener("pointerleave", handlePointerUp);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (isMobile) {
        gl.domElement.removeEventListener("touchstart", handleTouchStart);
        gl.domElement.removeEventListener("touchend", handleTouchEnd);
        gl.domElement.removeEventListener("touchcancel", handleTouchEnd);
      } else {
        gl.domElement.removeEventListener("pointerdown", handlePointerDown);
        gl.domElement.removeEventListener("pointerup", handlePointerUp);
        gl.domElement.removeEventListener("pointerleave", handlePointerUp);
      }

      stopAutoFire();
    };
  }, [isGameOver, startGame, gl, startAutoFire, stopAutoFire]);

  // Reset game state when restarting
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      camera.position.set(...INITIAL_CAMERA_POSITION);
      startPosition.current.set(...INITIAL_CAMERA_POSITION);
      keysPressed.current = {};
    }
  }, [isPlaying, isGameOver, camera]);

  useFrame((_, delta) => {
    if (!isPlaying) {
      return;
    }

    // Progressive speed system - gets faster as score increases
    const speedTier = Math.max(0, score) / SPEED_SCALE_POINTS;
    const currentSpeed = Math.min(
      MAX_SPEED,
      BASE_SPEED * SPEED_SCALE_MULTIPLIER ** speedTier
    );

    // Get camera forward direction
    const forward = new Vector3();
    camera.getWorldDirection(forward);

    // Apply constant forward movement
    camera.position.addScaledVector(forward, currentSpeed * delta);

    // Update game state with current camera position (for asteroid spawning)
    setCameraPosition([
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]);

    // Update distance score (total distance from start)
    const newDistance = camera.position.distanceTo(startPosition.current);
    updateDistance(newDistance);

    // Collision detection with asteroids
    for (const asteroid of asteroids) {
      const dx = camera.position.x - asteroid.position[0];
      const dy = camera.position.y - asteroid.position[1];
      const dz = camera.position.z - asteroid.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Account for displacement (±22% from noise) and player collision sphere
      const visualRadius = asteroid.radius * ASTEROID_VISUAL_RADIUS_MULTIPLIER;

      if (dist < visualRadius + PLAYER_COLLISION_RADIUS) {
        // Collision! End game
        endGame();
        break;
      }
    }
  });

  return null;
};
