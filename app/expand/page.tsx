import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { ExpandBlock } from "./expand-block";

export const metadata = getExperimentMetadata("expand");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="expand" />
        <ExpandBlock />
      </div>
    </div>
  );
}
