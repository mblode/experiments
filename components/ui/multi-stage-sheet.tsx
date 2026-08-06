"use client";

import {
  AlertTriangle,
  CircleBanSignIcon,
  DotGrid3x3Icon,
  Eye,
  EyeSlashIcon,
  FaceIdIcon,
  Lock,
  ShieldIcon,
  X,
} from "blode-icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Drawer } from "vaul";

interface MultiStageSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

type Stage = "default" | "phrase" | "key" | "remove";

const STAGE_COPY: Record<Stage, { title: string; description: string }> = {
  default: {
    title: "Wallet options",
    description:
      "View your private key or recovery phrase, or remove the wallet.",
  },
  phrase: {
    title: "Secret Recovery Phrase",
    description: "Reveal the phrase used to back up this wallet.",
  },
  key: {
    title: "Private Key",
    description: "Reveal the key used to access this wallet.",
  },
  remove: {
    title: "Remove wallet",
    description: "Confirm that you want to remove this wallet.",
  },
};

const ROW_BUTTON =
  "flex h-12 w-full cursor-pointer items-center gap-3 rounded-2xl px-4 text-left font-semibold text-[17px] transition-[background-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 focus-visible:outline-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

const PILL_BUTTON =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full font-semibold text-[19px] transition-[background-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 focus-visible:outline-offset-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

// Custom hook to measure element height
function useMeasure() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(ref.current);
      setHeight(ref.current.getBoundingClientRect().height);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return [ref, height] as const;
}

// Animation variants matching Vaul's style
const contentVariants = {
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  hidden: (custom: string) => {
    const base = {
      opacity: 0,
      scale: 0.96,
    };

    // Faster exit for remove stage
    if (custom === "remove") {
      return {
        ...base,
        transition: {
          ease: [0.26, 0.08, 0.25, 1] as [number, number, number, number],
          duration: 0.15,
        },
      };
    }

    return base;
  },
};

