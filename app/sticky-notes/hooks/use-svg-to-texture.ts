"use client";

import { useCallback, useRef } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

interface UseSvgToTextureOptions {
  width: number;
  height: number;
  backgroundColor: string;
}

export function useSvgToTexture(options: UseSvgToTextureOptions) {
  const { width, height, backgroundColor } = options;
  const textureRef = useRef<CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const captureToTexture = useCallback(
    async (svgElement: SVGSVGElement): Promise<CanvasTexture | null> => {
      try {
        // Create or reuse canvas
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;

        // Set canvas size with device pixel ratio for sharpness
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return null;
        }

        // Scale context for device pixel ratio
        ctx.scale(dpr, dpr);

        // Draw background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Clone and serialize SVG
        const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
        svgClone.setAttribute("width", String(width));
        svgClone.setAttribute("height", String(height));

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgClone);

        // Create blob and load as image
        const blob = new Blob([svgString], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });

        // Draw SVG content on top of background
        ctx.drawImage(img, 0, 0, width, height);

        // Clean up blob URL
        URL.revokeObjectURL(url);

        // Dispose old texture if exists
        if (textureRef.current) {
          textureRef.current.dispose();
        }

        // Create Three.js texture
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.flipY = false; // Shader handles Y inversion via 1 - clickPos.y
        texture.colorSpace = SRGBColorSpace;

        textureRef.current = texture;
        return texture;
      } catch {
        return null;
      }
    },
    [width, height, backgroundColor]
  );

  const disposeTexture = useCallback(() => {
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }
  }, []);

  return { captureToTexture, disposeTexture };
}
