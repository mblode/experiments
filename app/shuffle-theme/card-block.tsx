import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";

interface Props {
  id: number;
}

const inputClassName =
  "bg-page-input-background text-page-input-text rounded-page-widget-block border-page-input-border shadow-page-input placeholder:text-page-input-placeholder! h-12! text-base";

export const CardBlock = ({ id }: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const reduced = useReducedMotion() ?? false;
  // Every card ships the same field, so the label needs a target of its own.
  const fieldName = `email-${id}`;

  const hidden = {
    y: reduced ? 0 : 24,
    scale: reduced ? 1 : 0.97,
    opacity: 0,
  };
  const shown = { y: 0, scale: 1, opacity: 1 };

  return (
    <motion.div
      animate={isInView ? shown : hidden}
      className="ft-widget-wrapper size-full rounded-page-widget"
      initial={hidden}
      ref={ref}
      // Each card arrives on its own scroll-in, so there is no extra stagger
      // on top of it — that is the entrance for this container.
      transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
    >
      <div className="size-full rounded-page-widget border-page-widget bg-page-widget-background p-4 text-page-body-text shadow-page-widget backdrop-blur-page-widget">
        <div className="page-heading line-clamp-2 text-left text-lg">
          This is the title {id}
        </div>

        <p className="mt-1 line-clamp-2 text-left">
          This is a description of the content.
        </p>

        <div className="mt-4">
          <FormControl className="mb-3" label="Email" name={fieldName}>
            <Input
              autoComplete="email"
              className={inputClassName}
              id={fieldName}
              name={fieldName}
              placeholder="you@example.com"
              type="email"
            />
          </FormControl>

          <div className="flex gap-2">
            <Button size="block" type="button" variant="blockPrimary">
              Primary
            </Button>

            <Button size="block" type="button" variant="blockSecondary">
              Secondary
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
