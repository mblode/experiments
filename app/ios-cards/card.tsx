import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { openSpring } from "./data";

interface Props {
  id: string;
  title: string;
  category: string;
  backgroundColor: string;
  imageUrl: string;
  onSelect: (id: string) => void;
}

export const Card = ({
  id,
  title,
  category,
  backgroundColor,
  imageUrl,
  onSelect,
}: Props) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <li className="h-[300px] sm:h-[420px]">
      <button
        aria-label={`${title} — ${category}`}
        className="group block h-full w-full cursor-pointer rounded-[20px] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
        onClick={() => onSelect(id)}
        type="button"
      >
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-[20px] bg-ios-card-bg"
          layoutId={`card-container-${id}`}
          transition={reduced ? { duration: 0 } : openSpring}
        >
          <motion.div
            className="absolute inset-0 overflow-hidden"
            layoutId={`card-image-container-${id}`}
            // Doubles as the tone the tile holds while the photo loads.
            style={{ backgroundColor }}
            transition={reduced ? { duration: 0 } : openSpring}
          >
            <Image
              alt=""
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              src={imageUrl}
            />
            {/* Photos are arbitrary, so the label needs its own contrast. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black/55 to-transparent"
            />
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="absolute top-3 left-3 max-w-[250px] text-left sm:top-4 sm:left-4 sm:max-w-[300px]"
            layoutId={`title-container-${id}`}
            transition={reduced ? { duration: 0 } : openSpring}
          >
            <span className="text-white/80 text-xs uppercase tracking-wide sm:text-sm">
              {category}
            </span>
            <h2 className="mt-1 font-semibold text-lg text-white sm:mt-2 sm:text-xl">
              {title}
            </h2>
          </motion.div>
        </motion.div>
      </button>
    </li>
  );
};
