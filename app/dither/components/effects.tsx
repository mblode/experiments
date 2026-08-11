import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";

import DitherEffect from "./dither-effect";

interface EffectsProps {
  patternScale: number;
  threshold: number;
  pixelSize?: number;
}

export default function Effects({
  patternScale,
  threshold,
  pixelSize = 1.0,
}: EffectsProps) {
  const gl = useThree((state) => state.gl);
  // postprocessing EffectComposer.setRenderer reads
  // renderer.getContext().getContextAttributes().alpha — null attrs crash.
  const attributes = gl.getContext()?.getContextAttributes() ?? null;
  if (!attributes) {
    return null;
  }

  return (
    <EffectComposer>
      <DitherEffect
        patternScale={patternScale}
        pixelSize={pixelSize}
        threshold={threshold}
      />
    </EffectComposer>
  );
}
