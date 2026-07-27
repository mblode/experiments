import { useThree } from "@react-three/fiber";
import { Effect } from "postprocessing";
import { forwardRef, useMemo } from "react";
import {
  type Camera,
  type Matrix4,
  RepeatWrapping,
  type Texture,
  TextureLoader,
  Uniform,
  Vector2,
  Vector3,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";

import { fragmentShader } from "../shaders/dither.frag";

// Custom Dither Effect class
class DitherEffectImpl extends Effect {
  constructor(
    blueNoiseTexture: Texture,
    camera: Camera,
    patternScale: number,
    threshold: number,
    pixelSize: number,
    resolution: Vector2
  ) {
    // Set up texture wrapping for tiling
    blueNoiseTexture.wrapS = RepeatWrapping;
    blueNoiseTexture.wrapT = RepeatWrapping;

    super("DitherEffect", fragmentShader, {
      uniforms: new Map<
        string,
        Uniform<number | Texture | Vector2 | Vector3 | Matrix4>
      >([
        ["tBlueNoise", new Uniform(blueNoiseTexture)],
        ["patternScale", new Uniform(patternScale)],
        ["threshold", new Uniform(threshold)],
        ["pixelSize", new Uniform(pixelSize)],
        ["resolution", new Uniform(resolution)],
        ["cameraPosition", new Uniform(new Vector3())],
        ["cameraWorldMatrix", new Uniform(camera.matrixWorld)],
        [
          "cameraProjectionMatrixInverse",
          new Uniform(camera.projectionMatrixInverse),
        ],
      ]),
    });

    this.cameraRef = camera;
  }

  private readonly cameraRef: Camera;

  update(
    _renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
    _deltaTime: number
  ) {
    // Update camera uniforms each frame
    if (this.cameraRef) {
      this.uniforms.get("cameraPosition")?.value.copy(this.cameraRef.position);
      const cameraWorldMatrix = this.uniforms.get("cameraWorldMatrix");
      if (cameraWorldMatrix) {
        cameraWorldMatrix.value = this.cameraRef.matrixWorld;
      }
      const projectionMatrixInverse = this.uniforms.get(
        "cameraProjectionMatrixInverse"
      );
      if (projectionMatrixInverse) {
        projectionMatrixInverse.value = this.cameraRef.projectionMatrixInverse;
      }
    }

    // Update resolution uniform
    const width = inputBuffer.width;
    const height = inputBuffer.height;
    this.uniforms.get("resolution")?.value.set(width, height);
  }
}

// Props interface
interface DitherEffectProps {
  patternScale?: number;
  threshold?: number;
  pixelSize?: number;
}

// React component wrapper
const DitherEffect = forwardRef<typeof DitherEffectImpl, DitherEffectProps>(
  ({ patternScale = 20.0, threshold = 0.5, pixelSize = 1.0 }, ref) => {
    const { camera, size } = useThree();

    // Load blue noise texture
    const blueNoiseTexture = useMemo(() => {
      const loader = new TextureLoader();
      return loader.load("/experiments/blue-noise.png");
    }, []);

    // Create effect instance with camera
    const effect = useMemo(() => {
      const resolution = new Vector2(size.width, size.height);
      return new DitherEffectImpl(
        blueNoiseTexture,
        camera,
        patternScale,
        threshold,
        pixelSize,
        resolution
      );
    }, [blueNoiseTexture, camera, patternScale, threshold, pixelSize, size]);

    // Update uniform values when props change
    useMemo(() => {
      if (effect) {
        const patternScaleUniform = effect.uniforms.get("patternScale");
        if (patternScaleUniform) {
          patternScaleUniform.value = patternScale;
        }
        const thresholdUniform = effect.uniforms.get("threshold");
        if (thresholdUniform) {
          thresholdUniform.value = threshold;
        }
        const pixelSizeUniform = effect.uniforms.get("pixelSize");
        if (pixelSizeUniform) {
          pixelSizeUniform.value = pixelSize;
        }
      }
    }, [effect, patternScale, threshold, pixelSize]);

    return <primitive dispose={null} object={effect} ref={ref} />;
  }
);

DitherEffect.displayName = "DitherEffect";

export default DitherEffect;
