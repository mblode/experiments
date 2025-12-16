"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface GridItem {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  icon: string;
}

const items: GridItem[] = [
  {
    id: 1,
    title: "Design Systems",
    subtitle: "Components & Tokens",
    gradient: "from-violet-500 to-purple-600",
    icon: "◆",
  },
  {
    id: 2,
    title: "Motion Design",
    subtitle: "Animation & Interaction",
    gradient: "from-cyan-500 to-blue-600",
    icon: "◐",
  },
  {
    id: 3,
    title: "3D Graphics",
    subtitle: "WebGL & Three.js",
    gradient: "from-orange-500 to-red-600",
    icon: "◈",
  },
  {
    id: 4,
    title: "Typography",
    subtitle: "Font & Layout",
    gradient: "from-emerald-500 to-teal-600",
    icon: "◇",
  },
  {
    id: 5,
    title: "Color Theory",
    subtitle: "Palettes & Harmony",
    gradient: "from-pink-500 to-rose-600",
    icon: "●",
  },
  {
    id: 6,
    title: "Micro-interactions",
    subtitle: "Details & Polish",
    gradient: "from-amber-500 to-yellow-600",
    icon: "◎",
  },
];

interface MagneticCardProps {
  item: GridItem;
  mouseX: number;
  mouseY: number;
  containerRect: DOMRect | null;
}

function MagneticCard({
  item,
  mouseX,
  mouseY,
  containerRect,
}: MagneticCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth animation
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  // Spring configurations for natural feel
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const springScale = useSpring(scale, { stiffness: 300, damping: 25 });

  // Glow effect based on proximity
  const glowOpacity = useMotionValue(0);
  const springGlow = useSpring(glowOpacity, { stiffness: 100, damping: 20 });

  // Calculate magnetic effect
  useEffect(() => {
    if (!cardRef.current || !containerRect) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Card center relative to viewport
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    // Distance from mouse to card center
    const deltaX = mouseX - cardCenterX;
    const deltaY = mouseY - cardCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Magnetic effect radius
    const maxDistance = 300;
    const effectStrength = Math.max(0, 1 - distance / maxDistance);

    // Pull toward cursor (inverted for magnetic attraction)
    const pullStrength = 25;
    const pullX = deltaX * effectStrength * 0.15;
    const pullY = deltaY * effectStrength * 0.15;

    // 3D rotation based on mouse position relative to card
    const rotateStrength = 15;
    const rotX = -(deltaY / rect.height) * rotateStrength * effectStrength;
    const rotY = (deltaX / rect.width) * rotateStrength * effectStrength;

    // Scale up when close
    const scaleValue = 1 + effectStrength * 0.08;

    // Update motion values
    x.set(pullX);
    y.set(pullY);
    rotateX.set(rotX);
    rotateY.set(rotY);
    scale.set(scaleValue);
    glowOpacity.set(effectStrength * 0.8);
  }, [mouseX, mouseY, containerRect, x, y, rotateX, rotateY, scale, glowOpacity]);

  // Transform for shadow based on position
  const shadowX = useTransform(springX, (val) => val * 0.5);
  const shadowY = useTransform(springY, (val) => val * 0.5 + 10);

  return (
    <motion.div
      ref={cardRef}
      className="relative aspect-[4/3] cursor-pointer"
      style={{
        x: springX,
        y: springY,
        rotateX: springRotateX,
        rotateY: springRotateY,
        scale: springScale,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-4 rounded-3xl bg-gradient-to-br ${item.gradient} blur-2xl`}
        style={{ opacity: springGlow }}
      />

      {/* Dynamic shadow */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-black/20 blur-xl"
        style={{
          x: shadowX,
          y: shadowY,
          scale: 0.95,
        }}
      />

      {/* Card */}
      <motion.div
        className={`relative h-full w-full rounded-2xl bg-gradient-to-br ${item.gradient} p-6 overflow-hidden`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
          style={{
            opacity: useTransform(springScale, [1, 1.08], [0.3, 0.6]),
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between text-white">
          <span className="text-4xl opacity-80">{item.icon}</span>
          <div>
            <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-white/70">{item.subtitle}</p>
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
      </motion.div>
    </motion.div>
  );
}

export function MagneticGridBlock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Track mouse position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Update container rect on resize
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  // Add/remove mouse listener
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className="relative py-8"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Ambient background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        animate={{
          background: isHovering
            ? `radial-gradient(600px circle at ${mousePos.x - (containerRect?.left || 0)}px ${mousePos.y - (containerRect?.top || 0)}px, rgba(139, 92, 246, 0.08), transparent 60%)`
            : "transparent",
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MagneticCard
            key={item.id}
            item={item}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            containerRect={containerRect}
          />
        ))}
      </div>

      {/* Instruction hint */}
      <motion.p
        className="mt-8 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Move your cursor over the cards to see the magnetic effect
      </motion.p>
    </div>
  );
}
