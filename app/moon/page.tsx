import type { CSSProperties } from "react";

import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import "./styles.css";
import { MoonBlock } from "./moon-block";

export const metadata = getExperimentMetadata("moon");

export default function Page() {
  return (
    /*
     * The scene is a night sky, so this route is dark whatever the OS says. The
     * shared tokens follow `prefers-color-scheme`, which in light mode puts a
     * mid-grey `muted-foreground` (and a near-white `border`) on near-black —
     * about 4.2:1 for the Header's 14px prose. Pinning the two the Header uses
     * to their dark values is narrower than restyling the Header.
     */
    <div
      className="relative min-h-screen overflow-hidden bg-[#05060A] text-white"
      style={
        {
          "--muted-foreground": "oklch(0.72 0 0)",
          "--border": "oklch(1 0 0 / 14%)",
        } as CSSProperties
      }
    >
      <div className="relative z-10 mx-auto max-w-4xl px-8 pt-8">
        <Header id="moon" />
      </div>

      <div className="absolute inset-0">
        <MoonBlock />
      </div>
    </div>
  );
}
