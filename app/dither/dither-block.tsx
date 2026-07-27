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
