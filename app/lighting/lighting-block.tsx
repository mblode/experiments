"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";

import "./styles.css";

export const LightingBlock = () => {
  // Refs for dynamic CSS property updates
  const lightingContainerRef = useRef<HTMLDivElement>(null);
  const touchContainerRef = useRef<HTMLDivElement>(null);
  const bumpContainerRef = useRef<HTMLDivElement>(null);
  const windowFrameRef = useRef<HTMLDivElement>(null);
  const windowFrameHighlightRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLVideoElement>(null);
  const skyRef = useRef<HTMLVideoElement>(null);

  // Viewport size lives in a ref, not state: only the pointer handler reads it,
  // so putting it in state would re-render the scene on every resize frame and
  // tear the listener down and back up with it.
  const dimensionsRef = useRef<[number, number]>([0, 0]);

  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", {
    initializeWithValue: false,
  });

  // First effect: Setup resize listener and bump animation
  useEffect(() => {
    // Initialize and track window dimensions
    const handleResize = () => {
      dimensionsRef.current = [window.innerWidth, window.innerHeight];
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    if (reduced) {
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    // Perlin noise function using multi-octave sine waves
    const perlinNoise = (x: number) => {
      const t = Date.now();
      const timeOffset = -(130 * t * 0.01);

      // Sum multiple sine waves with different frequencies for organic movement
      let noise = Math.sin(+x);
      noise += 4.5 * Math.sin(2.1 * x + timeOffset);
      noise += 4 * Math.sin(1.72 * x + 1.121 * timeOffset);
      noise += 5 * Math.sin(2.221 * x + 0.437 * timeOffset);
      noise += 2.5 * Math.sin(3.1122 * x + 4.269 * timeOffset);
      noise *= 0.06;

      return noise;
    };

    // Generate bump offset using Perlin noise
    const generateBumpOffset = () => {
      let offset = 0;
      let amplitude = 16;
      let frequency = 1;

      // Single octave is sufficient for smooth movement
      for (let i = 0; i < 1; i++) {
        offset += amplitude * perlinNoise(frequency * Date.now());
        frequency *= 2;
        amplitude *= 0.5;
      }

      return offset;
    };

    // Update bump animation every 800ms
    const bumpInterval = setInterval(() => {
      if (bumpContainerRef.current) {
        const offsetY = generateBumpOffset();
        const offsetX = offsetY * 0.25; // X moves at 25% of Y for natural motion
        bumpContainerRef.current.style.setProperty(
          "--bump-offset-y",
          `${offsetY}px`
        );
        bumpContainerRef.current.style.setProperty(
          "--bump-offset-x",
          `${offsetX}px`
        );
      }
    }, 800);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(bumpInterval);
    };
  }, [reduced]);

  // Second effect: the scene follows the pointer. No easing on the properties
  // written here — the perspective and shadow track the cursor directly.
  useEffect(() => {
    // pointermove rather than mousemove, so a pen or a finger moves the light
    // too instead of leaving the scene parked.
    const handlePointerMove = (e: PointerEvent) => {
      if (
        !(
          lightingContainerRef.current &&
          touchContainerRef.current &&
          windowFrameRef.current &&
          windowFrameHighlightRef.current
        )
      ) {
        return;
      }

      const [width, height] = dimensionsRef.current;
      if (width === 0 || height === 0) {
        return;
      }

      // Normalize mouse position to 0-1 range
      const mouseX = e.clientX / width;
      const mouseY = e.clientY / height;

      // Update perspective (750px ± 50px based on X position)
      const perspective = 750 + (mouseX - 0.5) * 100;
      lightingContainerRef.current.style.setProperty(
        "--perspective",
        `${perspective}px`
      );

      // Update parallax translation (inverse of mouse position)
      touchContainerRef.current.style.setProperty(
        "--translate-x",
        `${-1 * mouseX}px`
      );
      touchContainerRef.current.style.setProperty(
        "--translate-y",
        `${-1 * mouseY}px`
      );

      // Update shadow effects based on mouse position
      const shadowOffset = 15 * mouseX + 30;
      const shadowStrength = 45 * mouseY;

      windowFrameRef.current.style.setProperty(
        "--shadow-offset",
        `${shadowOffset}px`
      );
      windowFrameRef.current.style.setProperty(
        "--shadow-strength",
        `${shadowStrength}px`
      );

      // Update highlight shadow (50% of main shadow)
      windowFrameHighlightRef.current.style.setProperty(
        "--shadow-strength",
        `${shadowStrength * 0.5}px`
      );
    };

    document.addEventListener("pointermove", handlePointerMove);

    // Cleanup
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  // Looping video is motion nobody asked for. The paused first frame still
  // reads as sky through the window.
  useEffect(() => {
    if (!reduced) {
      return;
    }
    cloudsRef.current?.pause();
    skyRef.current?.pause();
  }, [reduced]);

  return (
    // The whole scene is decoration: what it is and how it works is in the
    // prose above it, so there is nothing here for a screen reader to walk.
    <div aria-hidden="true">
      <div className="lighting-container" ref={lightingContainerRef}>
        <div className="transformContainer">
          <div className="bumpContainer" ref={bumpContainerRef}>
            <div className="touchContainer" ref={touchContainerRef}>
              <div className="sideBar" />
              <div className="sideBarHighlight" />
              <div className="topBar" />
              <div className="ceiling" />
              <div className="windowFrame" ref={windowFrameRef}>
                <div className="contents">
                  <div
                    className="windowFrameInnerHighlight"
                    ref={windowFrameHighlightRef}
                  />
                  <div className="windowFrameInner" />
                  <div className="windowInset" />
                  <div className="windowFrameOuter" />
                  <div className="windowFrameLedge" />
                  <div className="blackBorder" />
                  <div className="windowScene">
                    <div className="contents">
                      <video
                        autoPlay
                        className="clouds"
                        loop
                        muted
                        playsInline
                        ref={cloudsRef}
                        src="/experiments/videos/clouds.mp4"
                      />
                      <video
                        autoPlay
                        className="video"
                        loop
                        muted
                        playsInline
                        ref={skyRef}
                        src="/experiments/videos/window.mp4"
                      />
                      <div className="verticalBeams" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative" style={{ pointerEvents: "none" }}>
        <div className="grain" />
        <div className="light" />
        <div className="circularLight" />
        <div className="artifactTop" />
        <div className="circularLightArtifact" />
        <div className="tinyCircularLight" />
        <div className="yummyColorGrading" />
        <div className="warmth" />
        <div className="whiteOverlay" />
      </div>
    </div>
  );
};
