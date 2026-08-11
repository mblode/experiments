"use client";

import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, useEffect, useState } from "react";

import { CameraControls } from "./components/camera-controls";
import Effects from "./components/effects";
import { GameControls } from "./components/game-controls";
import { UI } from "./components/ui";
import { GameProvider, INITIAL_CAMERA_POSITION } from "./game";
import Scene from "./scene";

/** Three r163+ needs WebGL2; lost/null attributes are what crash postprocessing. */
function isWebGL2Available() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    return Boolean(gl?.getContextAttributes());
  } catch {
    return false;
  }
}

function WebGLFallback() {
  return (
    <div className="flex h-full items-center justify-center p-8 font-mono text-white">
      <p
        className="max-w-md rounded-[14px] bg-[#333319] px-6 py-5 text-center text-xl leading-relaxed"
        role="status"
      >
        This experiment needs WebGL, which isn&apos;t available in this browser.
      </p>
    </div>
  );
}

/** Catches Canvas setup / postprocessing crashes (e.g. null context attributes). */
class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function DitherCanvas() {
  return (
    <Canvas
      camera={{
        position: INITIAL_CAMERA_POSITION,
        fov: 75,
        near: 0.1,
        far: 500,
      }}
      dpr={[1, 2]}
      fallback={<WebGLFallback />}
      onCreated={({ gl }) => {
        const context = gl.getContext();
        const attributes = context?.getContextAttributes() ?? null;
        if (!(context && attributes)) {
          throw new Error("WebGL context unavailable");
        }
        // Match the page ink so clear never reads as an unset/null colour.
        gl.setClearColor("#333319", 1);
      }}
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
  );
}

export function DitherBlock() {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(isWebGL2Available());
  }, []);

  let canvas: ReactNode = null;
  if (webglOk === true) {
    canvas = (
      <CanvasErrorBoundary fallback={<WebGLFallback />}>
        <DitherCanvas />
      </CanvasErrorBoundary>
    );
  } else if (webglOk === false) {
    canvas = <WebGLFallback />;
  }

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

      {canvas}
    </GameProvider>
  );
}
