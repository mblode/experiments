"use client";

import { Canvas } from "@react-three/fiber";

import { CameraControls } from "./components/camera-controls";
import Effects from "./components/effects";
import { GameControls } from "./components/game-controls";
import { UI } from "./components/ui";
import { GameProvider, INITIAL_CAMERA_POSITION } from "./game";
import Scene from "./scene";

export function DitherBlock() {
  return (
    <GameProvider>
      <UI />

      {/* The scene is WebGL, so nothing in it reaches the accessibility tree.
          This is the only description of what is on screen for anyone who
          cannot see it, and the only warning that the game needs a pointer. */}
      <p className="sr-only">
        A first-person flight through a field of asteroids, rendered in two
        colours by a dithering pass. Aim with the mouse or by dragging on a
        touchscreen and hold to fire. The game cannot be played from the
        keyboard.
      </p>

      <Canvas
        camera={{
          position: INITIAL_CAMERA_POSITION,
          fov: 75,
          near: 0.1,
          far: 500,
        }}
        dpr={[1, 2]}
      >
        {/* Multi-directional lighting for maximum asteroid visibility */}
        <ambientLight intensity={1.0} />

        {/* Main sun - from upper back */}
        <directionalLight
          castShadow
          intensity={1.5}
          position={[100, 200, -300]}
        />

        {/* Fill lights from multiple angles */}
        <directionalLight intensity={1.2} position={[-100, 100, 200]} />
        <directionalLight intensity={1.0} position={[100, -100, 100]} />
        <directionalLight intensity={1.0} position={[0, 100, 300]} />
        <directionalLight intensity={0.8} position={[-150, 0, -100]} />

        {/* Scene with dynamic asteroids */}
        <Scene />

        {/* Camera controls (desktop + mobile) */}
        <CameraControls />

        {/* Game controls */}
        <GameControls />

        {/* Post-processing with dither effect */}
        <Effects patternScale={12.0} threshold={0.5} />
      </Canvas>
    </GameProvider>
  );
}
