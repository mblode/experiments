"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "./button";

type ToastState = "idle" | "pending" | "success" | "error";

function PendingView() {
  return (
    <div className="flex h-[48px] items-center justify-center gap-2.5 rounded-full bg-[#E5F3FF] px-5">
      <div className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <svg
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-[spin_3s_linear_infinite]"
          fill="none"
          height="20"
          viewBox="0 0 20 20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex h-[48px] items-center justify-center gap-2.5 rounded-full bg-[#FFE4E3] px-5">
      <motion.div
        animate={
          shouldReduceMotion ? { x: 0 } : { x: [0, -3, 2.5, -2, 1.5, -1, 0] }
        }
        className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center"
        initial={{ x: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.35,
          ease: [0.455, 0.03, 0.515, 0.955],
        }}
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
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
          aria-hidden="true"
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
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

// One exit path per ordered pair of states, so loading -> error reads
// differently from loading -> success: failures sink and squash, successes
// lift away and shrink.
const transitionVariants: Record<string, TransitionVariant> = {
  "idle-pending": { scale: 0.92, y: -10 },
  "idle-success": { scale: 0.8, y: -26 },
  "idle-error": { scale: 0.88, y: 18 },
  "pending-idle": { scale: 0.92, y: -10 },
  "pending-success": { scale: 0.78, y: -30 },
  "pending-error": { scaleY: 0.9, y: 22 },
  "success-idle": { scale: 0.8, y: -26 },
  "success-pending": { scale: 0.85, y: -18 },
  "success-error": { scale: 0.9, y: 20 },
  "error-idle": { scale: 0.88, y: 18 },
  "error-pending": { scaleY: 0.92, y: 14 },
  "error-success": { scale: 0.82, y: -28 },
};

export const ToastLoading = () => {
  const [state, setState] = useState<ToastState>("idle");
  const [transition, setTransition] = useState<TransitionVariant>();
  const [bounceValue, setBounceValue] = useState(0.5);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef(28);
  const shouldReduceMotion = useReducedMotion();

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

  // Measure the incoming content before paint and derive the bounce from how
  // far the container has to travel: a spring that suits the short pill
  // overshoots badly on a tall one.
  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }

    const { height } = element.getBoundingClientRect();
    const previousHeight = previousHeightRef.current;
    const heightDifference = Math.abs(height - previousHeight);
    const ratio = heightDifference / 100;

    let bounce =
      height < previousHeight ? 0.35 - 0.3 * ratio : 0.3 + 0.3 * ratio;
    bounce = Math.min(Math.max(bounce, 0.3), 0.35);

    if (heightDifference < 20) {
      bounce = 0.5;
    }

    previousHeightRef.current = height;
    setBounceValue(bounce);
  }, [state]);

  const handleStateChange = (newState: ToastState) => {
    setTransition(transitionVariants[`${state}-${newState}`]);
    setState(newState);
  };

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, bounce: bounceValue };

  return (
    <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-border bg-background">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <motion.div
            aria-live="polite"
            className="min-w-[100px] overflow-hidden rounded-full"
            layout
            role="status"
            style={{ borderRadius: "9999px" }}
            transition={springTransition}
          >
            <motion.div
              animate={{
                scale: 1,
                opacity: 1,
                transition: { delay: shouldReduceMotion ? 0 : 0.05 },
              }}
              initial={{ scale: shouldReduceMotion ? 1 : 0.9, opacity: 0 }}
              key={state}
              ref={contentRef}
              transition={springTransition}
            >
              {renderContent()}
            </motion.div>
          </motion.div>

          {/* Ghost copy of the outgoing pill, flown off on the path picked for
              this exact state pair. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 flex h-[200px] w-[300px] -translate-x-1/2 items-start justify-center"
          >
            <AnimatePresence custom={transition} mode="popLayout">
              <motion.div
                exit="exit"
                initial={{ opacity: 0 }}
                key={`${state}second`}
                variants={{
                  exit: (custom: TransitionVariant | undefined) => ({
                    ...(shouldReduceMotion ? {} : (custom ?? {})),
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
          <Button onClick={() => handleStateChange("pending")} variant="muted">
            Pending
          </Button>
          <Button
            onClick={() => handleStateChange("error")}
            variant="destructiveSecondary"
          >
            Error
          </Button>
          <Button
            onClick={() => handleStateChange("success")}
            variant="successSecondary"
          >
            Success
          </Button>
        </div>
      </div>
    </div>
  );
};
