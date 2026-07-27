import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { TableBlock } from "./table-block";

export const metadata = getExperimentMetadata("table");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="table" />

        <TableBlock />
      </div>
    </div>
  );
}
