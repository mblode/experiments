import { Header } from "@/components/ui/header";
import { getExperimentMetadata } from "@/lib/seo";
import { PasswordStrengthBlock } from "./password-strength-block";

export const metadata = getExperimentMetadata("password-strength");

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <Header id="password-strength" />
        <PasswordStrengthBlock />
      </div>
    </div>
  );
}
