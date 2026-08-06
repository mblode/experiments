"use client";

import {
  Content as AccordionContentPrimitive,
  Header as AccordionHeader,
  Item as AccordionItemPrimitive,
  Root as AccordionRoot,
  Trigger as AccordionTriggerPrimitive,
} from "@radix-ui/react-accordion";
import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  type Transition,
  useReducedMotion,
} from "motion/react";
import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

// ~270ms to settle: fast enough for ANIMATION.md's 0.2-0.3s window while
// still reading as a spring rather than a tween.
const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

interface AccordionItemContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AccordionItemContext = createContext<
  AccordionItemContextType | undefined
>(undefined);

const useAccordionItem = (): AccordionItemContextType => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error("useAccordionItem must be used within an AccordionItem");
  }
  return context;
};

function Accordion({ ...props }: ComponentProps<typeof AccordionRoot>) {
  return <AccordionRoot data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionItemPrimitive>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AccordionItemContext.Provider value={{ isOpen, setIsOpen }}>
      <AccordionItemPrimitive
        className={cn("border-b last:border-b-0", className)}
        data-slot="accordion-item"
        {...props}
      >
        {children}
      </AccordionItemPrimitive>
    </AccordionItemContext.Provider>
  );
}

type AccordionTriggerProps = ComponentProps<
  typeof AccordionTriggerPrimitive
> & {
  transition?: Transition;
  chevron?: boolean;
};

function AccordionTrigger({
  ref,
  className,
  children,
  transition = DEFAULT_TRANSITION,
  ...props
}: AccordionTriggerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
  const { isOpen, setIsOpen } = useAccordionItem();
  const shouldReduceMotion = useReducedMotion();
  const iconTransition = shouldReduceMotion ? { duration: 0 } : transition;

  useEffect(() => {
    const node = triggerRef.current;
    if (!node) {
      return;
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === "data-state") {
          const currentState = node.getAttribute("data-state");
          setIsOpen(currentState === "open");
        }
      }
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
    const initialState = node.getAttribute("data-state");
    setIsOpen(initialState === "open");
    return () => {
      observer.disconnect();
    };
  }, [setIsOpen]);

  return (
    <AccordionHeader className="flex">
      <AccordionTriggerPrimitive
        className={cn(
          "group flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-[color,opacity] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
          className
        )}
        data-slot="accordion-trigger"
        ref={triggerRef}
        {...props}
      >
        {children}
        <div
          aria-hidden
          className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 group-hover:text-foreground motion-reduce:transition-none"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="pointer-events-none absolute h-0.5 w-4 rounded-full bg-current"
            transition={iconTransition}
          />
          <motion.div
            animate={{ scale: isOpen ? 0 : 1, rotateZ: isOpen ? 80 : 0 }}
            className="pointer-events-none absolute h-4 w-0.5 rounded-full bg-current"
            style={{ transformOrigin: "center" }}
            transition={iconTransition}
          />
        </div>
      </AccordionTriggerPrimitive>
    </AccordionHeader>
  );
}

type AccordionContentProps = ComponentProps<typeof AccordionContentPrimitive> &
  HTMLMotionProps<"div"> & {
    transition?: Transition;
  };

function AccordionContent({
  className,
  children,
  transition = DEFAULT_TRANSITION,
  ...props
}: AccordionContentProps) {
  const { isOpen } = useAccordionItem();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <AccordionContentPrimitive forceMount>
          {/* Height is tweened deliberately: CSS cannot animate to `auto`, and
              the gradient mask riding alongside it is what reveals the answer
              top-down instead of sliding it up behind a clipped edge. */}
          <motion.div
            animate={{ height: "auto", opacity: 1, "--mask-stop": "100%" }}
            className="overflow-hidden"
            data-slot="accordion-content"
            exit={{ height: 0, opacity: 0, "--mask-stop": "0%" }}
            initial={{ height: 0, opacity: 0, "--mask-stop": "0%" }}
            key="accordion-content"
            style={{
              maskImage:
                "linear-gradient(black var(--mask-stop), transparent var(--mask-stop))",
              WebkitMaskImage:
                "linear-gradient(black var(--mask-stop), transparent var(--mask-stop))",
            }}
            transition={shouldReduceMotion ? { duration: 0 } : transition}
            {...props}
          >
            <div
              className={cn(
                "pt-0 pb-6 text-muted-foreground text-sm leading-relaxed",
                className
              )}
            >
              {children}
            </div>
          </motion.div>
        </AccordionContentPrimitive>
      )}
    </AnimatePresence>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
