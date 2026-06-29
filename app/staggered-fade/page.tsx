import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { StaggeredFadeBlock } from "./staggered-fade-block";

export const metadata = getExperimentMetadata("staggered-fade");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="staggered-fade" />
        <StaggeredFadeBlock />
      </div>
    </div>
  );
}
