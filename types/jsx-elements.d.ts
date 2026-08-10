import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "css-doodle": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          use?: string;
          seed?: string | number;
          grid?: string;
          "click-to-update"?: boolean | "";
        },
        HTMLElement
      >;
    }
  }
}
