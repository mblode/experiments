import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { TimedUndoBlock } from "./timed-undo-block";

export const metadata = getExperimentMetadata("timed-undo");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="timed-undo" />

        <TimedUndoBlock />
      </div>
    </div>
  );
}
