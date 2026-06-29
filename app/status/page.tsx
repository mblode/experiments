import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { StatusBlock } from "./status-block";

export const metadata = getExperimentMetadata("status");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="status" />

        <StatusBlock />
      </div>
    </div>
  );
}
