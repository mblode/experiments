"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Header } from "@/components/ui/header";
import { ShootingStars } from "@/components/ui/shooting-stars";

export const SkyBlock = () => {
  const { scrollYProgress } = useScroll();

  // Transform scroll progress to gradient values for background
  const bgGradient = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [
      "linear-gradient(rgb(0, 144, 245), rgb(230, 214, 221), rgb(234, 176, 69))",
      "linear-gradient(rgb(30, 84, 200), rgb(91, 143, 230), rgb(189, 216, 254))",
      "linear-gradient(rgb(46, 70, 112), rgb(205, 177, 175), rgb(204, 126, 101))",
      "linear-gradient(rgb(6, 22, 31), rgb(0, 73, 104), rgb(75, 148, 161))",
    ]
  );

  // Transform scroll progress for cloud gradients
  const cloudsGradient = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [
      "linear-gradient(rgb(205, 206, 208), rgb(255, 231, 230))",
      "linear-gradient(rgb(255, 255, 255), rgb(248, 248, 255))",
      "linear-gradient(rgb(254, 130, 143), rgb(230, 150, 130))",
      "linear-gradient(rgb(33, 62, 80), rgb(49, 84, 106))",
    ]
  );

  // Stars animations
  const starsOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0, 0, 0.933_345, 1]
  );
  const starsY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [-50, -36.0824, -13.9901, -4.087_33]
  );

  return (
    <>
      <div className="relative z-10 bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Header className="mb-0!" id="sky" />
          <a
            className="link"
            href="https://matthewblode.com"
            rel="noreferrer"
            target="_blank"
          >
            See a realworld example
          </a>
        </div>
      </div>

      <div className="relative z-10 bg-noise">
        <section className="relative flex min-h-[100lvh] items-center justify-center">
          <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
            <p className="text-6xl md:text-8xl">Sunrise</p>
          </div>
        </section>

        <section className="relative flex min-h-[100lvh] items-center justify-center">
          <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
            <p className="text-6xl md:text-8xl">Day</p>
          </div>
        </section>

        <section className="relative flex min-h-[100lvh] items-center justify-center">
          <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
            <p className="text-6xl md:text-8xl">Sunset</p>
          </div>
        </section>

        <section className="relative flex min-h-[100lvh] items-center justify-center">
          <div className="mx-auto flex max-w-[900px] flex-col items-center justify-center text-center">
            <p className="text-6xl md:text-8xl">Night</p>
          </div>
        </section>
      </div>

      {/* Fixed Background Gradient - Only for Footer */}
      <motion.div
        className="fixed inset-0 z-0"
        id="home-footer-bg-gradient"
        style={{ background: bgGradient }}
      />

      <footer className="fixed inset-0" id="contact">
        {/* Shooting Stars */}
        <ShootingStars />

        {/* Cloud Mask Layer */}
        <motion.div
          className="absolute inset-0"
          id="home-footer-clouds-gradient"
          style={{
            mask: 'url("/footer-clouds.png") center/cover no-repeat',
            WebkitMask: 'url("/footer-clouds.png") center/cover no-repeat',
            background: cloudsGradient,
          }}
        />
        {/* Stars Layer */}
        <motion.div
          className="absolute inset-0 -bottom-120 bg-repeat"
          id="home-footer-stars"
          style={{
            backgroundImage: 'url("/footer-stars.png")',
            opacity: starsOpacity,
            y: starsY,
          }}
        />
      </footer>
    </>
  );
};
