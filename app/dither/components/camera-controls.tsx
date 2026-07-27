import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Euler, Vector2 } from "three";
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";

import { useGame } from "../game";

const TOUCH_SENSITIVITY = 0.002;
const _MOUSE_SENSITIVITY = 0.002;

export const CameraControls = () => {
  const { camera, gl } = useThree();
  const { isPlaying } = useGame();
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Touch tracking
  const touchStartRef = useRef<Vector2 | null>(null);
  const rotationRef = useRef<Euler>(new Euler(0, 0, 0, "YXZ"));
  const isTouchRotating = useRef(false);

  // Detect if device is mobile/touch
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const hasPointerLock = "pointerLockElement" in document;
      setIsMobile(hasTouch && !hasPointerLock);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop: PointerLockControls
  useEffect(() => {
    if (isMobile) {
      return;
    }

    const controls = new PointerLockControlsImpl(camera, gl.domElement);
    controlsRef.current = controls;

    const handleClick = () => {
      if (isPlaying) {
        controls.lock();
      }
    };

    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.removeEventListener("click", handleClick);
      // Only unlock if currently locked
      if (controls.isLocked) {
        try {
          controls.unlock();
        } catch {
          // Ignore unlock errors - happens when pointer lock not supported
        }
      }
      controls.dispose();
    };
  }, [camera, gl, isPlaying, isMobile]);

  // Mobile: Touch drag controls
  useEffect(() => {
    if (!isMobile) {
      return;
    }

    // Initialize rotation from camera
    rotationRef.current.setFromQuaternion(camera.quaternion);

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger - camera rotation
        isTouchRotating.current = true;
        touchStartRef.current = new Vector2(
          e.touches[0].clientX,
          e.touches[0].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        !(isTouchRotating.current && touchStartRef.current) ||
        e.touches.length !== 1
      ) {
        return;
      }

      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Update rotation
      rotationRef.current.y -= deltaX * TOUCH_SENSITIVITY;
      rotationRef.current.x -= deltaY * TOUCH_SENSITIVITY;

      // Clamp vertical rotation to prevent camera flip
      const PI_2 = Math.PI / 2;
      rotationRef.current.x = Math.max(
        -PI_2,
        Math.min(PI_2, rotationRef.current.x)
      );

      // Apply rotation to camera
      camera.quaternion.setFromEuler(rotationRef.current);

      // Update touch position for next move
      touchStartRef.current.set(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isTouchRotating.current = false;
        touchStartRef.current = null;
      }
    };

    gl.domElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    gl.domElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    gl.domElement.addEventListener("touchend", handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener("touchstart", handleTouchStart);
      gl.domElement.removeEventListener("touchmove", handleTouchMove);
      gl.domElement.removeEventListener("touchend", handleTouchEnd);
    };
  }, [camera, gl, isMobile]);

  return null;
};
