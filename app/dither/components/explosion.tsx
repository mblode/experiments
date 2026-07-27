import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";

import type { Explosion as ExplosionType } from "../game";
import { useGame } from "../game";

// Explosion constants
const EXPLOSION_DURATION_MS = 600; // Milliseconds before explosion fragments are removed
const FRAGMENT_COUNT = 12; // Number of debris fragments per explosion
const FRAGMENT_SPEED_MIN = 5; // Minimum fragment velocity
const FRAGMENT_SPEED_MAX = 13; // Maximum fragment velocity (min + range)
const FRAGMENT_SCALE_MIN = 0.2; // Minimum fragment size
const FRAGMENT_SCALE_MAX = 0.5; // Maximum fragment size
const FRAGMENT_VELOCITY_DECAY = 0.95; // Per-frame velocity multiplier (slowdown)

interface Fragment {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  rotationSpeed: [number, number, number];
  scale: number;
}

export const Explosions = () => {
  const { explosions, setExplosions } = useGame();

  // Update explosions and remove old ones
  useFrame(() => {
    const now = Date.now();
    const filtered = explosions.filter((explosion) => {
      const age = now - explosion.startTime;
      return age < EXPLOSION_DURATION_MS;
    });

    if (filtered.length !== explosions.length) {
      setExplosions(filtered);
    }
  });

  return (
    <>
      {explosions.map((explosion) => (
        <ExplosionEffect explosion={explosion} key={explosion.id} />
      ))}
    </>
  );
};

interface ExplosionEffectProps {
  explosion: ExplosionType;
}

const ExplosionEffect = ({ explosion }: ExplosionEffectProps) => {
  // Generate fragments for this explosion
  const fragments = useMemo(() => {
    const frags: Fragment[] = [];

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      // Distribute fragments in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed =
        FRAGMENT_SPEED_MIN +
        Math.random() * (FRAGMENT_SPEED_MAX - FRAGMENT_SPEED_MIN);

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      frags.push({
        id: `${explosion.id}-${i}`,
        position: [...explosion.position] as [number, number, number],
        velocity: [vx, vy, vz],
        rotation: [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ],
        rotationSpeed: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ],
        scale:
          FRAGMENT_SCALE_MIN +
          Math.random() * (FRAGMENT_SCALE_MAX - FRAGMENT_SCALE_MIN),
      });
    }

    return frags;
  }, [explosion]);

  // Update fragment positions
  useFrame((_, delta) => {
    for (const frag of fragments) {
      frag.position[0] += frag.velocity[0] * delta;
      frag.position[1] += frag.velocity[1] * delta;
      frag.position[2] += frag.velocity[2] * delta;

      frag.rotation[0] += frag.rotationSpeed[0] * delta;
      frag.rotation[1] += frag.rotationSpeed[1] * delta;
      frag.rotation[2] += frag.rotationSpeed[2] * delta;

      // Slow down fragments
      frag.velocity[0] *= FRAGMENT_VELOCITY_DECAY;
      frag.velocity[1] *= FRAGMENT_VELOCITY_DECAY;
      frag.velocity[2] *= FRAGMENT_VELOCITY_DECAY;
    }
  });

  // Calculate opacity based on age
  const now = Date.now();
  const age = now - explosion.startTime;
  const opacity = Math.max(0, 1 - age / EXPLOSION_DURATION_MS);

  return (
    <>
      {fragments.map((frag) => (
        <mesh
          key={frag.id}
          position={frag.position}
          rotation={frag.rotation}
          scale={frag.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.2}
            opacity={opacity}
            roughness={0.5}
            transparent
          />
        </mesh>
      ))}
    </>
  );
};
