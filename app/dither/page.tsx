import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { DitherBlock } from "./dither-block";

export const metadata = getExperimentMetadata("dither");

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#333319] text-white">
      <div className="relative z-10 mx-auto max-w-4xl px-8 pt-8">
        <Header id="dither" />
      </div>

      <div className="absolute inset-0">
        <DitherBlock />
      </div>
    </div>
  );
}
