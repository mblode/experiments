"use client";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

// ease-out-quart. The height tween is the deliberate
// container-resize exception; everything else stays on transform/opacity.
const EASE_OUT: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

interface DateCardProps {
  day: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function DateCard({ day, isExpanded, onToggle }: DateCardProps) {
  const reduced = useReducedMotion();
  const detailId = useId();
  const duration = reduced ? 0 : 0.28;

  return (
    <motion.div
      className="w-64"
      initial={false}
      layout
      transition={{ layout: { duration, ease: EASE_OUT } }}
    >
      <div className="flex flex-col">
        {/* Main card container */}
        <motion.button
          animate={{ height: isExpanded ? 160 : 64 }}
          aria-controls={detailId}
          aria-expanded={isExpanded}
          className={cn(
            "relative flex w-64 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
            isExpanded ? "bg-primary" : "bg-card hover:bg-muted"
          )}
          initial={false}
          onClick={onToggle}
          transition={{
            height: { duration, ease: EASE_OUT },
            scale: { duration: reduced ? 0 : 0.12, ease: EASE_OUT },
          }}
          type="button"
          whileHover={reduced || isExpanded ? undefined : { scale: 1.02 }}
          whileTap={reduced ? undefined : { scale: 0.98 }}
        >
          {/* Absolutely positioned so the type resize never reflows the card */}
          <motion.span
            animate={{ fontSize: isExpanded ? "5rem" : "1.5rem" }}
            className={cn(
              "absolute font-extrabold leading-none tracking-tight transition-colors duration-150",
              isExpanded ? "text-primary-foreground" : "text-foreground"
            )}
            initial={false}
            transition={{ fontSize: { duration, ease: EASE_OUT } }}
          >
            {day}
          </motion.span>
        </motion.button>

        {/* Secondary info card, revealed by the clip rather than by moving */}
        <motion.div
          animate={{ height: isExpanded ? 48 : 0 }}
          className="overflow-hidden"
          id={detailId}
          initial={false}
          transition={{ duration, ease: EASE_OUT }}
        >
          <motion.p
            animate={{ opacity: isExpanded ? 1 : 0 }}
            className="mt-2 flex h-10 w-64 items-center justify-center rounded-xl border border-border bg-card px-3 text-foreground text-sm"
            initial={false}
            transition={{
              duration: reduced ? 0 : 0.18,
              delay: isExpanded && !reduced ? 0.1 : 0,
              ease: EASE_OUT,
            }}
          >
            Day {day} — today is clear
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export const ExpandBlock = () => {
  const [expandedDay, setExpandedDay] = useState<number | undefined>();
  const days = [25, 26, 27, 28, 29];

  const handleToggle = (day: number) => {
    setExpandedDay(expandedDay === day ? undefined : day);
  };

  return (
    <div className="py-8">
      <p className="mb-8 text-center text-muted-foreground text-sm">
        Select a date to expand it. Selecting another switches.
      </p>

      <LayoutGroup>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={false}
          layout
        >
          {days.map((day) => (
            <DateCard
              day={day}
              isExpanded={expandedDay === day}
              key={day}
              onToggle={() => handleToggle(day)}
            />
          ))}
        </motion.div>
      </LayoutGroup>
    </div>
  );
};
