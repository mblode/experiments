"use client";

import { observer } from "mobx-react-lite";
import { useLayoutEffect, useRef } from "react";

import type { BlockData } from "./block";
import { CardInner } from "./card-inner";
import { useStore } from "./stores/store";

interface SettlingOverlayProps {
  block: BlockData;
  onAnimationComplete: () => void;
}

export const SettlingOverlay = observer(
  ({ block, onAnimationComplete }: SettlingOverlayProps) => {
    const store = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const rect = store.dropAnimationRect;
    const rotation = store.dropAnimationRotation;

    useLayoutEffect(() => {
      if (
        !(rect && containerRef.current && wrapperRef.current && cardRef.current)
      ) {
        return;
      }

      // Find the target content-card position
      const targetElement = document.querySelector(
        `[data-settling-target="${block.id}"]`
      ) as HTMLElement | null;

      if (!targetElement) {
        // No target found, just complete immediately
        onAnimationComplete();
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();

      // Spring physics parameters (similar to framer motion defaults)
      const stiffness = 250;
      const damping = 25;
      const mass = 1;

      // Generate spring keyframes
      const generateSpringKeyframes = (
        from: number,
        to: number,
        steps: number
      ): number[] => {
        const keyframes: number[] = [];
        const w0 = Math.sqrt(stiffness / mass);
        const zeta = damping / (2 * Math.sqrt(stiffness * mass));
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        const duration = 0.6; // seconds

        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * duration;
          const envelope = Math.exp(-zeta * w0 * t);
          const oscillation =
            envelope * (Math.cos(wd * t) + (zeta * w0 * Math.sin(wd * t)) / wd);
          const value = to - (to - from) * oscillation;
          keyframes.push(value);
        }
        return keyframes;
      };

      const steps = 60;
      const duration = 600;

      // Position spring keyframes
      const xKeyframes = generateSpringKeyframes(
        rect.left,
        targetRect.left,
        steps
      );
      const yKeyframes = generateSpringKeyframes(
        rect.top,
        targetRect.top,
        steps
      );
      const positionFrames = xKeyframes.map((x, i) => ({
        transform: `translate(${x}px, ${yKeyframes[i]}px)`,
      }));

      const positionAnimation = containerRef.current.animate(positionFrames, {
        duration,
        easing: "linear",
        fill: "forwards",
      });

      // Scale and rotation spring keyframes
      const scaleKeyframes = generateSpringKeyframes(1.04, 1, steps);
      const rotationKeyframes = generateSpringKeyframes(rotation, 0, steps);
      const transformFrames = scaleKeyframes.map((scale, i) => ({
        transform: `rotate(${rotationKeyframes[i]}deg) scale(${scale})`,
      }));

      const transformAnimation = wrapperRef.current.animate(transformFrames, {
        duration,
        easing: "linear",
        fill: "forwards",
      });

      // Shadow fade (linear, no spring needed)
      const currentShadow =
        "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(0, 0, 0, 0.1)";
      const noShadow =
        "0 25px 50px -12px rgba(0, 0, 0, 0), 0 12px 24px -8px rgba(0, 0, 0, 0)";

      const shadowAnimation = cardRef.current.animate(
        [{ boxShadow: currentShadow }, { boxShadow: noShadow }],
        {
          duration: 300,
          easing: "ease-out",
          fill: "forwards",
        }
      );

      positionAnimation.onfinish = () => {
        onAnimationComplete();
      };

      // Cleanup: cancel animations on unmount to prevent iOS Safari memory leaks
      return () => {
        positionAnimation.cancel();
        transformAnimation.cancel();
        shadowAnimation.cancel();
      };
    }, [rect, rotation, block.id, onAnimationComplete]);

    if (!rect) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: rect.width,
          height: rect.height,
          transform: `translate(${rect.left}px, ${rect.top}px)`,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <div
          ref={wrapperRef}
          style={{
            width: "100%",
            height: "100%",
            transform: `rotate(${rotation}deg) scale(1.04)`,
            transformOrigin: "center center",
          }}
        >
          <div
            className="rounded-xl border border-border bg-white p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),0_12px_24px_-8px_rgba(0,0,0,0.1)]"
            ref={cardRef}
          >
            <CardInner block={block} />
          </div>
        </div>
      </div>
    );
  }
);

SettlingOverlay.displayName = "SettlingOverlay";
