import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { QRCodeBlock } from "./qr-code-block";

export const metadata = getExperimentMetadata("qr-code");

export default function Page() {
  return (
    <>
      <div className="bg-background p-8" data-chrome>
        <div className="mx-auto max-w-4xl">
          <Header className="mb-4" id="qr-code" />
        </div>
      </div>

      <QRCodeBlock />
    </>
  );
}
