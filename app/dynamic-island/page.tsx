import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { DynamicIslandBlock } from "./dynamic-island-block";

export const metadata = getExperimentMetadata("dynamic-island");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="dynamic-island" />
        <DynamicIslandBlock />
      </div>
    </div>
  );
}
