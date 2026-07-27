import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Label } from "./label";
import { Validation } from "./validation";

export interface FormControlProps {
  name: string;
  label?: ReactNode;
  labelRight?: ReactNode;
  error?: ReactNode;
  success?: ReactNode;
  warning?: ReactNode;
  loading?: ReactNode;
  caption?: ReactNode;
  controlLeft?: ReactNode;
  children: ReactNode;
  className?: string;
  validationPosition?: "left" | "right";
  validationClassName?: string;
  captionClassName?: string;
  labelClassName?: string;
}

export const FormControl = ({
  label,
  labelRight,
  controlLeft,
  name,
  caption,
  error,
  loading,
  success,
  warning,
  children,
  className,
  validationPosition = "left",
  validationClassName,
  captionClassName,
  labelClassName,
}: FormControlProps) => {
  return (
    <div className={cn("mb-4 flex flex-col", className)}>
      {(label || labelRight) && (
        <div className="mb-2 flex items-center justify-between gap-1">
          <div>
            {label && (
              <Label
                className={cn("cursor-pointer", labelClassName)}
                htmlFor={name}
              >
                {label}
              </Label>
            )}
          </div>

          <div>{labelRight}</div>
        </div>
      )}

      {children}

      {caption && (
        <span
          className={cn("mt-1 text-muted-foreground text-sm", captionClassName)}
        >
          {caption}
        </span>
      )}

      {controlLeft && <div className="mt-1">{controlLeft}</div>}

      <div
        className={cn("flex flex-row", {
          "justify-end": validationPosition === "right",
          "justify-start": validationPosition === "left",
        })}
      >
        {success && (
          <Validation className={validationClassName} variant="success">
            {success}
          </Validation>
        )}
        {warning && (
          <Validation className={validationClassName} variant="warning">
            {warning}
          </Validation>
        )}
        {error && (
          <Validation className={validationClassName} variant="error">
            {error}
          </Validation>
        )}
        {loading && (
          <Validation className={validationClassName} variant="loading">
            {loading}
          </Validation>
        )}
      </div>
    </div>
  );
};
