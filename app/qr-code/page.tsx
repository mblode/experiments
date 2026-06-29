import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { QRCodeBlock } from "./qr-code-block";

export const metadata = getExperimentMetadata("qr-code");

export default function Page() {
  return (
    <>
      <div className="bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Header className="mb-4" id="qr-code" />
          <a
            className="link"
            href="https://github.com/mblode/beautiful-qr-code"
            rel="noreferrer"
            target="_blank"
          >
            Beautiful QR Code on GitHub
          </a>
        </div>
      </div>

      <QRCodeBlock />
    </>
  );
}
