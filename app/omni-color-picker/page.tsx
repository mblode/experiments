import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";

import { OmniColorPickerBlock } from "./omni-color-picker-block";

export const metadata = getExperimentMetadata("omni-color-picker");

export default function Page() {
  return (
    <>
      <div className="bg-background p-8" data-chrome>
        <div className="mx-auto max-w-4xl">
          <Header id="omni-color-picker" />
        </div>
      </div>
      <OmniColorPickerBlock />
    </>
  );
}
