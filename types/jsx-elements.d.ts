import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  // biome-ignore lint/style/noNamespace: required to augment React's JSX namespace for custom elements
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
