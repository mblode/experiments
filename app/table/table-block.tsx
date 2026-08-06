"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface TableCellHeader {
  type: "header";
  content: string;
  hiddenOnMobile?: boolean;
}

interface TableCellUser {
  type: "user";
  content: string;
}

interface TableCellText {
  type: "text";
  content: string;
}

interface TableCellBadge {
  type: "badge";
  content: string;
  variant: keyof typeof badgeStyles;
  hiddenOnMobile?: boolean;
}

type TableCell =
  | TableCellHeader
  | TableCellUser
  | TableCellText
  | TableCellBadge;
type TableRow = TableCell[];
type TableId = "scale-ups" | "saas-startups" | "smbs" | "investors";

const tables: Record<TableId, TableRow[]> = {
  "scale-ups": [
    [
      { type: "header", content: "Company" },
      { type: "header", content: "Funding Round" },
      { type: "header", content: "Stage" },
      { type: "header", content: "Valuation", hiddenOnMobile: true },
    ],
    [
      { type: "user", content: "TechCorp Inc" },
      { type: "text", content: "Series B" },
      { type: "badge", content: "Growth", variant: "blue" },
      {
        type: "badge",
        content: "$50M",
        variant: "purple",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "DataFlow Systems" },
      { type: "text", content: "Series C" },
      { type: "badge", content: "Expansion", variant: "orange" },
      {
        type: "badge",
        content: "$120M",
        variant: "purple",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "AI Solutions Ltd" },
      { type: "text", content: "Series A" },
      { type: "badge", content: "Early", variant: "yellow" },
      { type: "badge", content: "$15M", variant: "blue", hiddenOnMobile: true },
    ],
  ],
  "saas-startups": [
    [
      { type: "header", content: "Startup" },
      { type: "header", content: "Product" },
      { type: "header", content: "Category" },
      { type: "header", content: "ARR", hiddenOnMobile: true },
    ],
    [
      { type: "user", content: "CloudSync Pro" },
      { type: "text", content: "File Management" },
      { type: "badge", content: "Productivity", variant: "blue" },
      {
        type: "badge",
        content: "$2.4M",
        variant: "purple",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "MetricsFlow" },
      { type: "text", content: "Analytics Dashboard" },
      { type: "badge", content: "Analytics", variant: "orange" },
      {
        type: "badge",
        content: "$1.8M",
        variant: "blue",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "TeamConnect" },
      { type: "text", content: "Communication" },
      { type: "badge", content: "Collaboration", variant: "yellow" },
      {
        type: "badge",
        content: "$850K",
        variant: "cyan",
        hiddenOnMobile: true,
      },
    ],
  ],
  smbs: [
    [
      { type: "header", content: "Business" },
      { type: "header", content: "Industry" },
      { type: "header", content: "Size" },
      { type: "header", content: "Revenue", hiddenOnMobile: true },
    ],
    [
      { type: "user", content: "Local Café Chain" },
      { type: "text", content: "Food & Beverage" },
      { type: "badge", content: "Small", variant: "yellow" },
      {
        type: "badge",
        content: "$2.1M",
        variant: "blue",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "Design Studio LLC" },
      { type: "text", content: "Creative Services" },
      { type: "badge", content: "Medium", variant: "orange" },
      {
        type: "badge",
        content: "$4.5M",
        variant: "purple",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "Tech Repair Co" },
      { type: "text", content: "Technology" },
      { type: "badge", content: "Small", variant: "yellow" },
      {
        type: "badge",
        content: "$1.2M",
        variant: "cyan",
        hiddenOnMobile: true,
      },
    ],
  ],
  investors: [
    [
      { type: "header", content: "Investor" },
      { type: "header", content: "Fund Size" },
      { type: "header", content: "Stage Focus" },
      { type: "header", content: "Portfolio", hiddenOnMobile: true },
    ],
    [
      { type: "user", content: "Venture Capital LP" },
      { type: "text", content: "$250M" },
      { type: "badge", content: "Series A-B", variant: "blue" },
      {
        type: "badge",
        content: "45 cos",
        variant: "purple",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "Growth Equity Fund" },
      { type: "text", content: "$500M" },
      { type: "badge", content: "Growth", variant: "orange" },
      {
        type: "badge",
        content: "28 cos",
        variant: "blue",
        hiddenOnMobile: true,
      },
    ],
    [
      { type: "user", content: "Angel Syndicate" },
      { type: "text", content: "$50M" },
      { type: "badge", content: "Seed", variant: "yellow" },
      {
        type: "badge",
        content: "120 cos",
        variant: "cyan",
        hiddenOnMobile: true,
      },
    ],
  ],
};

const tabs: Array<{ id: TableId; label: string }> = [
  { id: "scale-ups", label: "Scale-ups" },
  { id: "saas-startups", label: "SaaS startups" },
  { id: "smbs", label: "SMBs" },
  { id: "investors", label: "Investors" },
];

/**
 * Badges carry a category, so the hue is doing real work rather than
 * decorating. Each pair is a tinted fill plus a matching border and a text
 * tone dark enough to clear contrast at 10px, with a dark-scheme twin so the
 * row does not stay a pale sticker on a black page.
 */
