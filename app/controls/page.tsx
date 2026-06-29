import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { ControlsBlock } from "./controls-block";

export const metadata = getExperimentMetadata("controls");

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-8">
        <Header id="controls" />
      </div>

      <ControlsBlock />
    </div>
  );
}
