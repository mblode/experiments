"use client";

import { Eye, EyeOff } from "blode-icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  useId,
  useState,
} from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  showStrength?: boolean;
}

/**
 * Colour is never the only signal here: the bar count, the stepped bar heights
 * and the label all say the same thing. Bar colours are literal rgb because
 * Motion interpolates them frame by frame; the text tones are tokens with a
 * dark twin so they stay legible on either scheme.
 */
const EMPTY_BAR = "rgba(120, 120, 128, 0.35)";

const STRENGTH_LEVELS = [
  {
    label: "Password strength",
    bar: EMPTY_BAR,
    text: "text-muted-foreground",
  },
  {
    label: "Weak password",
    bar: "rgb(239, 68, 68)",
    text: "text-red-700 dark:text-red-400",
  },
  {
    label: "Moderate password",
    bar: "rgb(249, 115, 22)",
    text: "text-orange-700 dark:text-orange-400",
  },
  {
    label: "Strong password",
    bar: "rgb(34, 197, 94)",
    text: "text-green-700 dark:text-green-400",
  },
];

const BAR_HEIGHTS = ["h-1.5", "h-2.5", "h-3.5"];

/**
 * Length only, and deliberately so — the demo is about the feedback, not the
 * scoring. Anything shipped needs a real estimator running on a value that
 * never leaves the page.
 */
function getStrength(password: string): number {
  const { length } = password;

  if (length === 0) {
    return 0;
  }
  if (length <= 4) {
    return 1;
  }
  if (length <= 9) {
    return 2;
  }
  return 3;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      showStrength = false,
      value,
      onChange,
      id,
      "aria-describedby": describedBy,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [uncontrolledValue, setUncontrolledValue] = useState("");
    const reduced = useReducedMotion() ?? false;
    const meterId = useId();

    // One source of truth: the controlled value when there is one, otherwise
    // what the input last reported. Strength is derived, never stored.
    const password = value === undefined ? uncontrolledValue : String(value);
    const level = getStrength(password);
    const strength = STRENGTH_LEVELS[level];

    const announcement =
      level === 0
        ? "Password strength will appear as you type"
        : `${strength.label}, ${level} of 3`;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setUncontrolledValue(event.target.value);
      }
      onChange?.(event);
    };

    return (
      <div className="space-y-3">
        <div className="relative">
          <Input
            aria-describedby={
              showStrength
                ? [describedBy, meterId].filter(Boolean).join(" ")
                : describedBy
            }
            className={cn("pr-12", className)}
            data-1p-ignore
            id={id}
            onChange={handleChange}
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={value}
            {...props}
          />
          <button
            aria-controls={id}
            aria-label="Show password"
            aria-pressed={showPassword}
            className="-translate-y-1/2 absolute top-1/2 right-2 flex size-9 cursor-pointer items-center justify-center rounded-[4px] text-muted-foreground transition-colors duration-200 ease hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            onClick={() => setShowPassword((previous) => !previous)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>

        {showStrength && (
          <div className="flex items-center gap-2" id={meterId}>
            <div aria-hidden="true" className="flex items-end gap-1">
              {BAR_HEIGHTS.map((height, index) => (
                <motion.span
                  animate={{
                    backgroundColor: index < level ? strength.bar : EMPTY_BAR,
                  }}
                  className={cn("w-1 rounded-full", height)}
                  key={height}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 350, damping: 55 }
                  }
                />
              ))}
            </div>

            <div className={cn("font-medium text-sm", strength.text)}>
              <span className="sr-only" role="status">
                {announcement}
              </span>

              <AnimatePresence initial={false} mode="popLayout">
                <span
                  aria-hidden="true"
                  className="inline-flex"
                  key={strength.label}
                >
                  {strength.label.split("").map((letter, index) => (
                    <motion.span
                      animate={{
                        opacity: 1,
                        filter: "blur(0px)",
                        transition: reduced
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 350,
                              damping: 55,
                              delay: index * 0.012,
                            },
                      }}
                      className="inline-block"
                      exit={{
                        opacity: 0,
                        filter: "blur(2px)",
                        transition: reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 55 },
                      }}
                      initial={{ opacity: 0, filter: "blur(2px)" }}
                      key={index + letter + strength.label}
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                  ))}
                </span>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
