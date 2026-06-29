import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { EditorPage } from "./dnd-kit-page";
import { StoreProvider } from "./stores/store";

export const metadata = getExperimentMetadata("perfect-dnd");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header className="mb-4" id="perfect-dnd" />
        <a
          className="link"
          href="https://github.com/mblode/perfect-dnd"
          rel="noreferrer"
          target="_blank"
        >
          Perfect DnD on GitHub
        </a>
        <StoreProvider>
          <EditorPage />
        </StoreProvider>
      </div>
    </div>
  );
}
