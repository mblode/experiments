"use client";
import { LayoutGroup, motion } from "motion/react";
import { useState } from "react";

interface DateCardProps {
  day: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function DateCard({ day, isExpanded, onToggle }: DateCardProps) {
  return (
    <motion.div
      className="w-64"
      initial={false}
      layout
      transition={{ layout: { duration: 0.3, ease: "easeOut" } }}
    >
      <div className="flex flex-col">
        {/* Main card container */}
        <motion.div
          animate={{
            height: isExpanded ? 160 : 64,
            backgroundColor: isExpanded ? "#001f3f" : "#ffffff",
          }}
          className="relative flex w-64 cursor-pointer items-center justify-center overflow-hidden rounded-2xl shadow-lg"
          initial={false}
          onClick={onToggle}
          transition={{
            height: { duration: 0.3, ease: "easeOut" },
            backgroundColor: { duration: 0.4, ease: "easeOut" },
            opacity: { duration: 0.2, ease: "easeOut" },
            scale: { duration: 0.15 },
          }}
          whileHover={isExpanded ? {} : { scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Text with transform for position */}
          <motion.h2
            animate={{
              fontSize: isExpanded ? "5rem" : "1.5rem",
              color: isExpanded ? "#ffffff" : "#001f3f",
            }}
            className="absolute m-0 font-extrabold"
            initial={false}
            style={{
              lineHeight: 1,
            }}
            transition={{
              fontSize: { duration: 0.3, ease: "easeOut" },
              color: { duration: 0.15, ease: "easeOut" },
            }}
          >
            {day}
          </motion.h2>
        </motion.div>

        {/* Secondary info card */}
        <motion.div
          animate={{
            height: isExpanded ? 48 : 0,
            marginTop: isExpanded ? 8 : 0,
          }}
          className="overflow-hidden"
          initial={{ height: 0, marginTop: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        >
          <motion.p
            animate={{
              opacity: isExpanded ? 1 : 0,
              y: isExpanded ? 0 : -10,
            }}
            className="box-border flex h-10 w-64 cursor-pointer items-center justify-center rounded-xl bg-white p-2 text-black shadow-md"
            initial={{ opacity: 0, y: -10 }}
            onClick={onToggle}
            transition={{
              duration: 0.2,
              delay: isExpanded ? 0.15 : 0,
            }}
          >
            Day {day} - Today is clear
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
    <div className="p-8 font-sans">
      <p className="mb-8 text-center">
        Click on any date to expand it. Click another date to switch.
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
