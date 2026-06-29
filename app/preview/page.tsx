import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { PreviewBlock } from "./preview-block";

export const metadata = getExperimentMetadata("preview");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="preview" />
        <PreviewBlock />
      </div>
    </div>
  );
}
