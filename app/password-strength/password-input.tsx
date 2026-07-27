"use client";

import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  useEffect,
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

function getPasswordStrength(password: string): {
  bars: number;
  label: string;
  barColor: string;
  textColor: string;
} {
  const length = password.length;

  if (length === 0) {
    return {
      bars: 0,
      label: "Password strength",
      barColor: "bg-gray-300",
      textColor: "text-muted-foreground",
    };
  }

  if (length >= 1 && length <= 4) {
    return {
      bars: 1,
      label: "Weak password",
      barColor: "bg-red-500",
      textColor: "text-red-700",
    };
  }

  if (length >= 5 && length <= 9) {
    return {
      bars: 2,
      label: "Moderate password",
      barColor: "bg-orange-500",
      textColor: "text-orange-700",
    };
  }

  return {
    bars: 3,
    label: "Strong password",
    barColor: "bg-green-500",
    textColor: "text-green-700",
  };
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState("");
    const [strength, setStrength] = useState({
      bars: 0,
      label: "Password strength",
      barColor: "bg-gray-300",
      textColor: "text-muted-foreground",
    });

    // Calculate strength based on internal value when showStrength is enabled
    useEffect(() => {
      if (showStrength) {
        setStrength(getPasswordStrength(internalValue));
      }
    }, [internalValue, showStrength]);

    // Wrap onChange to track internal value for strength calculation
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (showStrength) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            className={cn("pr-10", className)}
            data-1p-ignore
            onChange={handleChange}
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={value}
            {...props}
          />
          <button
            className="absolute top-0 right-0 flex h-full cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {showStrength && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* Vertical bar chart */}
              <div className="flex items-end gap-0.5">
                {[
                  { bar: 1, height: "h-[4px]" },
                  { bar: 2, height: "h-[8px]" },
                  { bar: 3, height: "h-[12px]" },
                ].map(({ bar, height }) => {
                  const getBarColor = () => {
                    if (bar > strength.bars) {
                      return "rgb(209 213 219)";
                    }
                    if (strength.barColor === "bg-red-500") {
                      return "rgb(239 68 68)";
                    }
                    if (strength.barColor === "bg-orange-500") {
                      return "rgb(249 115 22)";
                    }
                    if (strength.barColor === "bg-green-500") {
                      return "rgb(34 197 94)";
                    }
                    return "rgb(209 213 219)";
                  };

                  return (
                    <motion.div
                      animate={{
                        backgroundColor: getBarColor(),
                      }}
                      className={cn("w-1 rounded-sm", height)}
                      key={bar}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 55,
                      }}
                    />
                  );
                })}
              </div>

              {/* Strength label with staggered animation */}
              <div className={cn("font-medium text-sm", strength.textColor)}>
                <AnimatePresence initial={false} mode="popLayout">
                  <span className="inline-flex" key={strength.label}>
                    {strength.label.split("").map((letter, index) => (
                      <motion.span
                        animate={{
                          opacity: 1,
                          filter: "blur(0px)",
                          transition: {
                            type: "spring",
                            stiffness: 350,
                            damping: 55,
                            delay: index * 0.015,
                          },
                        }}
                        className="inline-block"
                        exit={{
                          opacity: 0,
                          filter: "blur(2px)",
                          transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 55,
                          },
                        }}
                        initial={{
                          opacity: 0,
                          filter: "blur(2px)",
                        }}
                        key={index + letter + strength.label}
                      >
                        {letter === " " ? "\u00A0" : letter}
                      </motion.span>
                    ))}
                  </span>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
