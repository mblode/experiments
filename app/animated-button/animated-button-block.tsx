import { CheckIcon, ChevronRightIcon } from "blode-icons-react";

import { AnimatedSubscribeButton } from "@/components/ui/animated-subscribe-button";

export const AnimatedButtonBlock = () => {
  return (
    <AnimatedSubscribeButton className="w-36">
      <span className="inline-flex items-center">
        Follow
        <ChevronRightIcon
          aria-hidden
          className="ml-1 size-4 transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </span>
      <span className="inline-flex items-center">
        <CheckIcon aria-hidden className="mr-2 size-4" />
        Subscribed
      </span>
    </AnimatedSubscribeButton>
  );
};
