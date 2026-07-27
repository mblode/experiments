import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { MultiStrokeTextBlock } from "./multi-stroke-text-block";

export const metadata = getExperimentMetadata("multi-stroke-text");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="multi-stroke-text" />
        <MultiStrokeTextBlock />
      </div>
    </div>
  );
}
