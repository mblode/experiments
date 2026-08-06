"use client";

import { X } from "blode-icons-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useId, useRef } from "react";

import { items, openSpring } from "./data";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ItemProps {
  id: string;
  onClose: () => void;
}

export function Item({ id, onClose }: ItemProps) {
  const reduced = useReducedMotion() ?? false;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /**
   * The expanded card is a modal in everything but markup, so it has to behave
   * like one: Escape closes it, Tab cannot walk out of it into the list
   * underneath, the page behind does not scroll, and focus goes back to the
   * card that opened it.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable =
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable.item(focusable.length - 1);
      if (!last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const item = items.find((entry) => entry.id === id);
  if (!item) {
    return null;
  }

  const { category, title, backgroundColor } = item;
  const layout = reduced ? { duration: 0 } : openSpring;

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        aria-hidden="true"
        className="fixed inset-0 z-[1] bg-black/70 backdrop-blur-[2px]"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.2 }}
      />

      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4 sm:p-10">
        <motion.div
          aria-labelledby={titleId}
          aria-modal="true"
          className="pointer-events-auto relative mx-auto max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-[20px] bg-ios-card-bg"
          layoutId={`card-container-${id}`}
          ref={dialogRef}
          role="dialog"
          transition={layout}
        >
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-200 ease hover:bg-white/35 active:bg-white/45 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            initial={{ opacity: 0 }}
            onClick={onClose}
            ref={closeRef}
            transition={{
              duration: reduced ? 0 : 0.2,
              delay: reduced ? 0 : 0.1,
            }}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </motion.button>

          <motion.div
            className="relative h-[250px] w-full overflow-hidden sm:h-[420px]"
            layoutId={`card-image-container-${id}`}
            style={{ backgroundColor }}
            transition={layout}
          >
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, 800px"
              src={item.imageUrl}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black/55 to-transparent"
            />
          </motion.div>

          <motion.div
            className="absolute top-4 left-4 z-10 max-w-[300px] sm:top-8 sm:left-8"
            layoutId={`title-container-${id}`}
            transition={layout}
          >
            <span className="text-white/80 text-xs uppercase tracking-wide sm:text-sm">
              {category}
            </span>
            <h2
              className="mt-1 font-semibold text-white text-xl sm:mt-2 sm:text-2xl"
              id={titleId}
            >
              {title}
            </h2>
          </motion.div>

          <motion.div
            animate={{ opacity: 1 }}
            className="px-6 py-6 sm:px-8 sm:py-8"
            initial={{ opacity: 0 }}
            transition={{
              duration: reduced ? 0 : 0.25,
              delay: reduced ? 0 : 0.1,
            }}
          >
            <p className="max-w-[62ch] text-base text-ios-secondary leading-7 sm:text-lg sm:leading-8">
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
