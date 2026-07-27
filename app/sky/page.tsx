import { getExperimentMetadata } from "@/lib/seo";

import { SkyBlock } from "./sky-block";

export const metadata = getExperimentMetadata("sky");

export default function Page() {
  return <SkyBlock />;
}
