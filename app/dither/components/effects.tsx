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
