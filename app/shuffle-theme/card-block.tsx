import { motion, useInView } from "motion/react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  item: { id: number };
  index?: number;
}

export const CardBlock = ({ item, index = 0 }: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    console.log("Element is in view: ", isInView);
  }, [isInView]);

  const inputClassName =
    "bg-page-input-background text-page-input-text rounded-page-widget-block border-page-input-border shadow-page-input placeholder:text-page-input-placeholder! h-12! text-base";

  return (
    <motion.div
      animate={
        isInView
          ? {
              y: 0,
              scale: 1,
              opacity: 1,
            }
          : {
              y: 30,
              scale: 0.95,
              opacity: 0.3,
            }
      }
      className="ft-widget-wrapper size-full rounded-page-widget text-neutral-900"
      initial={{
        y: 30,
        scale: 0.95,
        opacity: 0.3,
      }}
      ref={ref}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
    >
      <div className="size-full rounded-page-widget border-page-widget bg-page-widget-background p-4 text-page-body-text shadow-page-widget backdrop-blur-page-widget">
        <div className="mb-1 shrink-0">
          <div className="page-heading line-clamp-2 grow text-left text-lg">
            This is the title {item.id}
          </div>
        </div>

        <div className="line-clamp-2 shrink-0 text-left">
          This is a description of the content.
        </div>

        <div className="mb-4">
          <div className="mb-2">
            <Label className="cursor-pointer" htmlFor="email">
              Email
            </Label>
          </div>

          <FormControl name="email">
            <Input
              className={inputClassName}
              name="email"
              placeholder="Email"
              type="email"
            />
          </FormControl>

          <div className="flex gap-2">
            <Button size="block" variant="blockPrimary">
              Primary
            </Button>

            <Button size="block" variant="blockSecondary">
              Secondary
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
