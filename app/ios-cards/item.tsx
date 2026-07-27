"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

import { items } from "./data";

interface ItemProps {
  id: string;
  setSelectedId: (id: string | null) => void;
}

export function Item({ id, setSelectedId }: ItemProps) {
  const item = items.find((item) => item.id === id);
  if (!item) {
    return null;
  }

  const { category, title } = item;

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        className="pointer-events-auto fixed top-0 bottom-0 left-1/2 z-[1] w-full -translate-x-1/2 bg-black/80"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={() => setSelectedId(null)}
        transition={{ duration: 0.2, delay: 0.1 }}
      />

      <div className="pointer-events-none fixed top-0 right-0 bottom-0 left-0 z-10 flex items-center justify-center p-4 sm:p-10">
        <motion.div
          className="pointer-events-auto relative mx-auto h-auto max-h-[90vh] w-full max-w-[700px] overflow-hidden overflow-y-auto rounded-[20px] bg-ios-card-bg"
          layoutId={`card-container-${id}`}
        >
          <motion.button
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
            initial={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
            transition={{ delay: 0.2 }}
          >
            <X className="h-5 w-5 text-white" />
          </motion.button>

          <motion.div
            className="relative h-[250px] w-full overflow-hidden sm:h-[420px]"
            layoutId={`card-image-container-${id}`}
          >
            <Image
              alt={title}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, 800px"
              src={item.imageUrl}
            />
          </motion.div>

          <motion.div
            className="absolute top-4 left-4 z-10 max-w-[300px] sm:top-[30px] sm:left-[30px]"
            layoutId={`title-container-${id}`}
          >
            <span className="text-white text-xs uppercase sm:text-sm">
              {category}
            </span>
            <h2 className="my-1 font-semibold text-white text-xl sm:my-2 sm:text-2xl">
              {title}
            </h2>
          </motion.div>

          <motion.div
            animate={{ opacity: 1 }}
            className="px-4 pt-6 pb-6 sm:px-9 sm:pt-10 sm:pb-9"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <p className="text-[#9d9ca1] text-base leading-6 sm:text-xl sm:leading-7">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
