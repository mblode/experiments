"use client";
import {
  Anchor as PopoverAnchor,
  Content as PopoverContent,
  Portal as PopoverPortal,
  Root as PopoverRoot,
} from "@radix-ui/react-popover";
import {
  Content as TooltipContent,
  Portal as TooltipPortal,
  Provider as TooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { CircleDashedIcon, XIcon } from "blode-icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import useMeasure from "react-use-measure";

const statuses = {
  vacation: { id: "vacation", text: "On vacation", emoji: "🌴" },
  holiday: { id: "holiday", text: "On holiday", emoji: "🎉" },
  business: { id: "business", text: "On business", emoji: "💼" },
  leave: { id: "leave", text: "On leave", emoji: "👋" },
  sick: { id: "sick", text: "On sick", emoji: "🤒" },
};

const LABEL_SPRING = {
  type: "spring" as const,
  stiffness: 350,
  damping: 55,
};

// Width of the clear affordance, which is present but transparent when there is
// no status to clear.
const CLEAR_BUTTON_WIDTH = 20;

export const StatusBlock = () => {
  const [ref, bounds] = useMeasure();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<keyof typeof statuses | null>(null);
  const reduced = useReducedMotion();
  // The popover hangs off an Anchor rather than a Trigger, so Radix has nothing
  // to hand focus back to on close unless we point at the button ourselves.
  const triggerRef = useRef<HTMLButtonElement>(null);

  const label = status ? statuses[status]?.text : "Set status";
  const splitText = label?.split("");
  const spring = reduced ? { duration: 0 } : LABEL_SPRING;

  return (
    <PopoverRoot data-slot="popover" onOpenChange={setIsOpen} open={isOpen}>
      <TooltipProvider data-slot="tooltip-provider">
        <PopoverAnchor asChild>
          <motion.button
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label={status ? `Clear status: ${label}` : "Set status"}
            className="group relative flex w-fit cursor-pointer select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full bg-muted px-3 py-2 text-foreground transition-colors duration-200 hover:bg-muted-foreground/10 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            onClick={() => (status ? setStatus(null) : setIsOpen(true))}
            ref={triggerRef}
            transition={reduced ? { duration: 0 } : LABEL_SPRING}
            type="button"
            whileHover={reduced ? undefined : { scale: 1.04 }}
            whileTap={reduced ? undefined : { scale: 0.96 }}
          >
            {/* The label arrives one character at a time, so the outer width is
                sprung to the measured inner width rather than left to layout,
                which would snap to the final width on the first frame. */}
            <motion.span
              animate={{
                width:
                  bounds.width > 0
                    ? bounds.width - (status ? 0 : CLEAR_BUTTON_WIDTH)
                    : "auto",
              }}
              className="block"
              transition={spring}
            >
              <span className="flex w-fit items-center gap-2" ref={ref}>
                <AnimatePresence mode="popLayout">
                  {status ? (
                    <motion.span
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      aria-hidden="true"
                      className="block size-4 text-base leading-4"
                      exit={{ opacity: 0, scale: 0.5, filter: "blur(7px)" }}
                      key={status}
                      transition={{ duration: reduced ? 0 : 0.2 }}
                    >
                      {statuses[status]?.emoji}
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      className="block"
                      exit={{ opacity: 0, scale: 0.5, filter: "blur(7px)" }}
                      key="default"
                      transition={{ duration: reduced ? 0 : 0.2 }}
                    >
                      <CircleDashedIcon aria-hidden="true" className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* The button carries the readable name; these spans are one
                    character each and would be read out letter by letter. */}
                <span aria-hidden="true" className="flex items-center">
                  <AnimatePresence initial={false} mode="popLayout">
                    {splitText.map((letter, index) => {
                      return (
                        <motion.span
                          animate={{
                            opacity: 1,
                            filter: "blur(0px)",
                            transition: reduced
                              ? { duration: 0 }
                              : {
                                  ...LABEL_SPRING,
                                  delay: index * 0.015,
                                },
                          }}
                          className="inline-block font-semibold"
                          exit={{
                            opacity: 0,
                            filter: "blur(2px)",
                            transition: reduced
                              ? { duration: 0 }
                              : {
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 55,
                                },
                          }}
                          initial={{ opacity: 0, filter: "blur(2px)" }}
                          key={index + letter + status}
                          transition={spring}
                        >
                          {letter === " " ? "\u00A0" : letter}
                        </motion.span>
                      );
                    })}
                  </AnimatePresence>
                </span>
              </span>
            </motion.span>

            <motion.span
              animate={{
                opacity: status ? 1 : 0,
                filter: status ? "blur(0px)" : "blur(2px)",
              }}
              aria-hidden="true"
              className="ml-2 flex size-4 items-center justify-center rounded-full bg-muted-foreground/50 text-background transition-colors duration-200 group-hover:bg-muted-foreground"
              initial={{ opacity: 0, filter: "blur(2px)" }}
              transition={spring}
            >
              <XIcon size={12} />
            </motion.span>
          </motion.button>
        </PopoverAnchor>

        {/* forceMount plus a conditional child, so the exit animation gets to
            run before Radix tears the content down. */}
        <AnimatePresence>
          {isOpen && (
            <PopoverPortal forceMount>
              <PopoverContent
                align="center"
                asChild
                className="z-50 origin-(--radix-popover-content-transform-origin) rounded-full border border-border bg-popover text-popover-foreground outline-hidden"
                data-slot="popover-content"
                forceMount
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  triggerRef.current?.focus();
                }}
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  (event?.target as HTMLElement)?.focus();
                }}
                side="top"
                sideOffset={4}
              >
                <motion.div
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  className="flex items-center px-1.5"
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          scale: 0.9,
                          y: 8,
                          filter: "blur(4px)",
                        }
                  }
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          scale: 0.9,
                          y: 8,
                          filter: "blur(4px)",
                        }
                  }
                  transition={reduced ? { duration: 0 } : LABEL_SPRING}
                >
                  {Object.entries(statuses).map(([id, { text, emoji }]) => (
                    <TooltipRoot data-slot="tooltip" key={id}>
                      <TooltipTrigger asChild data-slot="tooltip-trigger">
                        {/* Grows downward by animating padding rather than
                            scale: scaling an emoji makes it soft, and this keeps
                            every glyph rendering at its native size. */}
                        <motion.button
                          aria-label={text}
                          className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                          initial={{
                            paddingLeft: 2,
                            paddingRight: 2,
                            paddingTop: 8,
                            paddingBottom: 8,
                          }}
                          key={id}
                          onClick={() => {
                            setStatus(id as keyof typeof statuses);
                            setIsOpen(false);
                          }}
                          type="button"
                          whileHover={
                            reduced
                              ? undefined
                              : { paddingTop: 4, paddingBottom: 12 }
                          }
                          whileTap={
                            reduced
                              ? undefined
                              : { paddingTop: 4, paddingBottom: 12 }
                          }
                        >
                          <span
                            aria-hidden="true"
                            className="flex size-10 items-center justify-center rounded-full bg-muted"
                          >
                            {emoji}
                          </span>
                        </motion.button>
                      </TooltipTrigger>

                      <TooltipPortal>
                        <TooltipContent
                          className="fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:zoom-out-95 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in text-balance rounded-full bg-muted px-3 py-1.5 text-muted-foreground text-xs blur-in-xs duration-200 data-[state=closed]:animate-out data-[state=closed]:blur-out-xs"
                          data-slot="tooltip-content"
                          sideOffset={8}
                        >
                          {text}
                        </TooltipContent>
                      </TooltipPortal>
                    </TooltipRoot>
                  ))}
                </motion.div>
              </PopoverContent>
            </PopoverPortal>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </PopoverRoot>
  );
};
