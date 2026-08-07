"use client";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface RabbitCardProps {
  id: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// ease-out-quart. Height, type, margins and radius all ride this one curve so
// they arrive together; a card whose height and type land at different moments
// reads as two animations.
const smoothEasing: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

const COLLAPSED_IMAGE = 86;
const EXPANDED_IMAGE = 280;

// Percent, not px, and that is load-bearing. On a node with a `layout` prop Motion
// rewrites a px radius into a percentage of the box it projected, then hands the px
// value back when the layout spring settles. That correction assumes the box is only
// being scaled by a transform; this one resizes for real and on a slower curve, so
// the percentage drifts off the true radius and the corner snaps ~50px at the end,
// after the size has already stopped moving. Percentages pass through untouched.
const radiusPercent = (radius: number, size: number) =>
  `${(radius / size) * 100}%`;

const Card = ({ id, isExpanded, onToggle }: RabbitCardProps) => {
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : 0.42;
  const layoutTransition = reduced ? { duration: 0 } : springConfig;
  const sizeTransition = { duration, ease: smoothEasing };

  return (
    <motion.li
      className="w-full"
      initial={false}
      layout="position"
      transition={layoutTransition}
    >
      <motion.button
        animate={{ height: isExpanded ? 400 : 120 }}
        aria-expanded={isExpanded}
        className={cn(
          "relative flex w-full cursor-pointer overflow-hidden border border-border text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          isExpanded ? "bg-card" : "bg-muted hover:bg-muted-foreground/10"
        )}
        initial={false}
        onClick={onToggle}
        style={{
          borderRadius: 16,
          transformOrigin: "center top",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
        transition={{
          height: sizeTransition,
          scale: { duration: reduced ? 0 : 0.15, ease: smoothEasing },
        }}
        type="button"
        whileHover={reduced || isExpanded ? undefined : { scale: 1.02 }}
        whileTap={reduced ? undefined : { scale: 0.98 }}
      >
        {/* Content wrapper. The order swap below is instant; Motion's layout
            animation interpolates the positions that fall out of it. */}
        <motion.span
          className="flex h-full w-full p-4"
          initial={false}
          layout="position"
          style={{
            flexDirection: isExpanded ? "column" : "row",
            justifyContent: isExpanded ? "center" : "flex-start",
            alignItems: "center",
          }}
          transition={layoutTransition}
        >
          {/* Image */}
          <motion.span
            animate={{
              width: isExpanded ? EXPANDED_IMAGE : COLLAPSED_IMAGE,
              height: isExpanded ? EXPANDED_IMAGE : COLLAPSED_IMAGE,
              borderRadius: isExpanded
                ? radiusPercent(24, EXPANDED_IMAGE)
                : radiusPercent(12, COLLAPSED_IMAGE),
            }}
            className="relative block shrink-0 select-none overflow-hidden"
            initial={false}
            layout="position"
            style={{
              order: isExpanded ? 2 : 1,
              // Safari otherwise shimmers the image while it scales
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
              transform: "translate3d(0, 0, 0)",
            }}
            transition={{
              width: sizeTransition,
              height: sizeTransition,
              borderRadius: sizeTransition,
            }}
          >
            <Image
              alt=""
              className="object-cover"
              fill
              sizes={`${isExpanded ? EXPANDED_IMAGE : COLLAPSED_IMAGE}px`}
              src="/experiments/jamie-kettle-3t-j09n_pYo-unsplash.jpg"
            />
          </motion.span>

          {/* Text */}
          <motion.span
            animate={{
              fontSize: isExpanded ? "1.5rem" : "1.125rem",
              marginLeft: isExpanded ? 0 : 16,
              marginBottom: isExpanded ? 16 : 0,
            }}
            className="block select-none whitespace-nowrap font-semibold text-foreground tracking-tight"
            initial={false}
            layout="position"
            style={{
              order: isExpanded ? 1 : 2,
              textAlign: isExpanded ? "center" : "left",
            }}
            transition={{
              fontSize: sizeTransition,
              marginLeft: sizeTransition,
              marginBottom: sizeTransition,
            }}
          >
            Rabbit #{id}
          </motion.span>
        </motion.span>
      </motion.button>
    </motion.li>
  );
};

export const PreviewBlock = () => {
  const [expandedCard, setExpandedCard] = useState<number | undefined>();
  const reduced = useReducedMotion();
  const rabbitIds = [1, 2, 3, 4, 5];

  const handleToggle = (id: number) => {
    setExpandedCard(expandedCard === id ? undefined : id);
  };

  return (
    <LayoutGroup>
      <motion.ul
        className="flex flex-col items-center gap-3"
        initial={false}
        layout="position"
        transition={reduced ? { duration: 0 } : springConfig}
      >
        {rabbitIds.map((id) => (
          <Card
            id={id}
            isExpanded={expandedCard === id}
            key={id}
            onToggle={() => handleToggle(id)}
          />
        ))}
      </motion.ul>
    </LayoutGroup>
  );
};
