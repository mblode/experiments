"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useLayoutEffect, useRef, useState } from "react";

import { Button } from "./button";

interface DynamicIslandContextType {
  state: string;
  setState: (state: string) => void;
}

const ToastLoadingContext = createContext<DynamicIslandContextType>({
  state: "idle",
  setState: () => undefined,
});

function PendingView() {
  return (
    <div className="flex h-[48px] items-center justify-center gap-2.5 rounded-full bg-[#E5F3FF] px-5">
      <div className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <svg
          className="animate-spin"
          fill="none"
          height="20"
          viewBox="0 0 20 20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Loading</title>
          <circle
            cx="10"
            cy="10"
            r="7"
            stroke="#4EAFFF"
            strokeDasharray="32"
            strokeDashoffset="8"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <span className="whitespace-nowrap font-semibold text-[#4EAFFF] text-base">
        Loading...
      </span>
    </div>
  );
}

function ErrorView() {
  return (
    <div className="flex h-[48px] items-center justify-center gap-2.5 rounded-full bg-[#FFE4E3] px-5">
      <motion.div
        animate={{
          x: [0, -3, 2.5, -2, 1.5, -1, 0],
        }}
        className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center"
        initial={{ x: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.35,
          ease: "easeInOut",
        }}
      >
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Error</title>
          <path
            clipRule="evenodd"
            d="M8.6026 4.07088C10.1677 1.5532 13.8318 1.5532 15.3969 4.07088L21.4996 13.8884C23.156 16.5529 21.2399 20.0001 18.1025 20.0001H5.89699C2.75962 20.0001 0.843525 16.5529 2.49985 13.8884L8.6026 4.07088ZM12 8C12.5523 8 13 8.44771 13 9V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V9C11 8.44771 11.4477 8 12 8ZM10.75 15C10.75 14.3096 11.3096 13.75 12 13.75C12.6904 13.75 13.25 14.3096 13.25 15C13.25 15.6904 12.6904 16.25 12 16.25C11.3096 16.25 10.75 15.6904 10.75 15Z"
            fill="#FF403F"
            fillRule="evenodd"
          />
        </svg>
      </motion.div>
      <span className="whitespace-nowrap font-semibold text-[#FF403F] text-base">
        Error occurred
      </span>
    </div>
  );
}

function SuccessView() {
  return (
    <div className="flex h-[48px] items-center justify-center gap-2.5 rounded-full bg-[#DBF4DE] px-5">
      <div className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Success</title>
          <path
            clipRule="evenodd"
            d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM15.774 10.1333C16.1237 9.70582 16.0607 9.0758 15.6332 8.72607C15.2058 8.37635 14.5758 8.43935 14.226 8.86679L10.4258 13.5116L9.20711 12.2929C8.81658 11.9024 8.18342 11.9024 7.79289 12.2929C7.40237 12.6834 7.40237 13.3166 7.79289 13.7071L9.79289 15.7071C9.99267 15.9069 10.2676 16.0129 10.5498 15.9988C10.832 15.9847 11.095 15.8519 11.274 15.6333L15.774 10.1333Z"
            fill="#35C759"
            fillRule="evenodd"
          />
        </svg>
      </div>
      <span className="whitespace-nowrap font-semibold text-[#35C759] text-base">
        Success!
      </span>
    </div>
  );
}

interface TransitionVariant {
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  y?: number;
}

const transitionVariants: Record<string, TransitionVariant> = {
  "ring-mode-idle": { scale: 0.9, scaleX: 0.9 },
  "timer-ring-mode": { scale: 0.7, y: -7.5 },
  "ring-mode-timer": { scale: 1.4, y: 7.5 },
  "timer-listening": { scaleY: 1.1, y: 7.5 },
  "listening-ring-mode": { scale: 0.65, y: -32 },
  "ring-mode-listening": { scale: 1.5, y: 12.5 },
  "timer-idle": { scale: 0.7, y: -7.5 },
  "listening-timer": { scaleY: 0.9, y: -12 },
  "listening-idle": { scale: 0.4, y: -36 },
  "idle-ring-mode": { scale: 0.9, scaleX: 0.9 },
  "idle-timer": { scale: 0.7, y: -7.5 },
  "idle-listening": { scale: 0.4, y: -36 },
};

export const ToastLoading = () => {
  const [state, setState] = useState("idle");
  const [transition, setTransition] = useState<TransitionVariant>();
  const [bounceValue, setBounceValue] = useState(1);
  const [previousHeight, setPreviousHeight] = useState(28);
  const contentRef = useRef<HTMLDivElement>(null);

  function renderContent() {
    switch (state) {
      case "error":
        return <ErrorView />;
      case "success":
        return <SuccessView />;
      default:
        return <PendingView />;
    }
  }

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (element) {
      const { height } = element.getBoundingClientRect();
      const heightDifference = Math.abs(height - previousHeight);
      const ratio = heightDifference / 100;

      let bounce =
        height < previousHeight ? 0.35 - 0.3 * ratio : 0.3 + 0.3 * ratio;
      bounce = Math.min(Math.max(bounce, 0.3), 0.35);

      if (heightDifference < 20) {
        bounce = 0.5;
      }

      setPreviousHeight(height);
      setBounceValue(bounce);
    }
  }, [previousHeight]);

  const handleStateChange = (newState: string) => {
    const transitionKey = `${state}-${newState}`;
    setTransition(transitionVariants[transitionKey]);
    setState(newState);
  };

  return (
    <ToastLoadingContext.Provider value={{ state, setState }}>
      <div className="flex h-[400px] w-full items-center justify-center border border-border bg-white">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <motion.div
              className="min-w-[100px] overflow-hidden rounded-full"
              layout
              style={{ borderRadius: "9999px" }}
              transition={{
                type: "spring",
                bounce: bounceValue,
              }}
            >
              <motion.div
                animate={{
                  scale: 1,
                  opacity: 1,
                  originX: 0.5,
                  originY: 0.5,
                  transition: { delay: 0.05 },
                }}
                initial={{
                  scale: 0.9,
                  opacity: 0,
                  originX: 0.5,
                  originY: 0.5,
                }}
                key={state}
                ref={contentRef}
                transition={{
                  type: "spring",
                  bounce: bounceValue,
                }}
              >
                {renderContent()}
              </motion.div>
            </motion.div>

            <div className="pointer-events-none absolute top-0 left-1/2 flex h-[200px] w-[300px] -translate-x-1/2 items-start justify-center">
              <AnimatePresence custom={transition} mode="popLayout">
                <motion.div
                  exit="exit"
                  initial={{ opacity: 0 }}
                  key={`${state}second`}
                  variants={{
                    exit: (custom: TransitionVariant | undefined) => ({
                      ...(custom ?? {}),
                      opacity: [1, 0],
                    }),
                  }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleStateChange("pending")}>
              Pending
            </Button>
            <Button onClick={() => handleStateChange("error")}>Error</Button>
            <Button onClick={() => handleStateChange("success")}>
              Success
            </Button>
          </div>
        </div>
      </div>
    </ToastLoadingContext.Provider>
  );
};
