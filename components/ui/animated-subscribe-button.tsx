"use client";

import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  Children,
  isValidElement,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useState,
} from "react";

import { cn } from "@/lib/utils";

interface AnimatedSubscribeButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "ref" | "children"
> {
  subscribeStatus?: boolean;
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

export const AnimatedSubscribeButton = ({
  ref,
  subscribeStatus,
  onClick,
  className,
  children,
  ...props
}: AnimatedSubscribeButtonProps) => {
  const isControlled = subscribeStatus !== undefined;
  const [uncontrolledStatus, setUncontrolledStatus] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // One source of truth: the prop wins when controlled, otherwise local state.
  const isSubscribed = isControlled ? subscribeStatus : uncontrolledStatus;

  if (
    Children.count(children) !== 2 ||
    !Children.toArray(children).every(
      (child) => isValidElement(child) && child.type === "span"
    )
  ) {
    throw new Error(
      "AnimatedSubscribeButton expects two children, both of which must be <span> elements."
    );
  }

  const [initialChild, changeChild] = Children.toArray(children);

  // The subscribed label drops in from above, the follow label slides out to
  // the right; going back plays the same two paths in reverse.
  const offscreen = isSubscribed
    ? { y: -40, opacity: 0 }
    : { x: 40, opacity: 0 };

  return (
    <motion.button
      className={cn(
        "group relative flex h-10 w-fit cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (!isControlled) {
          setUncontrolledStatus((current) => !current);
        }
        onClick?.(event);
      }}
      ref={ref}
      type="button"
      {...props}
    >
      {/* One persistent button, so focus survives the toggle and only the
          label is swapped. */}
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          animate={{ x: 0, y: 0, opacity: 1 }}
          className="flex items-center justify-center"
          exit={
            shouldReduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : {
                  ...offscreen,
                  transition: {
                    duration: 0.12,
                    ease: [0.55, 0.085, 0.68, 0.53],
                  },
                }
          }
          initial={shouldReduceMotion ? { opacity: 0 } : offscreen}
          key={isSubscribed ? "subscribed" : "follow"}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 34 }
          }
        >
          {isSubscribed ? changeChild : initialChild}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};
