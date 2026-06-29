import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import "./styles.css";
import { MoonBlock } from "./moon-block";

export const metadata = getExperimentMetadata("moon");

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060A] text-white">
      <div className="relative z-10 mx-auto max-w-4xl px-8 pt-8">
        <Header id="moon" />
      </div>

      <div className="absolute inset-0">
        <MoonBlock />
      </div>
    </div>
  );
}
