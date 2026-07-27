import { memo } from "react";

import type { Asteroid as AsteroidType } from "../game";
import { AsteroidMaterial } from "./asteroid-material";
import { AsteroidGeometry } from "./asteroid-mesh";

interface AsteroidProps {
  asteroid: AsteroidType;
}

// Memoized asteroid component - only re-renders when asteroid reference changes
// This prevents all asteroids from re-rendering when one is destroyed
const AsteroidComponent = ({ asteroid }: AsteroidProps) => {
  return (
    <mesh
      castShadow
      position={asteroid.position}
      rotation={asteroid.rotation}
      userData={{ asteroidId: asteroid.id }}
    >
      <AsteroidGeometry
        radius={asteroid.radius}
        shapeSeed={asteroid.shapeSeed}
      />
      <AsteroidMaterial
        color={asteroid.color}
        roughness={asteroid.roughness}
        shapeSeed={asteroid.shapeSeed}
      />
    </mesh>
  );
};

// Memo comparison: only re-render if asteroid object reference changes
export const Asteroid = memo(AsteroidComponent, (prev, next) => {
  // Return true if props are equal (skip re-render)
  // Return false if props are different (do re-render)
  return prev.asteroid === next.asteroid;
});