export function MultiStageSheet({
  open: controlledOpen,
  onOpenChange,
  trigger,
}: MultiStageSheetProps) {
  const [stage, setStage] = useState<Stage>("default");
  const [localOpen, setLocalOpen] = useState(false);
  const [contentRef, contentHeight] = useMeasure();
  const shouldReduceMotion = useReducedMotion();

  // Use controlled open if provided, otherwise use local state
  const isOpen = controlledOpen !== undefined ? controlledOpen : localOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setLocalOpen(newOpen);
    }
    onOpenChange?.(newOpen);

    // Reset stage after closing animation
    if (!newOpen) {
      setTimeout(() => setStage("default"), 300);
    }
  };

  // Calculate height based on stage
  const getHeight = () => {
    switch (stage) {
      case "default":
        return 290;
      case "remove":
        return 312;
      case "phrase":
        return 465;
      case "key":
        return 441;
      default:
        return contentHeight || 500;
    }
  };

  const handleStageChange = (newStage: Stage) => {
    setStage(newStage);
  };

  const resizeTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration: 0.27,
        ease: [0.25, 1, 0.5, 1] as [number, number, number, number],
      };

  const stageTransition = (duration: number) =>
    shouldReduceMotion
      ? { duration: 0 }
      : {
          ease: [0.26, 0.08, 0.25, 1] as [number, number, number, number],
          duration,
        };

  return (
    <Drawer.Root
      modal={true}
      onOpenChange={handleOpenChange}
      open={isOpen}
      shouldScaleBackground
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-gray-950/40 backdrop-blur-[2px]"
          style={{ zIndex: 9998 }}
        />
        <Drawer.Content asChild>
          {/* The height is hard-coded per stage rather than measured: animating
              to a height read back after render shows a jump on the first
              frame. `contentHeight` is only the fallback. */}
          <motion.div
            animate={{ height: getHeight(), transition: resizeTransition }}
            className="fixed inset-x-4 bottom-4 mx-auto max-w-[361px] overflow-hidden rounded-[36px] bg-white text-gray-900 outline-none md:mx-auto md:w-full"
            initial={false}
            style={{ zIndex: 9999 }}
          >
            <Drawer.Title className="sr-only">
              {STAGE_COPY[stage].title}
            </Drawer.Title>
            <Drawer.Description className="sr-only">
              {STAGE_COPY[stage].description}
            </Drawer.Description>

            <div className="px-6 pt-2.5 pb-6" ref={contentRef}>
              {/* Close button. Nudged with a transform rather than top/right so
                  the move stays off the layout path. */}
              <Drawer.Close asChild>
                <motion.button
                  animate={{
                    x: stage === "default" ? 0 : -4,
                    y: stage === "default" ? 0 : 4,
                  }}
                  aria-label="Close"
                  className="absolute top-7 right-7 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-[background-color,transform] duration-150 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 focus-visible:outline-offset-2 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
                  initial={false}
                  transition={resizeTransition}
                  type="button"
                >
                  <X aria-hidden className="h-4 w-4" />
                </motion.button>
              </Drawer.Close>

              {/* Content with smooth opacity/scale transitions */}
              <AnimatePresence custom={stage} initial={false} mode="popLayout">
                {stage === "default" && (
                  <motion.div
                    animate="visible"
                    exit="hidden"
                    initial="initial"
                    key="default"
                    transition={stageTransition(0.22)}
                    variants={contentVariants}
                  >
                    <header className="mb-4 flex h-[72px] items-center border-gray-100 border-b pl-2">
                      <h2 className="font-semibold text-[19px] text-gray-900">
                        Options
                      </h2>
                    </header>

                    <div className="space-y-3">
                      <button
                        className={`${ROW_BUTTON} bg-gray-100 text-gray-900 hover:bg-gray-200`}
                        onClick={() => handleStageChange("key")}
                        type="button"
                      >
                        <Lock aria-hidden className="h-5 w-5 text-gray-600" />
                        View Private Key
                      </button>

                      <button
                        className={`${ROW_BUTTON} bg-gray-100 text-gray-900 hover:bg-gray-200`}
                        onClick={() => handleStageChange("phrase")}
                        type="button"
                      >
                        <DotGrid3x3Icon
                          aria-hidden
                          className="h-5 w-5 text-gray-600"
                        />
                        View Recovery Phrase
                      </button>

                      <button
                        className={`${ROW_BUTTON} bg-red-50 text-red-600 hover:bg-red-100`}
                        onClick={() => handleStageChange("remove")}
                        type="button"
                      >
                        <AlertTriangle aria-hidden className="h-5 w-5" />
                        Remove Wallet
                      </button>
                    </div>
                  </motion.div>
                )}

                {stage === "phrase" && (
                  <motion.div
                    animate="visible"
                    custom={stage}
                    exit="hidden"
                    initial="initial"
                    key="phrase"
                    transition={stageTransition(0.27)}
                    variants={contentVariants}
                  >
                    <div className="px-2">
                      <header className="mt-[21px] border-gray-100 border-b pb-6">
                        <div className="mb-4 flex justify-center">
                          <Eye
                            aria-hidden
                            className="h-12 w-12 text-gray-500"
                          />
                        </div>
                        <h2 className="font-semibold text-[22px] text-gray-900">
                          Secret Recovery Phrase
                        </h2>
                        <p className="mt-3 text-[17px] text-gray-500 leading-[24px]">
                          Your Secret Recovery Phrase is the key used to back up
                          your wallet. Keep it secret at all times.
                        </p>
                      </header>

                      <ul className="mt-6 space-y-4">
                        <li className="flex items-center gap-3 font-medium text-[15px] text-gray-600">
                          <ShieldIcon
                            aria-hidden
                            className="h-6 w-6 text-gray-400"
                          />
                          Keep your Secret Phrase safe
                        </li>
                        <li className="flex items-center gap-3 font-medium text-[15px] text-gray-600">
                          <EyeSlashIcon
                            aria-hidden
                            className="h-6 w-6 text-gray-400"
                          />
                          Don't share it with anyone else
                        </li>
                        <li className="flex items-center gap-3 font-medium text-[15px] text-gray-600">
                          <CircleBanSignIcon
                            aria-hidden
                            className="h-6 w-6 text-gray-400"
                          />
                          If you lose it, we can't recover it
                        </li>
                      </ul>
                    </div>

                    <div className="mt-7 flex gap-4">
                      <button
                        className={`${PILL_BUTTON} bg-gray-100 text-gray-900 hover:bg-gray-200`}
                        onClick={() => handleStageChange("default")}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={`${PILL_BUTTON} bg-blue-600 text-white hover:bg-blue-700`}
                        type="button"
                      >
                        <FaceIdIcon aria-hidden className="h-5 w-5" />
                        Reveal
                      </button>
                    </div>
                  </motion.div>
                )}

                {stage === "key" && (
                  <motion.div
                    animate="visible"
                    custom={stage}
                    exit="hidden"
                    initial="initial"
                    key="key"
                    transition={stageTransition(0.27)}
                    variants={contentVariants}
                  >
                    <div className="px-2">
                      <header className="mt-[21px] border-gray-100 border-b pb-6">
                        <div className="mb-4 flex justify-center">
                          <Lock
                            aria-hidden
                            className="h-12 w-12 text-gray-500"
                          />
                        </div>
                        <h2 className="font-semibold text-[22px] text-gray-900">
                          Private Key
                        </h2>
                        <p className="mt-3 text-[17px] text-gray-500 leading-[24px]">
                          Your Private Key is used to access your wallet. Never
                          share it with anyone.
                        </p>
                      </header>

                      <ul className="mt-6 space-y-4">
                        <li className="flex items-center gap-3 font-medium text-[15px] text-gray-600">
                          <ShieldIcon
                            aria-hidden
                            className="h-6 w-6 text-gray-400"
                          />
                          Keep your private key secure
                        </li>
                        <li className="flex items-center gap-3 font-medium text-[15px] text-gray-600">
                          <Lock aria-hidden className="h-6 w-6 text-gray-400" />
                          Never share it online
                        </li>
                        <li className="flex items-center gap-3 font-medium text-[15px] text-gray-600">
                          <CircleBanSignIcon
                            aria-hidden
                            className="h-6 w-6 text-gray-400"
                          />
                          Store it in a safe place
                        </li>
                      </ul>
                    </div>

                    <div className="mt-7 flex gap-4">
                      <button
                        className={`${PILL_BUTTON} bg-gray-100 text-gray-900 hover:bg-gray-200`}
                        onClick={() => handleStageChange("default")}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={`${PILL_BUTTON} bg-blue-600 text-white hover:bg-blue-700`}
                        type="button"
                      >
                        <Eye aria-hidden className="h-5 w-5" />
                        View Key
                      </button>
                    </div>
                  </motion.div>
                )}

                {stage === "remove" && (
                  <motion.div
                    animate="visible"
                    custom={stage}
                    exit="hidden"
                    initial="initial"
                    key="remove"
                    transition={stageTransition(0.15)}
                    variants={contentVariants}
                  >
                    <div className="px-2">
                      <header className="mt-[21px]">
                        <div className="mb-4 flex justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                            <AlertTriangle
                              aria-hidden
                              className="h-6 w-6 text-red-600"
                            />
                          </div>
                        </div>
                        <h2 className="text-center font-semibold text-[22px] text-gray-900">
                          Are you sure?
                        </h2>
                      </header>
                      <p className="mt-3 text-center text-[17px] text-gray-500 leading-[24px]">
                        You haven't backed up your wallet yet. If you remove it,
                        you could lose access forever.
                      </p>
                    </div>

                    <div className="mt-7 flex gap-4">
                      <button
                        className={`${PILL_BUTTON} bg-gray-100 text-gray-900 hover:bg-gray-200`}
                        onClick={() => handleStageChange("default")}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={`${PILL_BUTTON} bg-red-600 text-white hover:bg-red-700`}
                        type="button"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
