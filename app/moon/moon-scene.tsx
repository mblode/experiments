import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  BasicShadowMap,
  ClampToEdgeWrapping,
  type DirectionalLight,
  FrontSide,
  type Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  type Mesh,
  RepeatWrapping,
  RGBAFormat,
  type Texture,
  TextureLoader,
  Vector2,
} from "three";

import { type Inputs, solveMoon } from "./astro";

interface Props {
  inputs: Inputs;
  // optional speed multiplier for auto-scrub playback (days per second)
  speed?: number;
  textures: {
    color: string;
    normal: string;
    roughness: string;
    displacement: string;
  };
}

function MoonMesh(props: Props) {
  const { inputs, textures, speed = 0 } = props;
  const { gl } = useThree(); // Get renderer for anisotropy settings
  const group = useRef<Group>(null);
  const light = useRef<DirectionalLight>(null);
  const moon = useRef<Mesh>(null);

  const colorMap = useMemo(
    () => new TextureLoader().load(textures.color),
    [textures.color]
  );
  const normalMap = useMemo(
    () => new TextureLoader().load(textures.normal),
    [textures.normal]
  );
  const roughnessMap = useMemo(
    () => new TextureLoader().load(textures.roughness),
    [textures.roughness]
  );
  const displacementMap = useMemo(
    () => new TextureLoader().load(textures.displacement),
    [textures.displacement]
  );

  // Configure NASA LRO textures for optimal lunar surface rendering
  useMemo(() => {
    const configureLunarTexture = (texture: Texture, isNormalMap = false) => {
      // NASA LRO textures are in equirectangular projection
      texture.wrapS = RepeatWrapping;
      texture.wrapT = ClampToEdgeWrapping;

      // Proper texture orientation for lunar coordinate system
      texture.flipY = true;
      texture.offset.set(0.47, 0); // Offset X to show more textured lunar terrain
      texture.repeat.set(1, 1);

      // High-quality filtering for detailed lunar surface
      texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
      texture.magFilter = LinearFilter;
      texture.minFilter = LinearMipmapLinearFilter;

      // Generate mipmaps for better performance
      texture.generateMipmaps = true;

      // Normal map specific settings
      if (isNormalMap) {
        texture.format = RGBAFormat;
      }
    };

    configureLunarTexture(colorMap);
    configureLunarTexture(normalMap, true);
    configureLunarTexture(roughnessMap);
    configureLunarTexture(displacementMap);
  }, [colorMap, normalMap, roughnessMap, displacementMap, gl.capabilities]);

  // Recompute astronomy solution when inputs change
  const sol = useMemo(() => solveMoon(inputs), [inputs]);

  const timeRef = useRef(inputs.date.getTime());

  // TIDAL LOCKING: Moon orientation stays COMPLETELY FIXED
  useEffect(() => {
    if (!group.current) {
      return;
    }

    // FUNDAMENTAL PHYSICS: The Moon is tidally locked to Earth
    // - Same side always faces Earth (synchronous rotation = orbital period)
    // - Moon does NOT rotate to create phases - phases come from lighting geometry ONLY
    // - Moon orientation must stay fixed as dates change

    // Set FIXED orientation once and never change it
    group.current.rotation.set(0, 1.8, 0);

    // Only texture coordinate correction (flip Y to match lunar coordinate system)
    group.current.rotateX(Math.PI);

    // NO MORE ROTATIONS - moon stays tidally locked
    // Phases are created by sun direction changes only
  }, []); // Empty dependency array - this only runs once

  // PHASE CREATION: Change sun direction to simulate orbital motion
  useFrame((_state, delta) => {
    let currentSol = sol;

    // Time progression for animation
    if (speed) {
      timeRef.current += delta * speed * 86_400_000; // advance time by speed days per second
      const animDate = new Date(timeRef.current);
      currentSol = solveMoon({ ...inputs, date: animDate });
    }

    if (!light.current) {
      return;
    }

    // MOON PHASE PHYSICS: Phases result from changing Sun-Moon-Earth geometry
    // As the Moon orbits Earth, the Sun appears to move relative to the Moon-Earth system
    // This creates different illumination patterns (phases) visible from Earth
    //
    // KEY INSIGHT: Moon stays tidally locked, sun direction changes with orbital motion
    // - New Moon: Sun direction from "behind" moon (between Earth-Sun)
    // - Full Moon: Sun direction from "in front" (Earth between Moon-Sun)
    // - Quarter phases: Sun direction from the "side"

    const [x, y, z] = currentSol.sunDir;
    const lightDistance = 100;

    // Position directional light to simulate sun's position relative to Moon-Earth system
    // The sunDir vector represents where the Sun appears from the Moon's perspective
    light.current.position.set(
      x * lightDistance,
      y * lightDistance,
      z * lightDistance
    );

    // Ensure light targets moon center for accurate directional illumination
    light.current.target.position.set(0, 0, 0);
    light.current.target.updateMatrixWorld();

    // Update shadow mapping for realistic terminator line
    light.current.shadow.camera.updateProjectionMatrix();
  });

  return (
    <group ref={group}>
      <mesh receiveShadow ref={moon}>
        <sphereGeometry args={[1, 256, 256]} />
        <meshPhysicalMaterial
          // NASA LRO Surface Textures
          clearcoat={0.0} // Anorthositic crust albedo
          displacementBias={0.0} // Surface normal details
          displacementMap={displacementMap} // Enhanced normal mapping for better surface detail
          displacementScale={0.012} // Surface roughness variation
          // Lunar Surface Material Properties
          map={colorMap} // Moon surface is very rough/dusty
          metalness={0.0} // Lunar regolith is non-metallic
          normalMap={normalMap} // No clear coating
          // Displacement for surface height variation
          normalScale={new Vector2(1.2, 1.2)} // LRO LOLA elevation data
          reflectivity={0.12} // More pronounced height variation
          roughness={0.9}
          // Enhanced lunar surface reflectance for better visibility
          roughnessMap={roughnessMap}
          side={FrontSide} // Very low - lunar regolith is matte/dusty
          specularIntensity={0.02}
          transparent={false}
        />
      </mesh>

      {/* LUNAR LIGHTING: Harsh shadows due to no atmosphere */}

      <ambientLight intensity={0.1} />

      {/* Sun light - creates harsh, well-defined shadows like on the Moon */}
      <directionalLight
        castShadow={true}
        intensity={3} // Extreme sun intensity for maximum contrast
        ref={light}
        shadow-bias={0} // Ultra high resolution for razor-sharp shadows
        shadow-camera-bottom={-1.5}
        shadow-camera-far={200}
        shadow-camera-left={-1.5}
        shadow-camera-near={0.01}
        shadow-camera-right={1.5}
        shadow-camera-top={1.5}
        shadow-mapSize-height={8192}
        shadow-mapSize-width={8192} // No shadow softening - harsh edges
        shadow-normalBias={0} // No bias - raw, unfiltered shadows
        shadow-radius={0}
      />
    </group>
  );
}

export const MoonScene = (props: Props) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.0], fov: 35, zoom: 0.5 }}
      gl={{
        antialias: true,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = BasicShadowMap; // Raw pixelated shadows - zero filtering
        gl.shadowMap.autoUpdate = true;
        // Disable any WebGL shadow filtering
        gl.shadowMap.needsUpdate = true;
      }} // Enable shadow rendering
      shadows
      // dvh, not vh: on mobile the browser chrome makes 100vh taller than what
      // you can see, which pushes the moon below the centre of the visible area.
      style={{ width: "100%", height: "100dvh" }}
    >
      <color args={["#05060a"]} attach="background" />
      <Suspense fallback={null}>
        <MoonMesh {...props} />
      </Suspense>
      <OrbitControls enablePan={false} enableRotate={true} enableZoom={true} />
    </Canvas>
  );
};
