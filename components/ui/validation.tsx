import { CheckIcon, TriangleAlertIcon } from "blode-icons-react";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Spinner } from "./spinner";

export const validationVariants = cva(
  "mt-2 flex flex-row items-center text-sm",
  {
    variants: {
      variant: {
        error: "text-destructive",
        warning: "text-yellow-600",
        success: "text-green-600",
        loading: "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
);

type Props = {
  children: ReactNode;
  className?: string;
} & VariantProps<typeof validationVariants>;

export const Validation = ({ children, className, variant }: Props) => {
  return (
    <div className={cn(validationVariants({ variant, className }))}>
      {children}
      {variant === "error" && (
        <TriangleAlertIcon aria-hidden className="ml-1 size-4" />
      )}
      {variant === "success" && (
        <CheckIcon aria-hidden className="ml-1 size-4" />
      )}
      {variant === "warning" && (
        <TriangleAlertIcon aria-hidden className="ml-1 size-4" />
      )}
      {variant === "loading" && (
        <span className="ml-1">
          <Spinner size={16} />
        </span>
      )}
    </div>
  );
};
