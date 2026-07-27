import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { AlbumBlock } from "./album-block";

export const metadata = getExperimentMetadata("album");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="album" />
        <AlbumBlock />
      </div>
    </div>
  );
}
