import { MagneticGridBlock } from "./magnetic-grid-block";
import { Header } from "@/components/ui/header";

export default function Page() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mx-auto max-w-5xl">
        <Header id="magnetic-grid" />
        <MagneticGridBlock />
      </div>
    </div>
  );
}
