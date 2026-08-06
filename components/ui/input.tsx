import { CircleXIcon } from "blode-icons-react";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  clearClassName?: string;
  leftAddon?: ReactNode | null;
  rightAddon?: ReactNode | null;
  leftControl?: ReactNode | null;
  rightControl?: ReactNode | null;
  ref?: Ref<HTMLInputElement>;
}

const Input = ({
  ref,
  className,
  clearClassName,
  hasError,
  clearable,
  onClear,
  leftAddon,
  rightAddon,
  leftControl,
  rightControl,
  ...props
}: InputProps) => {
  return (
    <label
      className={cn("relative w-full", {
        "input-group": !!leftAddon || !!rightAddon,
      })}
    >
      {leftAddon && (
        <span className="shrink-0 cursor-pointer">{leftAddon}</span>
      )}

      {leftControl && (
        <div className="absolute top-0 left-0 flex h-full flex-row place-items-center items-center justify-center">
          {leftControl}
        </div>
      )}

      <div className="w-full">
        <input
          className={cn(
            "input flex h-[48px] w-full rounded-xl border border-input bg-input px-4 py-3 font-normal font-sans text-foreground text-sm leading-snug transition-[color,background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground hover:border-ring focus:border-ring focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
            {
              "border-destructive focus:border-destructive focus:ring-destructive/25":
                hasError,
              "pr-9": clearable && !!props.value,
              "hover:border-input! focus:border-input! focus:ring-0!":
                props.readOnly,
            },
            className
          )}
          ref={ref}
          {...props}
        />

        {clearable && !!props.value && (
          <div className="absolute top-0 right-0 flex flex-row gap-1 pr-3">
            <button
              aria-label="clear input"
              className={cn(
                "flex h-[48px] cursor-pointer items-center justify-center p-0! text-muted-foreground",
                clearClassName
              )}
              onClick={() => onClear?.()}
              tabIndex={-1}
              type="button"
            >
              <CircleXIcon
                aria-hidden
                className="size-5 text-muted-foreground/50 transition-colors duration-200 hover:text-muted-foreground motion-reduce:transition-none"
              />
            </button>
          </div>
        )}
      </div>

      {rightControl && (
        <div className="absolute top-0 right-0 flex h-full flex-row place-items-center items-center justify-center">
          {rightControl}
        </div>
      )}

      {rightAddon && (
        <span className="shrink-0 cursor-pointer">{rightAddon}</span>
      )}
    </label>
  );
};

export { Input };
