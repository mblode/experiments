import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { ToastBlock } from "./toast-block";

export const metadata = getExperimentMetadata("toast");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="toast" />
        <ToastBlock />
      </div>
    </div>
  );
}
