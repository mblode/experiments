import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { LightingBlock } from "./lighting-block";

export const metadata = getExperimentMetadata("lighting");

export default function Page() {
  return (
    <>
      <div className="relative z-10 bg-background p-8" data-chrome>
        <div className="mx-auto max-w-4xl">
          <Header className="mb-0!" id="lighting" />
        </div>
      </div>

      <LightingBlock />
    </>
  );
}
