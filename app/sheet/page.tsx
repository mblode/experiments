import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { SheetBlock } from "./sheet-block";

export const metadata = getExperimentMetadata("sheet");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="sheet" />
        <SheetBlock />
      </div>
    </div>
  );
}
