"use client";
import {
  Content as TabsContentPrimitive,
  List as TabsListPrimitive,
  Root as TabsRoot,
  Trigger as TabsTriggerPrimitive,
} from "@radix-ui/react-tabs";
import mergeRefs from "merge-refs";
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";

import { useTabObserver } from "@/hooks/use-tab-observer";
import { cn } from "@/lib/utils";

// Movement within the screen: ease-out-quint, 280ms. The highlight is
// user-initiated, so it should leave the old tab immediately and settle.
const HIGHLIGHT_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const HIGHLIGHT_DURATION = "280ms";

const Tabs = TabsRoot;

type TabsListProps = ComponentProps<typeof TabsListPrimitive> & {
  floatingBgClassName?: string;
  variant?: "default" | "clip-path";
};

function TabsList({
  ref,
  className,
  floatingBgClassName,
  variant = "default",
  children,
  ...props
}: TabsListProps) {
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const { mounted, listRef } = useTabObserver({
    onActiveTabChange: (_, activeTab) => {
      const { offsetWidth: width, offsetLeft: left } = activeTab;
      setLineStyle({ width, left });
      if (!hasInitialized && width > 0) {
        setHasInitialized(true);
      }
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === "clip-path" && mounted && containerRef.current) {
      const { width, left } = lineStyle;
      const container = containerRef.current;
      if (width > 0) {
        const clipLeft = left;
        const clipRight = left + width;
        // Derive the pill radius from the row height so the crop matches the
        // trigger's own rounded-full shape at any control size.
        const radius = container.offsetHeight / 2;
        container.style.clipPath = `inset(0 ${Number(100 - (clipRight / container.offsetWidth) * 100).toFixed(0)}% 0 ${Number((clipLeft / container.offsetWidth) * 100).toFixed(0)}% round ${radius}px)`;
      }
    }
  }, [lineStyle, mounted, variant]);

  if (variant === "clip-path") {
    return (
      <div className="overflow-x-auto">
        <div className="relative inline-block min-w-max">
          <TabsListPrimitive
            className={cn(
              "relative inline-flex items-center justify-start gap-2",
              className
            )}
            ref={mergeRefs(ref, listRef)}
            {...props}
          >
            {children}
          </TabsListPrimitive>

          {/* Inverted clone of the row, cropped to the active tab. `inert`
              keeps it out of the tab order and the accessibility tree; the
              clones also drop the ids Radix derives from `value` so the real
              row keeps unique ones. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-10 overflow-hidden transition-[clip-path,opacity] motion-reduce:transition-none",
              !(mounted && hasInitialized) && "opacity-0"
            )}
            inert
            ref={containerRef}
            style={{
              clipPath: hasInitialized
                ? undefined
                : "inset(0px 100% 0px 0% round 9999px)",
              transitionDuration: HIGHLIGHT_DURATION,
              transitionTimingFunction: HIGHLIGHT_EASING,
            }}
          >
            <TabsListPrimitive
              className={cn(
                "inline-flex items-center justify-start gap-2",
                floatingBgClassName || "bg-blue-500",
                className
              )}
            >
              {Children.map(children, (child) => {
                if (!isValidElement(child)) {
                  return child;
                }
                const element = child as ReactElement;
                return cloneElement(element, {
                  className: cn(
                    (element.props as { className?: string }).className,
                    "text-primary-foreground data-[state=active]:text-primary-foreground"
                  ),
                  tabIndex: -1,
                  id: undefined,
                  "aria-controls": undefined,
                  "aria-hidden": true,
                } as Partial<typeof element.props>);
              })}
            </TabsListPrimitive>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <TabsListPrimitive
        className={cn(
          "relative isolate inline-flex h-10 min-w-max items-center justify-start rounded-xl bg-card p-1 text-muted-foreground",
          className
        )}
        ref={mergeRefs(ref, listRef)}
        {...props}
      >
        {children}
        {/* The indicator has to match each trigger's own width, so width is
            tweened alongside the transform rather than faked with scaleX,
            which would smear the corner radius. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 left-0 -z-10 rounded-lg bg-background shadow-sm transition-[transform,width,opacity] motion-reduce:transition-none",
            mounted && hasInitialized ? "opacity-100" : "opacity-0",
            floatingBgClassName
          )}
          style={{
            transform: `translateX(${lineStyle.left}px)`,
            width: `${lineStyle.width}px`,
            transitionDuration: HIGHLIGHT_DURATION,
            transitionTimingFunction: HIGHLIGHT_EASING,
          }}
        />
      </TabsListPrimitive>
    </div>
  );
}

function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsTriggerPrimitive>) {
  return (
    <TabsTriggerPrimitive
      className={cn(
        "inline-flex flex-shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-sm ring-offset-background transition-[color,background-color] duration-200 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsContentPrimitive>) {
  return (
    <TabsContentPrimitive
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
