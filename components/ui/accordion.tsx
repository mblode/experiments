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
  transition = { type: "spring", stiffness: 150, damping: 22 },
  ...props
}: AccordionTriggerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
  const { isOpen, setIsOpen } = useAccordionItem();

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
          "flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        data-slot="accordion-trigger"
        ref={triggerRef}
        {...props}
      >
        {children}
        <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="pointer-events-none absolute h-0.5 w-4 rounded-full bg-foreground"
            transition={transition}
          />
          <motion.div
            animate={{ scale: isOpen ? 0 : 1, rotateZ: isOpen ? 80 : 0 }}
            className="pointer-events-none absolute h-4 w-0.5 rounded-full bg-foreground"
            style={{ transformOrigin: "center" }}
            transition={transition}
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
  transition = { type: "spring", stiffness: 150, damping: 22 },
  ...props
}: AccordionContentProps) {
  const { isOpen } = useAccordionItem();

  return (
    <AnimatePresence>
      {isOpen && (
        <AccordionContentPrimitive forceMount {...props}>
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
            transition={transition}
            {...props}
          >
            <div className={cn("pt-0 pb-4 text-sm leading-[1.5]", className)}>
              {children}
            </div>
          </motion.div>
        </AccordionContentPrimitive>
      )}
    </AnimatePresence>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
