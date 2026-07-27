import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { AnimatedButtonBlock } from "./animated-button-block";

export const metadata = getExperimentMetadata("animated-button");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="animated-button" />
        <AnimatedButtonBlock />
      </div>
    </div>
  );
}