const badgeStyles = {
  yellow:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200",
  orange:
    "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-200",
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200",
  purple:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-200",
};

// ease-out-quart, per ANIMATION.md
const EASE_OUT: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

/**
 * The cells roll in from above and out below, offset by row and column so the
 * table reads as a wave rather than a single swap. Keep the whole wave inside
 * ~0.5s: the last cell's delay (0.21s) plus its own 0.28s.
 */
function cellAnimation(row: number, column: number, reduced: boolean) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : "-100%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : "100%" },
    transition: {
      duration: reduced ? 0.15 : 0.28,
      delay: reduced ? 0 : 0.03 * row + 0.04 * column,
      ease: EASE_OUT,
    },
  };
}

const cellClasses = (cell: TableCell, colIndex: number) => {
  const hiddenOnMobile =
    (cell.type === "header" || cell.type === "badge") && cell.hiddenOnMobile;

  return cn(
    "flex h-full w-full items-center gap-x-1 truncate border-border border-r border-b pt-2 pb-1.5 font-medium text-[11px] text-secondary-foreground leading-[15px] tracking-[-0.2px]",
    "lg:gap-x-1.5 lg:pt-2.5 lg:pb-[9px] lg:text-sm lg:leading-5 lg:tracking-[-0.28px]",
    colIndex === 0 ? "pl-2.5 lg:pl-4" : "pl-1.5 lg:pl-2",
    hiddenOnMobile && "hidden md:flex"
  );
};

const getRowKey = (row: TableRow) =>
  row.map((cell) => `${cell.type}:${cell.content}`).join("|");

export const TableBlock = () => {
  const [activeTable, setActiveTable] = useState<TableId>("scale-ups");
  const reduced = useReducedMotion() ?? false;
  const tabsId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);

  const tabId = (id: TableId) => `${tabsId}-tab-${id}`;
  const panelId = `${tabsId}-panel`;

  // Roving focus: only the selected tab is a tab stop, arrows move between them.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    const index = tabs.findIndex((tab) => tab.id === activeTable);

    let next = index;
    if (event.key in offsets) {
      next = (index + offsets[event.key] + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setActiveTable(tabs[next].id);
    const buttons =
      tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[next]?.focus();
  };

  const renderCell = (cell: TableCell, rowIndex: number, colIndex: number) => {
    const animation = cellAnimation(rowIndex, colIndex, reduced);

    switch (cell.type) {
      case "header":
        return (
          <motion.div {...animation} className={colIndex === 0 ? "ml-1" : ""}>
            {cell.content}
          </motion.div>
        );

      case "user":
        return (
          <motion.div {...animation} className="relative inline-flex">
            {cell.content}
            <span
              aria-hidden="true"
              className="-left-px absolute bottom-0 h-px w-[calc(100%+2px)] rounded-full bg-border"
            />
          </motion.div>
        );

      case "text":
        return <motion.div {...animation}>{cell.content}</motion.div>;

      case "badge":
        return (
          <motion.div {...animation}>
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-1 py-px font-medium text-[10px] leading-[14px]",
                "lg:rounded-lg lg:px-1.5 lg:text-xs lg:leading-4",
                badgeStyles[cell.variant]
              )}
            >
              {cell.content}
            </span>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          aria-label="Table category"
          className="inline-flex w-max gap-1 rounded-xl bg-muted p-1"
          ref={tablistRef}
          role="tablist"
        >
          {tabs.map((tab) => {
            const selected = activeTable === tab.id;

            return (
              <button
                aria-controls={panelId}
                aria-selected={selected}
                className={cn(
                  "relative cursor-pointer rounded-[10px] px-3 py-1.5 font-medium text-sm transition-colors duration-200 ease",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  selected
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                id={tabId(tab.id)}
                key={tab.id}
                onClick={() => setActiveTable(tab.id)}
                onKeyDown={handleTabKeyDown}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                {selected && (
                  <motion.span
                    className="absolute inset-0 rounded-[10px] bg-background shadow-xs"
                    layoutId={`${tabsId}-indicator`}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38 }
                    }
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-labelledby={tabId(activeTable)}
        className={cn(
          "grid select-none auto-rows-[32px] grid-cols-[118px_1fr_1fr] border-border border-t border-l",
          "md:grid-cols-[118px_1fr_1fr_1fr] lg:auto-rows-[40px] lg:grid-cols-[173px_1fr_1fr_1fr]",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
          // Only fires when a breakpoint changes the track sizes, so the layout
          // cost is a resize rather than every frame of the cell wave.
          "transition-[grid-template-columns] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none"
        )}
        id={panelId}
        role="tabpanel"
        tabIndex={0}
      >
        <AnimatePresence mode="popLayout">
          {tables[activeTable].map((row, rowIndex) => {
            const rowKey = getRowKey(row);

            return row.map((cell, colIndex) => (
              <div
                className={cellClasses(cell, colIndex)}
                key={`${activeTable}-${rowKey}-${cell.type}-${cell.content}`}
              >
                <div className="grid overflow-hidden *:col-start-1 *:row-start-1">
                  {renderCell(cell, rowIndex, colIndex)}
                </div>
              </div>
            ));
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
