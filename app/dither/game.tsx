import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

// Game configuration constants
export const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 0, 10];
export const POINTS_PER_KILL = 100;

const BASE_SPEED = 30; // Starting forward speed (units per second)
const SPEED_SCALE_POINTS = 500; // Points needed for each speed tier
const SPEED_SCALE_MULTIPLIER = 1.2; // Speed multiplier per tier (20% increase)
const MAX_SPEED = 150; // Maximum speed cap (units per second)

/**
 * Forward speed at a given score. The mover, the kill multiplier and the HUD
 * readout each used to carry their own copy of this formula, so a change to
 * the curve had to be made in three places to stay honest.
 */
export const speedAtScore = (score: number) =>
  Math.min(
    MAX_SPEED,
    BASE_SPEED *
      SPEED_SCALE_MULTIPLIER ** (Math.max(0, score) / SPEED_SCALE_POINTS)
  );

/** The same curve expressed against the starting speed, which is what scoring
 *  multiplies by and what the HUD shows. */
export const speedMultiplierAtScore = (score: number) =>
  speedAtScore(score) / BASE_SPEED;

const INITIAL_GAME_STATE = {
  isPlaying: true,
  isGameOver: false,
  score: 0,
  distance: 0,
  kills: 0,
  asteroids: [],
  explosions: [],
  cameraPosition: INITIAL_CAMERA_POSITION,
  cameraVelocity: [0, 0, 0] as [number, number, number],
  speed: 8,
  lastShotTime: 0,
  lastHitTime: 0,
};

export interface Asteroid {
  id: number;
  position: [number, number, number];
  radius: number;
  color: string;
  roughness: number;
  velocity: [number, number, number];
  rotation: [number, number, number];
  rotationSpeed: [number, number, number];
  shapeSeed: number; // Random seed for generating unique organic shapes
}

export interface Explosion {
  id: number;
  position: [number, number, number];
  startTime: number;
}

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  distance: number;
  kills: number;
  asteroids: Asteroid[];
  explosions: Explosion[];
  cameraPosition: [number, number, number];
  cameraVelocity: [number, number, number];
  speed: number;
  lastShotTime: number;
  lastHitTime: number;
}

interface GameContextType extends GameState {
  startGame: () => void;
  endGame: () => void;
  updateScore: (points: number) => void;
  updateDistance: (dist: number) => void;
  incrementKills: (speedMultiplier?: number) => void;
  removeAsteroid: (id: number) => void;
  addExplosion: (position: [number, number, number]) => void;
  handleAsteroidDestroyed: (
    asteroidId: number,
    explosionPos: [number, number, number],
    hitTime: number,
    speedMultiplier: number
  ) => void;
  setAsteroids: (asteroids: Asteroid[]) => void;
  setExplosions: (explosions: Explosion[]) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  setCameraVelocity: (vel: [number, number, number]) => void;
  setLastShotTime: (time: number) => void;
  setLastHitTime: (time: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  const startGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
  }, []);

  const endGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isGameOver: true,
    }));
  }, []);

  const updateScore = useCallback((points: number) => {
    setGameState((prev) => ({
      ...prev,
      score: Math.max(0, prev.score + points), // Prevent score from going below 0
    }));
  }, []);

  const updateDistance = useCallback((dist: number) => {
    setGameState((prev) => ({
      ...prev,
      distance: dist,
    }));
  }, []);

  const setAsteroids = useCallback((asteroids: Asteroid[]) => {
    setGameState((prev) => ({
      ...prev,
      asteroids,
    }));
  }, []);

  const setCameraPosition = useCallback((pos: [number, number, number]) => {
    setGameState((prev) => ({
      ...prev,
      cameraPosition: pos,
    }));
  }, []);

  const setCameraVelocity = useCallback((vel: [number, number, number]) => {
    setGameState((prev) => ({
      ...prev,
      cameraVelocity: vel,
    }));
  }, []);

  const incrementKills = useCallback((speedMultiplier = 1) => {
    const points = Math.floor(POINTS_PER_KILL * speedMultiplier);
    setGameState((prev) => ({
      ...prev,
      kills: prev.kills + 1,
      score: prev.score + points,
    }));
  }, []);

  const removeAsteroid = useCallback((id: number) => {
    setGameState((prev) => ({
      ...prev,
      asteroids: prev.asteroids.filter((asteroid) => asteroid.id !== id),
    }));
  }, []);

  const addExplosion = useCallback((position: [number, number, number]) => {
    const explosion: Explosion = {
      id: Date.now() + Math.random(),
      position,
      startTime: Date.now(),
    };
    setGameState((prev) => ({
      ...prev,
      explosions: [...prev.explosions, explosion],
    }));
  }, []);

  const setExplosions = useCallback((explosions: Explosion[]) => {
    setGameState((prev) => ({
      ...prev,
      explosions,
    }));
  }, []);

  const setLastShotTime = useCallback((time: number) => {
    setGameState((prev) => ({
      ...prev,
      lastShotTime: time,
    }));
  }, []);

  const setLastHitTime = useCallback((time: number) => {
    setGameState((prev) => ({
      ...prev,
      lastHitTime: time,
    }));
  }, []);

  // Batched update for asteroid destruction - combines multiple state updates into one
  const handleAsteroidDestroyed = useCallback(
    (
      asteroidId: number,
      explosionPos: [number, number, number],
      hitTime: number,
      speedMultiplier: number
    ) => {
      const points = Math.floor(POINTS_PER_KILL * speedMultiplier);
      const explosion: Explosion = {
        id: Date.now() + Math.random(),
        position: explosionPos,
        startTime: hitTime,
      };

      setGameState((prev) => ({
        ...prev,
        asteroids: prev.asteroids.filter(
          (asteroid) => asteroid.id !== asteroidId
        ),
        explosions: [...prev.explosions, explosion],
        lastHitTime: hitTime,
        kills: prev.kills + 1,
        score: prev.score + points,
      }));
    },
    []
  );

  return (
    <GameContext.Provider
      value={{
        ...gameState,
        startGame,
        endGame,
        updateScore,
        updateDistance,
        incrementKills,
        removeAsteroid,
        addExplosion,
        handleAsteroidDestroyed,
        setAsteroids,
        setExplosions,
        setCameraPosition,
        setCameraVelocity,
        setLastShotTime,
        setLastHitTime,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
