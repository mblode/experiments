import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { DocumentShadowBlock } from "./document-shadow-block";

export const metadata = getExperimentMetadata("document-shadow");

export default function Page() {
  return (
    <>
      <div className="relative z-[100] bg-background p-8" data-chrome>
        <div className="mx-auto max-w-4xl">
          <Header id="document-shadow" />
        </div>
      </div>
      <DocumentShadowBlock />
    </>
  );
}
