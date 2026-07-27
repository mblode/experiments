"use client";

import { motion } from "motion/react";

import { PASTEL_COLORS, useStickyNotesStore } from "../store";

const colors = Object.values(PASTEL_COLORS);

export const ColorPicker = () => {
  const { currentColor, setCurrentColor } = useStickyNotesStore();

  return (
    <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 gap-4">
      {colors.map((color) => (
        <motion.button
          animate={{
            boxShadow:
              currentColor === color
                ? "0 0 0 2px rgba(0,0,0,0.3), 0 4px 6px -1px rgba(0,0,0,0.1)"
                : "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
          className="h-10 w-10 cursor-pointer rounded-full border border-black/12 shadow-md"
          key={color}
          onClick={() => setCurrentColor(color)}
          style={{ backgroundColor: color }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      ))}
    </div>
  );
};
