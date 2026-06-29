import type { ReactNode } from "react";
import { getExperimentMetadata } from "@/lib/seo";

export const metadata = getExperimentMetadata("shuffle-theme");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
